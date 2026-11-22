import "server-only";
import { randomUUID } from "node:crypto";
import { AuditError, type AuditResult, type RunAuditOptions } from "./types";
import { analyze } from "./analyze";
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
    const a = analyze(ctx);
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
      notes: [...notes, ...a.notes],
    };
  } catch (err) {
    if (err instanceof AuditError) throw err;
    throw new AuditError("unreachable", "Something went wrong while checking this site. Please try again.");
  }
}
