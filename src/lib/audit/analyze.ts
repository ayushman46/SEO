/**
 * Pure analysis: AuditContext → checks, issues, scores, page summaries. No network IO,
 * so it can be exercised end-to-end against HTML fixtures.
 */
import type { AuditIssue, AuditScores, CheckResult, PageSummary } from "./types";
import { unavailable, type AiPhase, type AuditContext, type Check, type CheckOutcome } from "./context";
import { SEO_CHECKS } from "./checks/seo";
import { GEO_CHECKS } from "./checks/geo";
import { performanceCheck } from "./checks/performance";
import { aiClarityOutcome } from "./checks/geo/ai-clarity";
import { isIndexable } from "./checks/seo/indexability";
import { computeScores, finalize } from "./score";

const MAX_TITLE_CHARS = 300;
const MAX_DESCRIPTION_CHARS = 500;

export const ALL_CHECKS: Check[] = [...SEO_CHECKS, ...GEO_CHECKS, performanceCheck];

function runCheck(check: Check, ctx: AuditContext): CheckOutcome | null {
  try {
    return check(ctx);
  } catch {
    return null;
  }
}

const NO_AI: AiPhase = { status: "skipped", reason: "no_key" };

/** Deterministic checks only (no LLM). Feeds the AI prompt and the final assembly. */
export function runChecks(ctx: AuditContext): { outcomes: CheckOutcome[]; notes: string[] } {
  const notes: string[] = [];
  const outcomes: CheckOutcome[] = ALL_CHECKS.map((check, i) => {
    const o = runCheck(check, ctx);
    if (o) return o;
    // A bug in one check must never sink the whole audit.
    notes.push("One check couldn't be completed and was left out of the score.");
    return unavailable(
      { id: `internal.check-${i}`, category: i < SEO_CHECKS.length ? "seo" : i < SEO_CHECKS.length + GEO_CHECKS.length ? "geo" : "performance", label: "Check" },
      "This check couldn't be completed.",
    );
  });
  return { outcomes, notes };
}

/**
 * Deterministic outcomes + the AI phase → checks, issues, scores, page summaries.
 * geo.ai-clarity sits after the other GEO checks; it is "unavailable" (excluded from the
 * score) unless the AI phase produced insights.
 */
export function assemble(
  ctx: AuditContext,
  deterministic: { outcomes: CheckOutcome[]; notes: string[] },
  ai: AiPhase = NO_AI,
): {
  checks: CheckResult[];
  issues: AuditIssue[];
  scores: AuditScores;
  pages: PageSummary[];
  notes: string[];
} {
  const notes = [...deterministic.notes];
  const outcomes = [...deterministic.outcomes];
  let aiOutcome: CheckOutcome;
  try {
    aiOutcome = aiClarityOutcome(ai);
  } catch {
    aiOutcome = aiClarityOutcome({ status: "failed", reason: "error" });
  }
  outcomes.splice(SEO_CHECKS.length + GEO_CHECKS.length, 0, aiOutcome);

  const { checks, issues } = finalize(outcomes);
  const scores = computeScores(checks);

  const pages: PageSummary[] = ctx.pages.map((p) => ({
    // Cap page-controlled strings so a hostile page can't bloat the stored/sealed result.
    // Checks above still saw the full values.
    url: p.url.slice(0, 2_048),
    statusCode: p.statusCode,
    title: p.title === null ? null : p.title.slice(0, MAX_TITLE_CHARS),
    metaDescription: p.metaDescription === null ? null : p.metaDescription.slice(0, MAX_DESCRIPTION_CHARS),
    h1Count: p.h1Count,
    wordCount: p.wordCount,
    indexable: isIndexable(p),
    issueCount: issues.filter((i) => i.affectedUrls.includes(p.url)).length,
  }));

  return { checks, issues, scores, pages, notes };
}

export function analyze(ctx: AuditContext, ai: AiPhase = NO_AI): ReturnType<typeof assemble> {
  return assemble(ctx, runChecks(ctx), ai);
}
