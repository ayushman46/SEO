/**
 * Pure analysis: AuditContext → checks, issues, scores, page summaries. No network IO,
 * so it can be exercised end-to-end against HTML fixtures.
 */
import type { AuditIssue, AuditScores, CheckResult, PageSummary } from "./types";
import { unavailable, type AuditContext, type Check, type CheckOutcome } from "./context";
import { SEO_CHECKS } from "./checks/seo";
import { GEO_CHECKS } from "./checks/geo";
import { performanceCheck } from "./checks/performance";
import { isIndexable } from "./checks/seo/indexability";
import { computeScores, finalize } from "./score";

export const ALL_CHECKS: Check[] = [...SEO_CHECKS, ...GEO_CHECKS, performanceCheck];

function runCheck(check: Check, ctx: AuditContext): CheckOutcome | null {
  try {
    return check(ctx);
  } catch {
    return null;
  }
}

export function analyze(ctx: AuditContext): {
  checks: CheckResult[];
  issues: AuditIssue[];
  scores: AuditScores;
  pages: PageSummary[];
  notes: string[];
} {
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

  const { checks, issues } = finalize(outcomes);
  const scores = computeScores(checks);

  const pages: PageSummary[] = ctx.pages.map((p) => ({
    url: p.url,
    statusCode: p.statusCode,
    title: p.title,
    metaDescription: p.metaDescription,
    h1Count: p.h1Count,
    wordCount: p.wordCount,
    indexable: isIndexable(p),
    issueCount: issues.filter((i) => i.affectedUrls.includes(p.url)).length,
  }));

  return { checks, issues, scores, pages, notes };
}
