import type { AuditIssue, Effort } from "@/lib/audit/types";
import { auditResultCopy } from "@/content/audit";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/components/ui/cx";
import { displayUrl, safeHref } from "./format";
import { auditUi } from "./labels";
import { RichText } from "./RichText";

const effortDots: Record<Effort, number> = { quick: 1, moderate: 2, involved: 3 };

export function EffortMeter({ effort }: { effort: Effort }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cx("h-2.5 w-1 rounded-full", n <= effortDots[effort] ? "bg-ink-2" : "bg-line-strong")} />
        ))}
      </span>
      {auditResultCopy.effortLabels[effort]}
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

/** A fully detailed issue: why it matters, how to fix, effort, impact and affected pages. */
export function IssueCard({
  issue,
  hostname,
  headingLevel = 4,
  urlsOpen = false,
  className,
}: {
  issue: AuditIssue;
  hostname?: string;
  headingLevel?: 3 | 4 | 5 | 6;
  urlsOpen?: boolean;
  className?: string;
}) {
  const H = `h${headingLevel}` as "h3" | "h4" | "h5" | "h6";
  return (
    <article className={cx("rounded-card bg-white p-5 shadow-paper ring-1 ring-ink/[0.04] sm:p-7", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge tone={issue.severity} dot>
          {auditResultCopy.severityLabels[issue.severity]}
        </Badge>
        <span className="rounded-md bg-paper px-1.5 py-0.5 text-xs font-medium text-ink-2">
          {auditResultCopy.categoryLabels[issue.category]}
        </span>
        <EffortMeter effort={issue.effort} />
        {issue.impact > 0 ? (
          <span className="ml-auto text-xs font-semibold text-accent-ink tabular-nums" title={auditUi.impactLabel}>
            <span className="sr-only">{auditUi.impactLabel}: </span>
            {auditUi.impact(Math.round(issue.impact))}
          </span>
        ) : null}
      </div>
      <H className="mt-4 font-serif text-[1.5rem] leading-[1.12] text-balance text-ink sm:text-[1.75rem]">{issue.title}</H>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-pretty text-muted">
        <span className="sr-only">{auditUi.whyItMatters}: </span>
        <RichText text={issue.description} />
      </p>
      <div className="mt-5 rounded-xl bg-paper p-4 shadow-[inset_0_0_0_1px_var(--color-line)] sm:p-5">
        <p className="text-kicker font-semibold text-ink-2 uppercase">{auditUi.howToFix}</p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-ink-2 [overflow-wrap:anywhere]">
          <RichText text={issue.howToFix} />
        </p>
      </div>
      <div className="mt-4">
        <AffectedUrls urls={issue.affectedUrls} hostname={hostname} open={urlsOpen} />
      </div>
    </article>
  );
}
