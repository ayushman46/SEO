"use client";

import { auditQuoteCopy } from "@/content/audit";
import { cx } from "@/components/ui/cx";
import { useQuote } from "./QuoteContext";
import { QuoteTotal, RequestLink } from "./QuoteParts";

/**
 * The running "fix list": a bar fixed to the bottom on phones and tablets, a card in the
 * bottom-right corner from lg. Shown only while something is picked; a spacer of the same
 * height keeps the end of the report clear of it. Plain buttons and links in DOM order,
 * so it is reachable by keyboard; changes are announced by the QuoteProvider's live region.
 * No backdrop-filter or will-change (T011).
 */
export function FixTray({ id }: { id: string }) {
  const q = useQuote();
  const sq = q?.selectionQuote ?? null;
  if (!q || !sq) return null;

  return (
    <>
      <div aria-hidden className="h-56 sm:h-48 lg:h-72" />
      <section
        id={id}
        data-lenis-prevent
        aria-labelledby={`${id}-title`}
        className={cx(
          "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_-18px_rgb(18_30_60/0.35)] sm:px-6",
          "lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-[23rem] lg:rounded-panel lg:border-0 lg:p-6 lg:shadow-float lg:ring-1 lg:ring-ink/[0.06]",
        )}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3 lg:max-w-none">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id={`${id}-title`} className="text-[0.9375rem] font-semibold text-ink">
              {auditQuoteCopy.trayTitle}
              <span className="ml-2 font-normal text-muted tabular-nums">{auditQuoteCopy.trayCount(q.selected.length)}</span>
            </h2>
            <button
              type="button"
              onClick={q.clear}
              className="shrink-0 rounded-sm text-sm font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {auditQuoteCopy.trayClear}
            </button>
          </div>

          <ul className="hidden space-y-1.5 border-y border-line py-3 text-sm lg:block">
            {sq.lines.map((l) => (
              <li key={l.key} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-ink-2">
                  {l.label} <span className="text-muted tabular-nums">({l.covers.length})</span>
                </span>
                <span className="shrink-0 font-medium text-ink tabular-nums">{l.priceText}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-stretch">
            <QuoteTotal quote={sq} compact />
            <RequestLink q={q} quote={sq} className="shrink-0 sm:w-auto lg:w-full">
              {sq.lines.length > 1 || q.selected.length > 1 ? auditQuoteCopy.requestMany : auditQuoteCopy.request}
            </RequestLink>
          </div>
        </div>
      </section>
    </>
  );
}
