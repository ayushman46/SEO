import type { AuditScores, Severity } from "@/lib/audit/types";
import { auditResultCopy } from "@/content/audit";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { cx } from "@/components/ui/cx";
import { SEVERITIES } from "./format";
import { auditUi } from "./labels";

const dot: Record<Severity, string> = {
  critical: "bg-critical",
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

/**
 * Overall + SEO/GEO/Performance rings and issue counts. Kept mounted across the
 * partial -> full switch so the rings never re-animate.
 */
export function ScoreSummary({
  scores,
  issueCounts,
  className,
}: {
  scores: AuditScores;
  issueCounts: Record<Severity, number>;
  className?: string;
}) {
  const labels = auditResultCopy.scoreLabels;
  const total = SEVERITIES.reduce((n, s) => n + (issueCounts[s] ?? 0), 0);
  const sub = [
    { key: "seo", label: labels.seo, value: scores.seo },
    { key: "geo", label: labels.geo, value: scores.geo },
    { key: "performance", label: labels.performance, value: scores.performance },
  ] as const;

  return (
    <div className={cx("rounded-panel bg-white p-5 shadow-float ring-1 ring-ink/[0.05] sm:p-8", className)}>
      <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,16rem)] lg:items-center lg:gap-10">
        <ScoreRing value={scores.overall} label={labels.overall} size={132} stroke={9} className="justify-self-center" />

        <ul className="grid grid-cols-3 gap-2 sm:gap-4">
          {sub.map((s) => (
            <li key={s.key} className="flex flex-col items-center gap-2 rounded-xl bg-paper px-1 py-4 text-center">
              <ScoreRing value={s.value} label={s.label} size={68} stroke={6} />
              <span aria-hidden className="text-xs font-medium text-ink-2 sm:text-[0.8125rem]">
                {s.label}
              </span>
              {s.value === null ? <span className="text-[0.6875rem] text-muted">{auditUi.notMeasured}</span> : null}
            </li>
          ))}
        </ul>

        <div className="border-t border-line pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          <p className="text-sm font-medium text-ink">{auditUi.issuesFound(total)}</p>
          <ul aria-label={auditUi.issuesBySeverity} className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 lg:grid-cols-2">
            {SEVERITIES.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-muted">
                <span aria-hidden className={cx("size-2 shrink-0 rounded-full", dot[s])} />
                <span className="font-serif text-2xl leading-none text-ink tabular-nums">{issueCounts[s] ?? 0}</span>
                {auditResultCopy.severityLabels[s]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {scores.performance === null ? (
        <p className="mt-6 flex items-start gap-2.5 rounded-xl bg-paper px-4 py-3 text-sm leading-relaxed text-pretty text-muted">
          <svg aria-hidden viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0 text-ink-2" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 7.25v4M8 4.75v.5" strokeLinecap="round" />
          </svg>
          {auditResultCopy.performanceUnavailable}
        </p>
      ) : null}
    </div>
  );
}
