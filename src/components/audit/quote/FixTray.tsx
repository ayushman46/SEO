"use client";

import { auditQuoteCopy } from "@/content/audit";
import { QUOTE_TEXT } from "@/lib/quote";
import { PriceText } from "@/components/pages/PriceText";
import { useQuote } from "./QuoteContext";
import { RequestLink } from "./QuoteParts";

/**
 * The running "fix list" (T026, R4 findings 4 and 5): one row fixed to the bottom at every
 * width (count and total on the left, Clear and the request button on the right), shown only
 * while something is picked. A spacer of the same height keeps the end of the report clear,
 * and while it is shown `--fix-tray-h` is set on the page (globals.css) so the sticky email
 * gate shrinks above it instead of being covered. Tax and confirm notes live in the quote
 * panel. Plain buttons and links in DOM order; changes are announced by the QuoteProvider's
 * live region. No backdrop-filter or will-change (T011). Wheel input stays native (Lenis).
 */
export function FixTray({ id }: { id: string }) {
  const q = useQuote();
  const sq = q?.selectionQuote ?? null;
  if (!q || !sq) return null;

  return (
    <>
      <div aria-hidden className="h-24" />
      <section
        id={id}
        data-fix-tray
        data-lenis-prevent
        aria-labelledby={`${id}-title`}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_-18px_rgb(18_30_60/0.35)] sm:px-6"
      >
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="sr-only">
              {auditQuoteCopy.trayTitle}
            </h2>
            <p className="truncate text-sm font-semibold text-ink tabular-nums">
              {auditQuoteCopy.trayCount(q.selected.length)} · <PriceText value={sq.totalText} />
            </p>
            {/* the tax note stays with the total; the confirm note shows from sm (one row on phones) */}
            <p className="truncate text-xs text-muted">
              {QUOTE_TEXT.tax}
              {sq.confirmNote ? <span className="hidden sm:inline"> {QUOTE_TEXT.confirm}</span> : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={q.clear}
              className="min-h-10 rounded-sm text-sm font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {auditQuoteCopy.trayClear}
            </button>
            <RequestLink q={q} quote={sq} className="h-11! min-h-0! px-4 sm:px-5">
              {sq.lines.length > 1 || q.selected.length > 1 ? auditQuoteCopy.requestMany : auditQuoteCopy.request}
            </RequestLink>
          </div>
        </div>
      </section>
    </>
  );
}
