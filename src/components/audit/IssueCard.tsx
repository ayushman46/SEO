import type { AuditIssue, Effort } from "@/lib/audit/types";
import { auditResultCopy } from "@/content/audit";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/components/ui/cx";
import { displayUrl, issueAnchor, safeHref } from "./format";
import { auditUi } from "./labels";
import { CopyButton } from "./CopyButton";
import { RichText } from "./RichText";
import { IssueActions } from "./quote/IssueActions";
import { auditQuoteCopy } from "@/content/audit";

const effortDots: Record<Effort, number> = { quick: 1, moderate: 2, involved: 3 };

export function EffortMeter({ effort }: { effort: Effort }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cx("h-2.5 w-1 rounded-full", n <= effortDots[effort] ? "bg-ink-2" : "bg-line-strong")} />
        ))}
      </span>
      <span className="max-sm:sr-only">{auditResultCopy.effortLabels[effort]}</span>
    </span>
  );
}

/** A list of affected URLs as external links (http/https only), in a native disclosure. */
export function AffectedUrls({ urls, hostname, open = false }: { urls: string[]; hostname?: string; open?: boolean }) {
  if (urls.length === 0) {
    return <p className="text-xs font-medium text-muted">{auditUi.siteWide}</p>;
  }
  return (
    <details open={open} className="group/urls">
      <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md py-1 text-sm font-medium text-ink-2 hover:text-accent-ink">
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-4 transition-transform duration-200 group-open/urls:rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 3.5 4.5 4.5L6 12.5" />
        </svg>
        {auditUi.affectedPages(urls.length)}
      </summary>
      <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1 pl-6 text-sm">
        {urls.map((url) => {
          const href = safeHref(url);
          const label = displayUrl(url, hostname);
          return (
            <li key={url} className="[overflow-wrap:anywhere]">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-sm text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
                >
                  {label}
                  <span className="sr-only"> {auditUi.opensInNewTab}</span>
                </a>
              ) : (
                <span className="text-ink-2">{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/**
 * A fully detailed issue: why it matters, how to fix, effort, impact and affected pages.
 * T026: the card is a native <details>; its header (severity, category, effort, points
 * and the title heading) is the summary. `collapsible` cards start closed unless the
 * issue is critical or high. The fix steps sit behind a left rule, not in a nested box.
 */
export function IssueCard({
  issue,
  hostname,
  headingLevel = 4,
  urlsOpen = false,
  ticket,
  collapsible = false,
  className,
}: {
  issue: AuditIssue;
  hostname?: string;
  headingLevel?: 3 | 4 | 5 | 6;
  urlsOpen?: boolean;
  /** Markdown ticket for just this issue (full report): adds a "Copy as ticket" button to the fix steps */
  ticket?: string;
  /** start closed when below high severity (full report) */
  collapsible?: boolean;
  className?: string;
}) {
  const H = `h${headingLevel}` as "h3" | "h4" | "h5" | "h6";
  const fixId = `fix-${issue.id.replace(/[^a-z0-9]+/gi, "-")}`;
  const open = !collapsible || issue.severity === "critical" || issue.severity === "high";
  return (
    <article id={issueAnchor(issue.id)} className={cx("rounded-card bg-white shadow-paper ring-1 ring-ink/[0.04]", className)}>
      <details open={open} className="group/issue">
        <summary className="flex cursor-pointer flex-col rounded-card p-5 sm:p-7 [&::-webkit-details-marker]:hidden">
          {/* title first in DOM so the summary's accessible name starts with it; the chip row
              is moved above it visually (R5 #14) */}
          <div className="mt-3 flex items-start justify-between gap-4">
            <H className="font-serif text-title-lg text-balance text-ink">{issue.title}</H>
            <span aria-hidden className="mt-2 shrink-0 text-muted transition-transform duration-200 group-open/issue:rotate-90">
              ›
            </span>
          </div>
          <div className="order-first flex flex-wrap items-center gap-x-3 gap-y-2">
            <Badge tone={issue.severity} dot>
              {auditResultCopy.severityLabels[issue.severity]}
            </Badge>
            <span className="hidden text-xs font-medium text-ink-2 sm:inline">{auditResultCopy.categoryLabels[issue.category]}</span>
            <EffortMeter effort={issue.effort} />
            {issue.impact > 0 ? (
              <span className="ml-auto text-xs font-semibold text-accent-ink tabular-nums" title={auditUi.impactLabel}>
                <span className="sr-only">{auditUi.impactLabel}: </span>
                {/* below 1 the raw value picks "Under +1 pt" (rounding would show 0 or overstate 0.6 as 1) */}
                {auditUi.impact(issue.impact < 1 ? issue.impact : Math.round(issue.impact))}
              </span>
            ) : null}
          </div>
        </summary>
        <div className="px-5 pb-5 sm:px-7 sm:pb-7">
          <p className="max-w-[68ch] text-[0.9375rem] leading-relaxed text-pretty text-muted">
            <span className="sr-only">{auditUi.whyItMatters}: </span>
            <RichText text={issue.description} />
          </p>
          <div
            id={fixId}
            tabIndex={-1}
            className="mt-5 border-l-2 border-ink pl-4 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-kicker font-semibold text-ink-2 uppercase">{auditUi.howToFix}</p>
              {ticket ? <CopyButton text={ticket} label={`${auditQuoteCopy.copyTicket}: ${issue.title}`} /> : null}
            </div>
            <p className="mt-2 max-w-[68ch] text-[0.9375rem] leading-relaxed text-pretty text-ink-2 [overflow-wrap:anywhere]">
              <RichText text={issue.howToFix} />
            </p>
          </div>
          <div className="mt-4">
            <AffectedUrls urls={issue.affectedUrls} hostname={hostname} open={urlsOpen} />
          </div>
          <IssueActions issue={issue} />
        </div>
      </details>
    </article>
  );
}
