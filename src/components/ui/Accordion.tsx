import type { ReactNode } from "react";
import { cx } from "./cx";

export type AccordionItem = { id?: string; title: ReactNode; content: ReactNode };

/**
 * FAQ accordion on native <details>/<summary>: keyboard and screen-reader
 * support for free, works without JavaScript. Optional `name` makes it exclusive.
 */
export function Accordion({
  items,
  name,
  headingLevel = 3,
  className,
}: {
  items: AccordionItem[];
  name?: string;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <div className={cx("border-t border-line", className)}>
      {items.map((item, i) => (
        <details key={item.id ?? i} name={name} className="group border-b border-line">
          <summary className="flex cursor-pointer items-start justify-between gap-6 rounded-sm py-6 text-left transition-colors hover:text-accent-ink">
            <H className="text-[1.0625rem] leading-snug font-medium text-pretty sm:text-lg">{item.title}</H>
            <span
              aria-hidden
              className="relative mt-0.5 grid size-7 shrink-0 place-items-center rounded-full shadow-[inset_0_0_0_1px_var(--color-line-strong)] transition-colors duration-200 group-open:bg-ink group-open:text-white"
            >
              <span className="absolute h-px w-3 bg-current" />
              <span className="absolute h-3 w-px bg-current transition-transform duration-300 ease-(--ease-paper) group-open:scale-y-0" />
            </span>
          </summary>
          <div className="max-w-3xl pr-2 pb-7 text-[0.9875rem] leading-relaxed text-pretty text-muted sm:pr-12">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}
