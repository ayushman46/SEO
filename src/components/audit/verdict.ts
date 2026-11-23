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
