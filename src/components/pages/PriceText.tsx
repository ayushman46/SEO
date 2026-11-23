import { Fragment } from "react";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { cx } from "@/components/ui/cx";

/**
 * A price string that may contain "[PLACEHOLDER…]" markers and a rupee sign.
 * The loaded Latin subsets of Instrument Serif and Inter have no "₹" glyph, so
 * the sign is set in the system sans (which has it on every current platform)
 * at a slightly smaller size, instead of falling back mid-word to a random
 * serif. Digits use tabular numerals so the ladders line up.
 */
export function PriceText({ value, tone = "light", className }: { value: string; tone?: "light" | "night"; className?: string }) {
  if (!value.includes("₹")) {
    return <PlaceholderText value={value} tone={tone} className={cx("tabular-nums", className)} />;
  }
  const parts = value.split("₹");
  return (
    <span className={cx("tabular-nums", className)}>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <span className="mr-[0.04em] font-sans text-[0.78em] font-normal">
              ₹
            </span>
          ) : null}
          {part ? <PlaceholderText value={part} tone={tone} /> : null}
        </Fragment>
      ))}
    </span>
  );
}

/**
 * A quiet price line such as "Included in the Full audit · $39": the trailing "· $39" never
 * wraps away from the last word onto a line of its own (R5 #11).
 */
export function QualifiedPriceText({ value, className }: { value: string; className?: string }) {
  const at = value.lastIndexOf(" · ");
  if (at < 0) return <PriceText value={value} className={className} />;
  const head = value.slice(0, at);
  const lastSpace = head.lastIndexOf(" ");
  return (
    <span className={className}>
      <PriceText value={head.slice(0, lastSpace + 1)} />
      <span className="whitespace-nowrap">
        <PriceText value={head.slice(lastSpace + 1)} /> · <PriceText value={value.slice(at + 3)} />
      </span>
    </span>
  );
}
