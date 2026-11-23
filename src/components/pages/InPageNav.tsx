"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/ui/cx";

export type InPageNavItem = { id: string; label: string };

/**
 * "On this page" navigation. Below lg it is a static block (chips or a list);
 * from lg it is sticky beside the content. Marks the section currently in view
 * with aria-current. Plain anchor links, so it works without JavaScript.
 */
export function InPageNav({
  items,
  label,
  heading,
  variant = "chips",
  className,
}: {
  items: InPageNavItem[];
  /** accessible name of the <nav> */
  label: string;
  /** small visible heading */
  heading: string;
  /** mobile presentation: wrapped chips (services) or a numbered list (legal) */
  variant?: "chips" | "list";
  className?: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const visible = new Map<string, boolean>();
    // match where anchor jumps land: --nav-h plus the 1rem of html scroll-padding
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) * rem || 80;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        const first = items.find((i) => visible.get(i.id));
        if (first) setActive(first.id);
        // back above the first section (e.g. Home key or a jump to the top): nothing is current
        else if (els[0].getBoundingClientRect().top > navH + rem) setActive(null);
      },
      // a band in the upper part of the viewport, below the floating nav
      { rootMargin: `-${Math.round(navH + rem)}px 0px -55% 0px` },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  const list = variant === "list";

  return (
    <nav aria-label={label} className={cx("lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)] lg:self-start", className)}>
      <p className="mb-3 text-kicker font-semibold text-muted uppercase">{heading}</p>
      <ol
        className={cx(
          list
            ? "grid gap-0.5 rounded-card bg-paper p-2 lg:bg-transparent lg:p-0"
            : "flex flex-wrap gap-2 lg:grid lg:gap-0.5",
          "lg:border-l lg:border-line",
        )}
      >
        {items.map((item, i) => {
          const current = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={current ? "location" : undefined}
                className={cx(
                  "group flex gap-3 text-[0.9375rem] leading-snug transition-colors duration-200",
                  list
                    ? "items-baseline rounded-control px-3 py-2.5 text-ink-2 hover:bg-white hover:text-ink"
                    : "min-h-9 items-center rounded-pill bg-white px-4 py-2 text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line-strong)] hover:text-ink lg:items-baseline",
                  // desktop: a quiet vertical rail with a blue marker for the current section
                  "lg:relative lg:-ml-px lg:min-h-0 lg:rounded-l-none lg:rounded-r-control lg:border-l-2 lg:border-transparent lg:bg-transparent lg:px-4 lg:py-2 lg:shadow-none lg:hover:bg-transparent",
                  "aria-[current=location]:lg:border-accent aria-[current=location]:lg:text-ink aria-[current=location]:lg:font-medium",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "font-serif text-[1.0625rem] leading-none text-muted tabular-nums",
                    !list && "hidden lg:inline",
                    current && "lg:text-accent-ink",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
