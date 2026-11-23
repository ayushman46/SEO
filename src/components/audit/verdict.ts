import type { Severity } from "@/lib/audit/types";
import { auditFrontPageCopy } from "@/content/audit";

/**
 * One-line verdict for the report front page (T026, signature moment 2).
 * Deterministic: a band from the overall score, then one clause from the issue
 * counts (critical first, then high, then the rest). Never a promise or alarm.
 */
export function reportVerdict(overall: number | null | undefined, counts: Partial<Record<Severity, number>>): string {
  const c = auditFrontPageCopy;
  if (typeof overall !== "number" || !Number.isFinite(overall)) return c.unavailable;
  const band = c.verdictBands.find((b) => overall >= b.min) ?? c.verdictBands[c.verdictBands.length - 1];
  const critical = counts.critical ?? 0;
  const high = counts.high ?? 0;
  const rest = (counts.medium ?? 0) + (counts.low ?? 0);
  const detail =
    critical > 0
      ? c.verdictDetail.critical(critical)
      : high > 0
        ? c.verdictDetail.high(high)
        : rest > 0
          ? c.verdictDetail.some(rest)
          : c.verdictDetail.none;
  return `${band.label}. ${detail}`;
}

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** The three issues to fix first: most severe, then most points recoverable, then input order. */
export function topFixes<T extends { severity: Severity; impact?: number }>(issues: readonly T[], n = 3): T[] {
  return issues
    .map((issue, i) => ({ issue, i }))
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.issue.severity] - SEVERITY_RANK[b.issue.severity] ||
        (b.issue.impact ?? 0) - (a.issue.impact ?? 0) ||
        a.i - b.i,
    )
    .slice(0, n)
    .map((x) => x.issue);
}
