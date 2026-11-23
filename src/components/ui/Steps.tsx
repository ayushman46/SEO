import { cx } from "./cx";

export type Step = { title: string; body?: string };

/**
 * The one "numbered steps" pattern (T026): a hairline in ink, a muted serif
 * numeral, a semibold title and an optional line of body. `layout="row"` puts
 * them side by side from md (pricing, audit, contact); `"list"` stacks them as
 * plain lines (the home sample-report column). Copes with any count: the row
 * grid uses as many columns as there are steps, up to four.
 */
export function Steps({
  steps,
  layout = "row",
  headingLevel = 3,
  className,
}: {
  steps: readonly Step[];
  layout?: "row" | "list";
  headingLevel?: 3 | 4;
  className?: string;
}) {
  if (steps.length === 0) return null;
  const H = `h${headingLevel}` as "h3" | "h4";
  const cols = ["", "md:grid-cols-1", "md:grid-cols-2", "md:grid-cols-3", "md:grid-cols-2 xl:grid-cols-4"][
    Math.min(steps.length, 4)
  ];
  return (
    <ol className={cx(layout === "row" ? cx("grid gap-8 md:gap-6", cols) : "grid gap-5", className)}>
      {steps.map((step, i) => (
        <li
          key={step.title}
          className={cx(
            "border-t border-ink",
            layout === "row" ? "pt-5" : "grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 pt-4",
          )}
        >
          <span aria-hidden className="font-serif text-title leading-none text-muted tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className={layout === "row" ? "mt-3" : undefined}>
            <H className="text-[1.0625rem] font-semibold text-ink">
              <span className="sr-only">Step {i + 1}: </span>
              {step.title}
            </H>
            {step.body ? (
              <p className="mt-1.5 max-w-[60ch] text-[0.9375rem] leading-relaxed text-pretty text-muted">{step.body}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
