import "server-only";
import type { AiDrafts, AiInsights } from "../types";
import type { AiPhase, AuditContext, CheckOutcome } from "../context";
import { chatComplete, type ChatResult } from "./client";
import { computeClarityScore } from "./clarity";
import { getAiConfig, type AiConfig } from "./config";
import { analysisMessages, buildSiteInput, collectSiteFacts, draftsMessages } from "./prompt";
import { EMPTY_DRAFTS, parseModelJson, validateAnalysis, validateDrafts, type Guard } from "./validate";

export const ANALYSIS_MAX_TOKENS = 1_600;
export const DRAFTS_MAX_TOKENS = 1_800;

export interface InsightsOptions {
  /** total ms the LLM phase may take */
  timeoutMs: number;
  signal?: AbortSignal;
  /** injectable for tests */
  fetchImpl?: typeof fetch;
  config?: AiConfig | null;
}

/**
 * Two calls in parallel (they don't depend on each other): analysis (required) and drafts
 * (optional: if it fails, insights still ship with all drafts null). Never throws.
 */
export async function generateAiInsights(
  ctx: AuditContext,
  outcomes: CheckOutcome[],
  opts: InsightsOptions,
): Promise<AiPhase> {
  const config = opts.config === undefined ? getAiConfig() : opts.config;
  if (!config) return { status: "skipped", reason: "no_key" };
  if (opts.signal?.aborted) return { status: "skipped", reason: "aborted" };
  try {
    const facts = collectSiteFacts(ctx, outcomes);
    const input = buildSiteInput(ctx, facts);
    if (input.pageUrls.length === 0) return { status: "failed", reason: "error" };
    const guard: Guard = {
      hostname: ctx.hostname,
      input: input.data,
      pageUrls: input.pageUrls,
      hasLlmsTxt: facts.llmsTxt === "present",
      externalLinks: facts.profileLinks,
    };
    const deadline = Date.now() + Math.max(0, opts.timeoutMs);
    const common = { config, deadline, signal: opts.signal, fetchImpl: opts.fetchImpl };

    const [a, d] = await Promise.all([
      chatComplete({ ...common, messages: analysisMessages(input), maxTokens: ANALYSIS_MAX_TOKENS }),
      chatComplete({
        ...common,
        messages: draftsMessages(input, { hasLlmsTxt: guard.hasLlmsTxt }),
        maxTokens: DRAFTS_MAX_TOKENS,
      }),
    ]);

    if (!a.ok) return failure(a, opts.signal);
    const analysis = validateAnalysis(parseModelJson(a.content), guard);
    if (!analysis) return { status: "failed", reason: "error" };
    const drafts: AiDrafts = d.ok ? (validateDrafts(parseModelJson(d.content), guard) ?? EMPTY_DRAFTS) : EMPTY_DRAFTS;

    const insights: AiInsights = {
      model: a.model,
      readback: analysis.readback,
      businessType: analysis.businessType,
      facts: analysis.facts,
      questions: analysis.questions,
      drafts: { ...drafts },
      clarityScore: computeClarityScore(analysis.facts, analysis.questions, analysis.local),
    };
    return { status: "ok", insights, local: analysis.local };
  } catch {
    return { status: "failed", reason: "error" };
  }
}

function failure(r: Extract<ChatResult, { ok: false }>, signal?: AbortSignal): AiPhase {
  if (r.reason === "aborted" || signal?.aborted) return { status: "failed", reason: "aborted" };
  return { status: "failed", reason: "error" };
}
