"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export type Currency = "usd" | "inr";

/** Panel ids double as the no-JS anchors (e.g. /pricing#india-pricing). */
export const CURRENCY_PANEL_ID: Record<Currency, string> = { usd: "usd-pricing", inr: "india-pricing" };
const ORDER: Currency[] = ["usd", "inr"];
const CHANGE_EVENT = "seenhq:currency";

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
 */
export function CurrencySwitch({
  label,
  intro,
  labels,
  panels,
  className,
}: {
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

  return (
    <div data-currency-root="" data-enhanced={enhanced ? "" : undefined} className={className}>
      <style href="seenhq-currency-switch" precedence="default">
        {NO_JS_CSS}
      </style>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="text-[0.9375rem] text-muted" aria-hidden>
          {intro}
        </span>
        <div
          role="tablist"
          aria-label={label}
          aria-orientation="horizontal"
          className="inline-flex max-w-full items-center gap-1 rounded-pill bg-accent-600 p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_10px_24px_-14px_rgb(26_111_232/0.9)]"
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
                  "relative inline-flex h-9 items-center rounded-pill px-4 text-sm font-medium whitespace-nowrap tabular-nums transition-[background-color,color,box-shadow] duration-300 ease-(--ease-paper) sm:h-10 sm:px-5 sm:text-[0.9375rem]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  selected
                    ? "bg-white text-accent-ink shadow-[0_1px_2px_rgb(17_79_173/0.35),0_4px_10px_-4px_rgb(17_79_173/0.5)]"
                    : "text-white hover:bg-white/[0.14]",
                )}
              >
                {labels[c]}
              </a>
            );
          })}
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
          className="mt-8 scroll-mt-28 rounded-md focus-visible:outline-offset-8"
        >
          {panels[c]}
        </div>
      ))}
    </div>
  );
}
