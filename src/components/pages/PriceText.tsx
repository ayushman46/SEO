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
