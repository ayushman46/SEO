import type { AuditResult, PartialAuditReport, Severity } from "./types";
import { sortIssues } from "./score";

/** What the browser gets before the email gate: top 3 issues in full, the rest as a teaser. */
export function toPartialReport(result: AuditResult): PartialAuditReport {
  const sorted = sortIssues(result.issues);
  const issueCounts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const i of sorted) issueCounts[i.severity]++;
  return {
    id: result.id,
    finalUrl: result.finalUrl,
    hostname: result.hostname,
    scores: { ...result.scores },
    pagesScanned: result.pages.length,
    issueCounts,
    topIssues: sorted.slice(0, 3).map((i) => ({ ...i, affectedUrls: [...i.affectedUrls] })),
    lockedIssues: sorted.slice(3).map((i) => ({ id: i.id, title: i.title, severity: i.severity, category: i.category })),
    checks: result.checks.map((c) => ({ id: c.id, category: c.category, label: c.label, status: c.status })),
    durationMs: result.durationMs,
    truncated: result.truncated,
  };
}
