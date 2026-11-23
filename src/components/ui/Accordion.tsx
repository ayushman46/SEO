import type { ReactNode } from "react";
import { cx } from "./cx";

export type AccordionItem = { id?: string; title: ReactNode; content: ReactNode };

function Row({
  item,
  name,
  H,
  marker,
}: {
  item: AccordionItem;
  name?: string;
  H: "h2" | "h3" | "h4";
  marker: "plus" | "circle";
}) {
  const circle = marker === "circle";
  return (
    <details name={name} className="group border-b border-line">
      <summary
        className={cx(
          "flex cursor-pointer items-start justify-between gap-6 rounded-sm text-left transition-colors hover:text-accent-ink",
          circle ? "py-6" : "py-5",
        )}
      >
        <H className={cx("text-[1.0625rem] leading-snug font-medium text-pretty", circle && "sm:text-lg")}>
          {item.title}
        </H>
        {circle ? (
          <span
            aria-hidden
            className="relative mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)] transition-colors duration-200 group-open:bg-ink group-open:text-white"
          >
            <span className="absolute h-px w-3 bg-current" />
            <span className="absolute h-3 w-px bg-current transition-transform duration-300 ease-(--ease-paper) group-open:scale-y-0" />
          </span>
        ) : (
          <span aria-hidden className="relative mt-1.5 grid size-3 shrink-0 place-items-center text-muted">
            <span className="absolute h-px w-3 bg-current" />
            <span className="absolute h-3 w-px bg-current transition-transform duration-300 ease-(--ease-paper) group-open:scale-y-0" />
          </span>
        )}
      </summary>
      <div
        className={cx(
          "pr-2 leading-relaxed text-pretty text-muted sm:pr-12",
          circle ? "max-w-3xl pb-7 text-[0.9875rem]" : "max-w-[66ch] pb-6 text-[0.9375rem]",
        )}
      >
        {item.content}
      </div>
    </details>
  );
}

/**
 * FAQ accordion on native <details>/<summary>: keyboard and screen-reader
 * support for free, works without JavaScript. Optional `name` makes it exclusive.
 * T026: with `visible`, only the first N show; the rest sit in one outer
 * <details> ("More questions"). Every answer stays in the HTML (and the JSON-LD).
 */
export function Accordion({
  items,
  name,
  headingLevel = 3,
  visible,
  moreLabel = "More questions",
  marker = "plus",
  className,
}: {
  items: AccordionItem[];
  name?: string;
  headingLevel?: 2 | 3 | 4;
  /** show this many, fold the rest */
  visible?: number;
  moreLabel?: string;
  /** "plus" (default): thin plus. "circle": the home's ringed plus that fills ink when open (v1.1, T033). */
  marker?: "plus" | "circle";
  className?: string;
}) {
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";
  const cut = visible && items.length > visible + 1 ? visible : items.length;
  const shown = items.slice(0, cut);
  const rest = items.slice(cut);
  return (
    <div className={cx("border-t border-line", className)}>
      {shown.map((item, i) => (
        <Row key={item.id ?? i} item={item} name={name} H={H} marker={marker} />
      ))}
      {rest.length ? (
        <details className="group/more">
          <summary className="inline-flex cursor-pointer items-center gap-2 rounded-sm py-5 text-[0.9375rem] font-medium text-ink-2 hover:text-ink">
            {moreLabel}
            <span className="text-muted tabular-nums">({rest.length})</span>
            <span aria-hidden className="text-muted transition-transform duration-200 group-open/more:rotate-90">
              ›
            </span>
          </summary>
          <div className="border-t border-line">
            {rest.map((item, i) => (
              <Row key={item.id ?? `more-${i}`} item={item} name={name} H={H} marker={marker} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
