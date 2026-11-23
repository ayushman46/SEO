"use client";

import { auditQuoteCopy } from "@/content/audit";
import { isFixedSprintOnly, QUOTE_TEXT } from "@/lib/quote";
import { PriceText } from "@/components/pages/PriceText";
import { useQuote } from "./QuoteContext";
import { RequestLink } from "./QuoteParts";

/**
 * While the tray is mounted and visible: marks <html> with `data-fix-tray-open` and publishes the
 * tray's real height as `--fix-tray-h`. Both are removed in the ref cleanup, which also runs when
 * a kept-alive route is hidden (cacheComponents), so the reserve never outlives the visible tray
 * (R7 #21).
 */
function trackTrayHeight(el: HTMLElement | null) {
  if (!el || typeof ResizeObserver === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-fix-tray-open", "");
  const set = () => root.style.setProperty("--fix-tray-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
  set();
  const ro = new ResizeObserver(set);
  ro.observe(el);
  return () => {
    ro.disconnect();
    root.style.removeProperty("--fix-tray-h");
    root.removeAttribute("data-fix-tray-open");
  };
}

/**
 * The running "fix list" (T026, R4 findings 4 and 5; R5 findings 2 and 3): fixed to the
 * bottom at every width, shown only while something is picked. From sm it is one row (count,
 * total, tax and the Fix sprint explainer on the left; Clear and the request button on the
 * right). The explainer shows only when the pick is one fixed-price Fix sprint. Below sm the count and total keep one full line with Clear beside them, the tax note
 * sits under them, the explainer drops, and the request button takes its own full-width row.
 *
 * The tray's measured height is published as `--fix-tray-h` (ResizeObserver), and globals.css
 * keys off the `data-fix-tray-open` attribute the tray sets on <html> while mounted and visible: `scroll-padding-bottom` on html, so focused controls and
 * anchor jumps are never scrolled behind it (WCAG 2.2 SC 2.4.11), `padding-bottom` on body so
 * the end of the page (footer included) can scroll clear, and the sticky email gate's max
 * height. Plain buttons and links in DOM order; changes are announced by the QuoteProvider's
 * live region. No backdrop-filter or will-change (T011). Wheel input stays native (Lenis).
 */
export function FixTray({ id }: { id: string }) {
  const q = useQuote();
  const sq = q?.selectionQuote ?? null;
  if (!q || !sq) return null;

  return (
    <section
      ref={trackTrayHeight}
      id={id}
      data-fix-tray
      data-lenis-prevent
      aria-labelledby={`${id}-title`}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_-18px_rgb(18_30_60/0.35)] sm:px-6"
    >
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap sm:gap-x-4">
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="sr-only">
            {auditQuoteCopy.trayTitle}
          </h2>
          <p className="text-sm font-semibold whitespace-nowrap text-ink tabular-nums">
            {auditQuoteCopy.trayCount(q.selected.length)} · <PriceText value={sq.totalText} />
          </p>
          <p className="truncate text-xs text-muted">
            {QUOTE_TEXT.tax}
            {sq.confirmNote ? <span className="hidden sm:inline"> {QUOTE_TEXT.confirm}</span> : null}
          </p>
          {/* Only true for a pick that is one fixed-price Fix sprint (R7 findings 2/9). */}
          {isFixedSprintOnly(sq) ? (
            <p className="hidden truncate text-xs text-ink-2 sm:block">
              <PriceText value={auditQuoteCopy.fixListExplainer(q.currency)} />
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={q.clear}
          className="min-h-11 shrink-0 rounded-sm text-sm font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {auditQuoteCopy.trayClear}
        </button>
        <RequestLink q={q} quote={sq} className="h-11! min-h-0! px-4 max-sm:w-full sm:shrink-0 sm:px-5">
          {sq.lines.length > 1 || q.selected.length > 1 ? auditQuoteCopy.requestMany : auditQuoteCopy.request}
        </RequestLink>
      </div>
    </section>
  );
}
