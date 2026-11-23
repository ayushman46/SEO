"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export type Currency = "usd" | "inr";

/** Panel ids double as the no-JS anchors (e.g. /pricing#india-pricing). */
export const CURRENCY_PANEL_ID: Record<Currency, string> = { usd: "usd-pricing", inr: "india-pricing" };
const ORDER: Currency[] = ["usd", "inr"];
const CHANGE_EVENT = "noticr:currency";

/*
 * The choice lives in the URL hash only (#india-pricing = rupees, no hash = USD):
 * no cookies, no geo-IP, no search params (so /pricing stays fully static under
 * cacheComponents). Read through useSyncExternalStore so the server snapshot
 * (USD, not enhanced) hydrates without a mismatch.
 */
function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
const readHash = () => window.location.hash;
const serverHash = () => "";
const noopSubscribe = () => () => {};

function currencyFromHash(hash: string): Currency {
  return hash === `#${CURRENCY_PANEL_ID.inr}` ? "inr" : "usd";
}

/*
 * Without JS the tabs are plain in-page links and CSS :target picks the panel
 * (USD by default). Once hydrated, `data-enhanced` switches CSS off and the
 * `hidden` attribute takes over.
 */
const NO_JS_CSS = `
[data-currency-root]:not([data-enhanced]) #${CURRENCY_PANEL_ID.inr}:not(:target){display:none}
[data-currency-root]:not([data-enhanced]):has(#${CURRENCY_PANEL_ID.inr}:target) #${CURRENCY_PANEL_ID.usd}{display:none}
`;

/**
 * USD / India ₹ segmented switch (WAI-ARIA tabs, automatic activation), styled
 * like the shared Tabs bar. Both price sets are server-rendered; this island
 * only toggles which one is visible. Keyboard: Left/Right (wraps), Home, End,
 * Enter/Space. Roving tabindex.
 *
 * `variant="text"` (T026, the pricing rate card): a header strip with `heading`
 * on the left and the choice set as text on the right (the selected one
 * underlined in ink and accent); panels follow flush, inside the same sheet.
 */
export function CurrencySwitch({
  label,
  intro,
  labels,
  panels,
  className,
  variant = "segmented",
  heading,
  panelClassName,
}: {
  variant?: "segmented" | "text";
  /** left side of the text variant's header strip */
  heading?: ReactNode;
  panelClassName?: string;
  /** Accessible name of the tablist. */
  label: string;
  /** Visible lead-in text before the switch. */
  intro: string;
  labels: Record<Currency, string>;
  panels: Record<Currency, ReactNode>;
  className?: string;
}) {
  const enhanced = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const hash = useSyncExternalStore(subscribe, readHash, serverHash);
  const active = currencyFromHash(hash);
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  function select(next: Currency) {
    const url = `${window.location.pathname}${window.location.search}${next === "inr" ? `#${CURRENCY_PANEL_ID.inr}` : ""}`;
    // replaceState: no scroll jump and no extra history entries for a view toggle.
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  function onClick(e: MouseEvent<HTMLAnchorElement>, c: Currency) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    select(c);
  }

  function onKeyDown(e: KeyboardEvent<HTMLAnchorElement>, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % ORDER.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + ORDER.length) % ORDER.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = ORDER.length - 1;
    else if (e.key === " " || e.key === "Spacebar") next = index;
    if (next < 0) return;
    e.preventDefault();
    select(ORDER[next]);
    tabRefs.current[next]?.focus();
  }

  const tabId = (c: Currency) => `currency-tab-${c}`;
  const text = variant === "text";

  return (
    <div data-currency-root="" data-enhanced={enhanced ? "" : undefined} className={className}>
      <style href="noticr-currency-switch" precedence="default">
        {NO_JS_CSS}
      </style>
      <div
        className={
          text
            ? "flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line-strong px-5 py-4 sm:px-7"
            : "flex flex-wrap items-center gap-x-4 gap-y-3"
        }
      >
        {text && heading ? <div className="text-kicker font-semibold text-ink uppercase">{heading}</div> : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={text ? "text-sm text-muted" : "text-[0.9375rem] text-muted"} aria-hidden>
          {intro}
        </span>
        <div
          role="tablist"
          aria-label={label}
          aria-orientation="horizontal"
          className={
            text
              ? "inline-flex max-w-full items-center gap-1"
              : "inline-flex max-w-full items-center gap-1 rounded-pill bg-paper-2 p-1 shadow-[inset_0_0_0_1px_var(--color-line)]"
          }
        >
          {ORDER.map((c, i) => {
            const selected = c === active;
            return (
              <a
                key={c}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                href={`#${CURRENCY_PANEL_ID[c]}`}
                role="tab"
                id={tabId(c)}
                aria-selected={selected}
                aria-controls={CURRENCY_PANEL_ID[c]}
                tabIndex={enhanced && !selected ? -1 : 0}
                onClick={(e) => onClick(e, c)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cx(
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  text
                    ? cx(
                        "inline-flex min-h-10 items-center rounded-sm px-1.5 text-sm font-medium whitespace-nowrap decoration-accent decoration-2 underline-offset-[6px] transition-colors",
                        selected ? "text-ink underline" : "text-muted hover:text-ink",
                      )
                    : cx(
                        "relative inline-flex h-9 items-center rounded-pill px-4 text-sm font-medium whitespace-nowrap tabular-nums transition-[background-color,color,box-shadow] duration-300 ease-(--ease-paper) sm:h-10 sm:px-5 sm:text-[0.9375rem]",
                        selected ? "bg-white text-ink shadow-paper" : "text-ink-2 hover:text-ink",
                      ),
                )}
              >
                {labels[c]}
              </a>
            );
          })}
        </div>
        </div>
      </div>

      {ORDER.map((c) => (
        <div
          key={c}
          role="tabpanel"
          id={CURRENCY_PANEL_ID[c]}
          aria-labelledby={tabId(c)}
          hidden={enhanced ? c !== active : undefined}
          tabIndex={-1}
          // R6 finding 5: tabIndex -1 makes the panel the focus target when the page opens at its
          // hash (#india-pricing), and Chrome then drew a ring round the whole price table. Tab never
          // lands here (tabIndex -1), and the tabs keep their own ring, so the panel draws none.
          className={cx(text ? "rounded-md" : "mt-8 rounded-md", "focus:outline-none focus-visible:outline-none", panelClassName)}
        >
          {panels[c]}
        </div>
      ))}
    </div>
  );
}
