import Link from "next/link";
import type { AuditScores, Severity } from "@/lib/audit/types";
import { auditFrontPageCopy, auditResultCopy } from "@/content/audit";
import { cx } from "@/components/ui/cx";
import { SEVERITIES, issueAnchor } from "./format";
import { auditUi } from "./labels";
import { reportVerdict } from "./verdict";

const dot: Record<Severity, string> = {
  critical: "bg-critical",
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

export type FrontPageIssue = { id: string; title: string; severity: Severity };

/** 2 px data bar: paper track, accent fill scaled (transform only, no animation). */
function Bar({ value, className }: { value: number | null; className?: string }) {
  return (
    <span aria-hidden className={cx("block h-0.5 w-full overflow-hidden bg-paper-2", className)}>
      {value !== null ? (
        <span
          className="block h-full w-full origin-left bg-accent"
          style={{ transform: `scaleX(${Math.max(0, Math.min(100, value)) / 100})` }}
        />
      ) : null}
    </span>
  );
}

/**
 * The report's front page (T026, signature moment 2): one large serif score, a
 * one-line verdict computed from the result, ruled sub-scores (SEO, GEO,
 * Performance or "not measured", AI readability when present) and the top three
 * fixes as numbered headlines linking to their issues. Replaces the four rings.
 * Score names stay "<label>: <n> out of 100" (as the rings had them). Kept
 * mounted across the partial -> full switch.
 */
export function ScoreSummary({
  scores,
  issueCounts,
  topIssues = [],
  aiClarity = null,
  className,
}: {
  scores: AuditScores;
  issueCounts: Record<Severity, number>;
  /** in priority order; the first three are shown */
  topIssues?: readonly FrontPageIssue[];
  /** AI readability (clarity) score, when the AI reading ran */
  aiClarity?: number | null;
  className?: string;
}) {
  const labels = auditResultCopy.scoreLabels;
  const fp = auditFrontPageCopy;
  const total = SEVERITIES.reduce((n, s) => n + (issueCounts[s] ?? 0), 0);
  const sub: { key: string; label: string; value: number | null }[] = [
    { key: "seo", label: labels.seo, value: scores.seo },
    { key: "geo", label: labels.geo, value: scores.geo },
    { key: "performance", label: labels.performance, value: scores.performance },
    ...(typeof aiClarity === "number" ? [{ key: "ai", label: fp.aiReadability, value: aiClarity }] : []),
  ];
  const top = topIssues.slice(0, 3);

  return (
    <div className={cx("rounded-panel bg-white p-5 shadow-float ring-1 ring-ink/[0.05] sm:p-8 lg:p-10", className)}>
      <div className="grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-14">
        {/* the number */}
        <div className="min-w-0 lg:max-w-[22rem]">
          <p className="text-kicker font-semibold text-muted uppercase">{labels.overall}</p>
          <p
            role="img"
            aria-label={`${labels.overall}: ${scores.overall} out of 100`}
            className="mt-3 flex items-baseline gap-3"
          >
            <span aria-hidden className="font-serif text-[clamp(6rem,15vw,11rem)] leading-[0.8] tracking-[-0.03em] text-ink tabular-nums">
              {scores.overall}
            </span>
            <span aria-hidden className="text-sm text-muted">
              /100
            </span>
          </p>
          <Bar value={scores.overall} className="mt-5" />
          <p className="mt-5 max-w-[34ch] font-serif text-title text-balance text-ink">
            {reportVerdict(scores.overall, issueCounts)}
          </p>
          <p className="mt-4 text-sm">
            <Link
              href="/methodology#scores"
              className="rounded-sm text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
            >
              {auditUi.howWeScore}
            </Link>
          </p>
        </div>

        <div className="min-w-0">
          {/* ruled sub-scores */}
          <ul
            className={cx(
              "grid divide-line border-y border-line max-sm:divide-y sm:divide-x",
              sub.length > 3 ? "sm:grid-cols-4" : "sm:grid-cols-3",
            )}
          >
            {sub.map((s) => (
              <li key={s.key} className="min-w-0 py-4 sm:px-5 sm:first:pl-0 sm:last:pr-0">
                <p className="text-kicker font-semibold text-muted uppercase">{s.label}</p>
                <p
                  role="img"
                  aria-label={s.value === null ? `${s.label}: unavailable` : `${s.label}: ${s.value} out of 100`}
                  className="mt-2 font-serif text-display-sm leading-none text-ink tabular-nums"
                >
                  <span aria-hidden>{s.value ?? "–"}</span>
                </p>
                {s.value === null ? (
                  <p className="mt-2 text-xs text-muted">{fp.notMeasured}</p>
                ) : (
                  <Bar value={s.value} className="mt-3" />
                )}
              </li>
            ))}
          </ul>

          {/* counts */}
          <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <p className="text-sm font-medium text-ink">{auditUi.issuesFound(total)}</p>
            <ul aria-label={auditUi.issuesBySeverity} className="flex flex-wrap gap-x-4 gap-y-1">
              {SEVERITIES.map((s) => (
                <li key={s} className="flex items-center gap-1.5 text-sm text-muted">
                  <span aria-hidden className={cx("size-2 shrink-0 rounded-full", dot[s])} />
                  <span className="font-semibold text-ink tabular-nums">{issueCounts[s] ?? 0}</span>
                  {auditResultCopy.severityLabels[s]}
                </li>
              ))}
            </ul>
          </div>

          {/* fix first */}
          {top.length ? (
            <div className="mt-8">
              <p className="text-kicker font-semibold text-ink uppercase">{fp.fixFirstTitle}</p>
              <ol className="mt-3">
                {top.map((issue, i) => (
                  <li key={issue.id} className="border-t border-line">
                    <a
                      href={`#${issueAnchor(issue.id)}`}
                      className="group grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 py-3 sm:grid-cols-[1.75rem_minmax(0,1fr)_auto]"
                    >
                      <span aria-hidden className="font-serif text-title leading-tight text-muted tabular-nums">
                        {i + 1}
                      </span>
                      <span className="font-serif text-title text-balance text-ink transition-colors group-hover:text-accent-ink">
                        {issue.title}
                      </span>
                      <span className="col-start-2 inline-flex items-center gap-1.5 text-xs text-muted sm:col-start-3 sm:self-center">
                        <span aria-hidden className={cx("size-2 rounded-full", dot[issue.severity])} />
                        {auditResultCopy.severityLabels[issue.severity]}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </div>

      {scores.performance === null ? (
        <p className="mt-8 border-l-2 border-line-strong pl-4 text-sm leading-relaxed text-pretty text-muted">
          {auditResultCopy.performanceUnavailable}
        </p>
      ) : null}
    </div>
  );
}
