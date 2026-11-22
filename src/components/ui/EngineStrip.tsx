import { cx } from "./cx";

/**
 * Bordered strip of engines we check against. TEXT wordmarks only: no logos,
 * no implied endorsement. Scroll-snaps horizontally on small screens inside its
 * own scroller, so the page never overflows.
 */
export function EngineStrip({ label, engines, className }: { label: string; engines: readonly string[]; className?: string }) {
  return (
    <div className={className}>
      <p className="text-center text-kicker font-semibold text-muted uppercase">{label}</p>
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cx(
          "-mx-4 mt-6 snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6",
          "md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden",
          "focus-visible:outline-offset-[-2px]",
        )}
      >
        <ul className="flex w-max border-t border-l border-line md:grid md:w-full md:grid-cols-4 xl:grid-cols-8">
          {engines.map((name) => (
            <li
              key={name}
              className="flex h-20 w-[9.5rem] shrink-0 snap-start items-center justify-center border-r border-b border-line px-4 text-center md:h-24 md:w-auto"
            >
              <span className="text-[0.9375rem] leading-tight font-medium tracking-[-0.01em] text-balance text-ink-2">
                {name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
