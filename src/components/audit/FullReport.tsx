import type { ReactNode, Ref } from "react";
import type { AuditResult, CoreWebVitals, PageSummary } from "@/lib/audit/types";
import { auditResultCopy } from "@/content/audit";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/components/ui/cx";
import { CheckGrid } from "./CheckGrid";
import { displayUrl, formatMetric, formatNumber, groupIssues, rateMetric, safeHref, type MetricKey, type Rating } from "./format";
import { IssueCard } from "./IssueCard";
import { auditUi } from "./labels";

const ratingTone: Record<Rating, string> = {
  good: "bg-pass-soft text-pass",
  improve: "bg-medium-soft text-medium",
  poor: "bg-critical-soft text-critical",
  none: "bg-low-soft text-low",
};

function SubHeading({ id, children, count }: { id: string; children: ReactNode; count?: number }) {
  return (
    <h4 id={id} className="flex items-baseline gap-3 font-serif text-[1.75rem] leading-tight text-ink sm:text-[2rem]">
      {children}
      {typeof count === "number" ? <span className="font-sans text-sm font-medium text-muted tabular-nums">{count}</span> : null}
    </h4>
  );
}

function Vitals({ cwv }: { cwv: CoreWebVitals | null }) {
  if (!cwv) {
    return (
      <p className="rounded-xl bg-white px-4 py-3 text-sm text-muted shadow-[inset_0_0_0_1px_var(--color-line)]">
        {auditUi.cwvUnavailable}
      </p>
    );
  }
  const metrics: { key: MetricKey; value: number | null }[] = [
    { key: "lcp", value: cwv.lcpMs },
    { key: "cls", value: cwv.cls },
    { key: "inp", value: cwv.inpMs },
    { key: "fcp", value: cwv.fcpMs },
    { key: "tbt", value: cwv.tbtMs },
  ];
  return (
    <>
      <ul className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map(({ key, value }) => {
          const rating = rateMetric(key, value);
          return (
            <li
              key={key}
              className="flex flex-col justify-between gap-3 rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-line)]"
            >
              <span className="text-[0.8125rem] leading-snug font-medium text-ink-2">
                {auditUi.cwvMetrics[key]} <span className="text-muted">({key.toUpperCase()})</span>
              </span>
              <span className="flex flex-wrap items-end justify-between gap-2">
                <span className="font-serif text-[2rem] leading-none text-ink tabular-nums">{formatMetric(key, value)}</span>
                <span className={cx("rounded-pill px-2 py-0.5 text-xs font-semibold", ratingTone[rating])}>
                  {auditUi.cwvRatings[rating]}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">{auditUi.cwvSource}</p>
    </>
  );
}

function PageLink({ page, hostname }: { page: PageSummary; hostname: string }) {
  const href = safeHref(page.url);
  const label = displayUrl(page.url, hostname);
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="rounded-sm font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 [overflow-wrap:anywhere] hover:decoration-accent-ink"
    >
      {label}
      <span className="sr-only"> {auditUi.opensInNewTab}</span>
    </a>
  ) : (
    <span className="font-medium text-ink [overflow-wrap:anywhere]">{label}</span>
  );
}

const yesNo = (v: boolean) => (v ? auditUi.yes : auditUi.no);

/** Pages: a table from lg, stacked cards below. Only one is displayed at a time. */
function Pages({ pages, hostname }: { pages: PageSummary[]; hostname: string }) {
  const c = auditUi.pagesColumns;
  const th = "border-b border-line px-3 py-3 font-medium";
  return (
    <>
      <table className="hidden w-full table-fixed border-separate border-spacing-0 rounded-card bg-white text-left text-sm shadow-[inset_0_0_0_1px_var(--color-line)] lg:table">
        <caption className="sr-only">{auditUi.pagesTitle}</caption>
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className={cx(th, "w-[36%] pl-4")}>
              {c.page}
            </th>
            <th scope="col" className={th}>
              {c.status}
            </th>
            <th scope="col" className={th}>
              {c.indexable}
            </th>
            <th scope="col" className={cx(th, "w-[17%]")}>
              {c.description}
            </th>
            <th scope="col" className={cx(th, "text-right")}>
              {c.h1}
            </th>
            <th scope="col" className={cx(th, "text-right")}>
              {c.words}
            </th>
            <th scope="col" className={cx(th, "pr-4 text-right")}>
              {c.issues}
            </th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p, i) => {
            const line = i < pages.length - 1 && "border-b border-line";
            const cell = cx("px-3 py-3 align-top text-ink-2 tabular-nums", line);
            return (
              <tr key={p.url}>
                <th scope="row" className={cx("py-3 pr-3 pl-4 text-left align-top font-normal", line)}>
                  <PageLink page={p} hostname={hostname} />
                  <span className={cx("mt-0.5 block truncate text-xs", p.title ? "text-muted" : "text-high")}>
                    {p.title ?? auditUi.noTitle}
                  </span>
                </th>
                <td className={cell}>{p.statusCode}</td>
                <td className={cell}>{yesNo(p.indexable)}</td>
                <td className={cx(cell, !p.metaDescription && "text-high")}>{p.metaDescription ? auditUi.yes : auditUi.missing}</td>
                <td className={cx(cell, "text-right")}>{p.h1Count}</td>
                <td className={cx(cell, "text-right")}>{formatNumber(p.wordCount)}</td>
                <td className={cx(cell, "pr-4 text-right font-semibold text-ink")}>{p.issueCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="grid gap-2 md:grid-cols-2 lg:hidden">
        {pages.map((p) => (
          <li key={p.url} className="min-w-0 rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-line)]">
            <PageLink page={p} hostname={hostname} />
            <p className={cx("mt-0.5 text-xs [overflow-wrap:anywhere]", p.title ? "text-muted" : "text-high")}>
              {p.title ?? auditUi.noTitle}
            </p>
            <dl className="mt-3 grid grid-cols-1 gap-x-5 gap-y-1.5 border-t border-line pt-3 text-xs min-[400px]:grid-cols-2">
              {(
                [
                  [c.status, String(p.statusCode)],
                  [c.indexable, yesNo(p.indexable)],
                  [c.description, p.metaDescription ? auditUi.yes : auditUi.missing],
                  [c.h1, String(p.h1Count)],
                  [c.words, formatNumber(p.wordCount)],
                  [c.issues, String(p.issueCount)],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium text-ink tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Everything in the unlocked report, rendered below the (persistent) score summary. */
export function FullReport({
  result,
  headingRef,
  headingId,
}: {
  result: AuditResult;
  headingRef?: Ref<HTMLHeadingElement>;
  headingId: string;
}) {
  const groups = groupIssues(result.issues);
  const ids = {
    issues: `${headingId}-issues`,
    cwv: `${headingId}-cwv`,
    pages: `${headingId}-pages`,
    checks: `${headingId}-checks`,
    notes: `${headingId}-notes`,
  };
  const hasNotes = result.notes.length > 0 || result.truncated;
  const toc = [
    { id: ids.issues, label: auditUi.allIssuesTitle, count: result.issues.length },
    { id: ids.cwv, label: auditUi.cwvTitle },
    { id: ids.pages, label: auditUi.pagesTitle, count: result.pages.length },
    { id: ids.checks, label: auditUi.checksTitle, count: result.checks.length },
    ...(hasNotes ? [{ id: ids.notes, label: auditUi.notesTitle }] : []),
  ];

  return (
    <section aria-labelledby={headingId} className="grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[14rem_minmax(0,1fr)]">
      <div className="lg:col-span-2">
        <Badge tone="pass" dot>
          {auditUi.fullReportUnlocked}
        </Badge>
        <h3 id={headingId} ref={headingRef} tabIndex={-1} className="mt-4 font-serif text-display-sm text-ink scroll-mt-28 rounded-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          {auditUi.fullReportTitle}
        </h3>
      </div>

      <nav aria-label={auditUi.fullReportTitle} className="hidden lg:block">
        <ul className="sticky top-28 space-y-0.5 border-l border-line">
          {toc.map((t) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                className="-ml-px flex items-baseline justify-between gap-2 border-l border-transparent py-1.5 pr-1 pl-4 text-sm text-muted transition-colors hover:border-ink hover:text-ink"
              >
                {t.label}
                {typeof t.count === "number" ? <span className="text-xs tabular-nums">{t.count}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-16 sm:space-y-20">
        {/* Issues, by category then severity */}
        <div className="space-y-12">
          <SubHeading id={ids.issues} count={result.issues.length}>
            {auditUi.allIssuesTitle}
          </SubHeading>
          {groups.map((g) => {
            const gid = `${ids.issues}-${g.category}`;
            return (
              <div key={g.category} role="group" aria-labelledby={gid}>
                <h5 id={gid} className="border-b border-ink pb-3 text-kicker font-semibold text-ink uppercase">
                  {auditUi.categoryIssues(auditResultCopy.categoryLabels[g.category], g.count)}
                </h5>
                {g.count === 0 ? (
                  <p className="mt-4 text-sm text-muted">{auditUi.noIssues}</p>
                ) : (
                  <div className="mt-5 space-y-8">
                    {g.bySeverity.map((s) => (
                      <div key={s.severity}>
                        <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted">
                          <Badge tone={s.severity} dot>
                            {auditResultCopy.severityLabels[s.severity]}
                          </Badge>
                          <span className="tabular-nums">{s.issues.length}</span>
                        </p>
                        <ul className="space-y-3">
                          {s.issues.map((issue) => (
                            <li key={issue.id}>
                              <IssueCard issue={issue} hostname={result.hostname} headingLevel={6} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <SubHeading id={ids.cwv}>{auditUi.cwvTitle}</SubHeading>
          <div className="mt-5">
            <Vitals cwv={result.coreWebVitals} />
          </div>
        </div>

        <div>
          <SubHeading id={ids.pages} count={result.pages.length}>
            {auditUi.pagesTitle}
          </SubHeading>
          <div className="mt-5">
            <Pages pages={result.pages} hostname={result.hostname} />
          </div>
        </div>

        <div>
          <SubHeading id={ids.checks} count={result.checks.length}>
            {auditUi.checksTitle}
          </SubHeading>
          <CheckGrid checks={result.checks} headingLevel={5} className="mt-5" />
        </div>

        {hasNotes ? (
          <div>
            <SubHeading id={ids.notes}>{auditUi.notesTitle}</SubHeading>
            <ul className="mt-5 space-y-2">
              {result.truncated ? (
                <li className="rounded-xl bg-medium-soft px-4 py-3 text-sm leading-relaxed text-medium">{auditResultCopy.truncatedNote}</li>
              ) : null}
              {result.notes.map((note, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-white px-4 py-3 text-sm leading-relaxed text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line)] [overflow-wrap:anywhere]"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
