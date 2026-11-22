import { cx } from "@/components/ui/cx";
import { tornBand } from "./torn";

/**
 * A torn paper edge between two sections. Place it directly above a section
 * whose background is `color`; `flip` puts it below a section instead.
 */
export function SectionTear({
  color,
  seed = 3,
  flip = false,
  grain = false,
  className,
}: {
  color: string;
  seed?: number;
  flip?: boolean;
  grain?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cx("relative h-8 w-full sm:h-12", grain && "paper-grain", className)}
      style={{
        backgroundColor: color,
        clipPath: tornBand({ seed, amp: 26, base: 52 }),
        transform: flip ? "scaleY(-1)" : undefined,
      }}
    />
  );
}
