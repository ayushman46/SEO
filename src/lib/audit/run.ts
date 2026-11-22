import "server-only";
import { randomUUID } from "node:crypto";
import { AuditError, type AuditResult, type RunAuditOptions } from "./types";
import { assemble, runChecks } from "./analyze";
import type { AiPhase, AuditContext, CheckOutcome, CrawlerProbe, Soft404Probe } from "./context";
import { PROBE_MAX_MS, probeCrawlers } from "./net/probe";
import { probeSoft404, SOFT404_TIMEOUT_MS } from "./net/soft404";
import { generateAiInsights } from "./ai/insights";
import { AI_PHASE_MAX_MS, AI_PHASE_MIN_REMAINING_MS, AI_PHASE_RESERVE_MS, getAiConfig } from "./ai/config";
import { crawl } from "./crawl";
import { normalizeAuditUrl } from "./url";

const DEFAULT_MAX_PAGES = 5;
const DEFAULT_BUDGET_MS = 55_000;
/** Hard ceiling regardless of options (serverless maxDuration is 60 s). */
const MAX_BUDGET_MS = 58_000;

/**
 * Crawl the homepage + up to `maxPages` internal pages and score SEO, GEO and
 * performance. Only ever throws AuditError.
 */
export async function runAudit(url: string, opts: RunAuditOptions = {}): Promise<AuditResult> {
  const startedAt = new Date();
  const t0 = Date.now();
  const requestedUrl = normalizeAuditUrl(url);
  const maxPages = Math.max(0, Math.min(20, Math.floor(opts.maxPages ?? DEFAULT_MAX_PAGES)));
  const budgetMs = Math.max(5_000, Math.min(MAX_BUDGET_MS, Math.floor(opts.budgetMs ?? DEFAULT_BUDGET_MS)));

  try {
    const { ctx, notes, truncated } = await crawl(requestedUrl, { maxPages, budgetMs, signal: opts.signal });
    ctx.now = startedAt;
    const remaining = () => budgetMs - (Date.now() - t0);
    // The live crawler probe (network) runs alongside the deterministic checks and the AI phase.
    const probePromise = runProbe(ctx, remaining(), opts.signal);
    const soft404Promise = runSoft404(ctx, remaining(), opts.signal);
    const det = runChecks(ctx);
    const [ai, probe, soft404] = await Promise.all([
      runAiPhase(ctx, det.outcomes, remaining(), opts.signal),
      probePromise,
      soft404Promise,
    ]);
    const a = assemble(ctx, det, ai, probe, soft404);
    return {
      id: randomUUID(),
      version: 1,
      requestedUrl,
      finalUrl: ctx.finalUrl,
      hostname: ctx.hostname,
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - t0,
      scores: a.scores,
      checks: a.checks,
      issues: a.issues,
      pages: a.pages,
      coreWebVitals: ctx.psi.ok ? ctx.psi.vitals : null,
      truncated,
      notes: [...notes, ...a.notes, ...probeNotes(probe), ...aiNotes(ai)],
      ai: ai.status === "ok" ? ai.insights : null,
    };
  } catch (err) {
    if (err instanceof AuditError) throw err;
    throw new AuditError("unreachable", "Something went wrong while checking this site. Please try again.");
  }
}

/**
 * LLM phase (T014): after crawl + deterministic analysis, gets min(20 s, remaining − 2 s) and is
 * skipped below 6 s remaining. Never throws, never extends the audit past its budget.
 */
async function runAiPhase(
  ctx: AuditContext,
  outcomes: CheckOutcome[],
  remainingMs: number,
  signal?: AbortSignal,
): Promise<AiPhase> {
  const config = getAiConfig();
  if (!config) return { status: "skipped", reason: "no_key" };
  if (signal?.aborted) return { status: "skipped", reason: "aborted" };
  if (remainingMs < AI_PHASE_MIN_REMAINING_MS) return { status: "skipped", reason: "no_time" };
  const timeoutMs = Math.min(AI_PHASE_MAX_MS, remainingMs - AI_PHASE_RESERVE_MS);
  try {
    return await generateAiInsights(ctx, outcomes, { timeoutMs, signal, config });
  } catch {
    return { status: "failed", reason: "error" };
  }
}

function aiNotes(ai: AiPhase): string[] {
  if (ai.status === "ok" || ai.reason === "no_key") return [];
  if (ai.reason === "no_time") return ["There wasn't enough time left for the AI reading of your site, so it was skipped."];
  if (ai.reason === "aborted") return [];
  return ["The AI reading of your site couldn't be completed this time, so it was left out of the score."];
}

/** Probe gets min(6 s, remaining − 2 s); skipped when that is under 3 s. Never throws. */
const PROBE_RESERVE_MS = 2_000;
const PROBE_MIN_MS = 3_000;

async function runProbe(ctx: AuditContext, remainingMs: number, signal?: AbortSignal): Promise<CrawlerProbe> {
  if (signal?.aborted) return { status: "skipped", reason: "aborted" };
  const ms = Math.min(PROBE_MAX_MS, remainingMs - PROBE_RESERVE_MS);
  if (ms < PROBE_MIN_MS) return { status: "skipped", reason: "no_time" };
  try {
    return await probeCrawlers(ctx, { deadline: Date.now() + ms, signal });
  } catch {
    return { status: "skipped", reason: "error" };
  }
}

function probeNotes(p: CrawlerProbe): string[] {
  if (p.status === "inconclusive") {
    return [`Your site refused our own crawler (status ${p.baselineStatus}), so the live AI-crawler test is inconclusive.`];
  }
  if (p.status === "skipped" && p.reason === "no_time") {
    return ["There wasn't enough time left for the live AI-crawler test, so it was skipped."];
  }
  return [];
}

/** One made-up-URL request (T020 N6): min(4 s, remaining − 2 s), skipped under 1.5 s. Never throws. */
async function runSoft404(ctx: AuditContext, remainingMs: number, signal?: AbortSignal): Promise<Soft404Probe> {
  if (signal?.aborted) return { status: "skipped", reason: "aborted" };
  const ms = Math.min(SOFT404_TIMEOUT_MS, remainingMs - 2_000);
  if (ms < 1_500) return { status: "skipped", reason: "no_time" };
  try {
    return await probeSoft404(ctx, { timeoutMs: ms, signal });
  } catch {
    return { status: "skipped", reason: "error" };
  }
}
