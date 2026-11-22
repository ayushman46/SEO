"use client";

import { auditQuoteCopy } from "@/content/audit";
import { buttonClass } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { useQuote } from "./QuoteContext";
import { CurrencyToggle, QuoteTotal, RequestLink } from "./QuoteParts";

/**
 * "Your fixed quote": visible in the partial report, before any email. Every number comes from
 * buildQuote(). The DIY and "safe to ignore" lists are always shown, and "I'll fix it myself"
 * sits beside the request with the same size. No urgency, no discounts, nothing pre-selected.
 */
export function QuotePanel({
  headingId,
  diyHref,
  headingLevel = 3,
  className,
}: {
  headingId: string;
  /** in-page anchor of the issues / fix steps */
  diyHref: string;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const q = useQuote();
  if (!q) return null;
  const { quote } = q;
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";
  const Sub = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const alt = quote.alternatives[0] ?? null;
  const hasLines = quote.lines.length > 0;

  const titleList = (ids: string[], empty: string) =>
    ids.length ? (
      <ul className="mt-3 space-y-1.5 text-sm leading-snug text-ink-2">
        {ids.map((id) => (
          <li key={id} className="flex gap-2">
            <span aria-hidden className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-ink-2/60" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{q.titleOf(id)}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-3 text-sm text-muted">{empty}</p>
    );

  return (
    <section
      aria-labelledby={headingId}
      className={cx("rounded-panel bg-white p-5 shadow-paper ring-1 ring-ink/[0.04] sm:p-8", className)}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <H id={headingId} className="font-serif text-display-sm text-ink">
            {auditQuoteCopy.title}
          </H>
          <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-pretty text-muted">{auditQuoteCopy.intro}</p>
        </div>
        <CurrencyToggle q={q} name={`${headingId}-currency`} className="shrink-0" />
      </div>

      {q.sample ? <p className="mt-4 rounded-xl bg-accent-soft px-4 py-2.5 text-sm text-accent-ink">{auditQuoteCopy.sampleNote}</p> : null}

      {hasLines ? (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {quote.lines.map((line) => (
            <li key={line.key} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{line.label}</p>
                {line.note ? <p className="mt-1 text-sm leading-relaxed text-pretty text-muted">{line.note}</p> : null}
                {line.covers.length ? (
                  <details className="group/cov mt-2">
                    <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-sm font-medium text-ink-2 hover:text-accent-ink">
                      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 transition-transform duration-200 group-open/cov:rotate-90" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 3.5 4.5 4.5L6 12.5" />
                      </svg>
                      {auditQuoteCopy.covers} {line.covers.length} {line.covers.length === 1 ? "issue" : "issues"}
                    </summary>
                    <ul className="mt-2 space-y-1 pl-5 text-sm leading-snug text-ink-2">
                      {line.covers.map((c) => (
                        <li key={c.id} className="list-disc [overflow-wrap:anywhere] marker:text-line-strong">
                          {c.title}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
              <p className="font-serif text-[1.5rem] leading-none text-ink tabular-nums sm:text-right">
                {line.priceText}
                {line.unit === "location" ? <span className="ml-1.5 font-sans text-xs text-muted">{auditQuoteCopy.perLocation}</span> : null}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl bg-paper px-4 py-3 text-[0.9375rem] text-ink-2">{auditQuoteCopy.noLines}</p>
      )}

      {quote.bundle ? <p className="mt-4 text-sm leading-relaxed text-pretty text-muted">{quote.bundle.reason}</p> : null}

      {hasLines ? (
        <div className="mt-6">
          <QuoteTotal quote={quote} />
        </div>
      ) : null}

      <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        {hasLines ? (
          <RequestLink q={q} quote={quote}>
            {quote.lines.length > 1 ? auditQuoteCopy.requestMany : auditQuoteCopy.request}
          </RequestLink>
        ) : null}
        <a href={diyHref} className={buttonClass({ variant: "secondary", size: "md", className: "h-auto! min-h-11 py-2 whitespace-normal! text-center" })}>
          {auditQuoteCopy.diy}
          <Icon name="arrow-right" size={18} className="shrink-0 rotate-90" />
        </a>
      </div>

      <div className="mt-8 grid gap-6 border-t border-line pt-6 md:grid-cols-2 md:gap-8">
        <div>
          <Sub className="text-[0.9375rem] font-semibold text-ink">{auditQuoteCopy.diyTitle}</Sub>
          {titleList(quote.diyIssueIds, auditQuoteCopy.diyEmpty)}
        </div>
        <div>
          <Sub className="text-[0.9375rem] font-semibold text-ink">{auditQuoteCopy.ignoreTitle}</Sub>
          {titleList(quote.safeToIgnore, auditQuoteCopy.ignoreEmpty)}
        </div>
      </div>

      {alt ? (
        <div className="mt-8 flex flex-col gap-4 rounded-xl bg-paper p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <Sub className="text-[0.9375rem] font-semibold text-ink">{auditQuoteCopy.alternativeTitle}</Sub>
            <p className="mt-1 text-sm leading-relaxed text-pretty text-ink-2">
              <span className="font-medium">{alt.label}</span>, <span className="tabular-nums">{alt.priceText}</span>. {alt.note}
            </p>
          </div>
          <RequestLink
            q={q}
            quote={{
              ...quote,
              lines: [alt],
              total: alt.price ?? 0,
              totalText: alt.priceText,
              fixedTotal: alt.priceKind === "fixed",
              confirmNote: alt.priceKind === "fixed" ? null : "person-confirms-within-1-business-day",
            }}
            variant="secondary"
            className="shrink-0"
          >
            {auditQuoteCopy.requestAlternative}
          </RequestLink>
        </div>
      ) : null}
    </section>
  );
}
