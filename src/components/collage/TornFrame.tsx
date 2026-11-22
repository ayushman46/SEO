import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { tornEllipsePair, tornRectPair, type TornEdges } from "./torn";

/**
 * A torn-paper cutout: children are clipped to a jagged outline, sitting on a
 * slightly larger torn paper rim, with a soft paper shadow. Pure CSS clip-path,
 * so it scales with the box and costs no images.
 */
export function TornFrame({
  children,
  seed = 1,
  shape = "rect",
  amp,
  rim = true,
  rimColor = "var(--color-paper-edge)",
  rimWidth,
  edges,
  shadow = "paper",
  rotate = 0,
  className,
  innerClassName,
  style,
}: {
  children: ReactNode;
  seed?: number;
  shape?: "rect" | "ellipse";
  /** tear depth, % of the box */
  amp?: number;
  rim?: boolean;
  rimColor?: string;
  /** rim thickness, % of the box */
  rimWidth?: number;
  edges?: TornEdges;
  shadow?: "paper" | "float" | "none";
  rotate?: number;
  className?: string;
  innerClassName?: string;
  style?: CSSProperties;
}) {
  const ellipse = shape === "ellipse";
  const a = amp ?? (ellipse ? 3 : 3.2);
  const rw = rimWidth ?? (ellipse ? 2.2 : 2.2);
  const { outer, inner } = ellipse
    ? tornEllipsePair({ seed, amp: a, rim: rim ? rw : 0 })
    : tornRectPair({ seed, amp: a, rim: rim ? rw : 0, edges });

  const filter =
    shadow === "paper"
      ? "drop-shadow(0 1px 1px rgb(60 48 20 / 0.18)) drop-shadow(0 10px 18px rgb(30 34 60 / 0.22))"
      : shadow === "float"
        ? "drop-shadow(0 2px 2px rgb(20 30 60 / 0.2)) drop-shadow(0 22px 34px rgb(20 30 60 / 0.32))"
        : undefined;

  return (
    <div
      className={cx(!/(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className ?? "") && "relative", className)}
      style={{ filter, transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
    >
      {rim ? (
        <div aria-hidden className="absolute inset-0" style={{ clipPath: outer, background: rimColor }}>
          <div className="paper-grain absolute inset-0 opacity-70" />
        </div>
      ) : null}
      <div className={cx("relative h-full w-full overflow-hidden", innerClassName)} style={{ clipPath: rim ? inner : outer }}>
        {children}
      </div>
    </div>
  );
}
