"use client";

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "./cx";

export type TabItem = {
  id: string;
  label: string;
  /** Panel content (the tabpanel). */
  content: ReactNode;
  /** Optional illustration shown beside the panel; swaps with the active tab. */
  aside?: ReactNode;
};

const TabsAsideContext = createContext<{ active: string | undefined; items: TabItem[] } | null>(
  null,
);

/**
 * Place inside a Tabs `asideFrame` to show the active item's aside there. Lets
 * one shared illustration (e.g. a collage) host per-tab content, instead of
 * server-rendering and hydrating one full illustration per tab.
 */
export function TabsAsideSlot() {
  const ctx = useContext(TabsAsideContext);
  if (!ctx) return null;
  return ctx.items.map((item) =>
    item.aside ? (
      <div key={item.id} hidden={item.id !== ctx.active}>
        {item.aside}
      </div>
    ) : null,
  );
}

/**
 * Segmented blue tab bar (WAI-ARIA tabs, automatic activation).
 * Keyboard: Left/Right (wraps), Home, End. Roving tabindex.
 * All panels are server-rendered; inactive ones are `hidden`.
 */
export function Tabs({
  items,
  label,
  defaultId,
  className,
  layout = "stack",
  asideFrame,
  tone = "quiet",
}: {
  items: TabItem[];
  /** Accessible name for the tablist. */
  label: string;
  defaultId?: string;
  className?: string;
  /** "split" puts panels left and asides right from lg up. */
  layout?: "stack" | "split";
  /** Shared aside wrapper containing a <TabsAsideSlot />; replaces the per-item aside list. */
  asideFrame?: ReactNode;
  /**
   * "quiet" (default): paper segmented bar used on inner pages.
   * "accent": the home's electric-blue segmented bar (v1.1 look, restored in T033).
   */
  tone?: "quiet" | "accent";
}) {
  const accent = tone === "accent";
  const uid = useId();
  const [active, setActive] = useState(defaultId ?? items[0]?.id);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const tabId = (id: string) => `${uid}-tab-${id}`;
  const panelId = (id: string) => `${uid}-panel-${id}`;

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setActive(items[next].id);
    tabRefs.current[next]?.focus();
  }

  const tablist = (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      className={cx(
        "inline-flex max-w-full items-center gap-1 rounded-pill p-1",
        accent
          ? "bg-accent-600 shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_10px_24px_-14px_rgb(26_111_232/0.9)]"
          : "bg-paper-2 shadow-[inset_0_0_0_1px_var(--color-line)]",
      )}
    >
      {items.map((item, i) => {
        const selected = item.id === active;
        return (
          <button
            key={item.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={tabId(item.id)}
            aria-selected={selected}
            aria-controls={panelId(item.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => setActive(item.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              "relative h-9 rounded-pill px-3.5 text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-300 ease-(--ease-paper) sm:h-10 sm:px-5 sm:text-[0.9375rem]",
              accent
                ? "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                : "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              selected
                ? accent
                  ? "bg-white text-accent-ink shadow-[0_1px_2px_rgb(17_79_173/0.35),0_4px_10px_-4px_rgb(17_79_173/0.5)]"
                  : "bg-white text-ink shadow-paper"
                : accent
                  ? "text-white hover:bg-white/[0.14]"
                  : "text-ink-2 hover:text-ink",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  const panels = items.map((item) => (
    <div
      key={item.id}
      role="tabpanel"
      id={panelId(item.id)}
      aria-labelledby={tabId(item.id)}
      hidden={item.id !== active}
      tabIndex={0}
      className="rounded-md focus-visible:outline-offset-8"
    >
      {item.content}
    </div>
  ));

  const hasAside = items.some((i) => i.aside);

  if (layout === "split" && hasAside) {
    return (
      <div
        className={cx(
          "grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16",
          className,
        )}
      >
        <div className="min-w-0">
          {tablist}
          <div className="mt-10">{panels}</div>
        </div>
        <div className="min-w-0">
          {asideFrame ? (
            <TabsAsideContext value={{ active, items }}>{asideFrame}</TabsAsideContext>
          ) : (
            items.map((item) =>
              item.aside ? (
                <div key={item.id} hidden={item.id !== active}>
                  {item.aside}
                </div>
              ) : null,
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {tablist}
      <div className="mt-8">{panels}</div>
      {hasAside
        ? items.map((item) =>
            item.aside ? (
              <div key={item.id} hidden={item.id !== active} className="mt-10">
                {item.aside}
              </div>
            ) : null,
          )
        : null}
    </div>
  );
}
