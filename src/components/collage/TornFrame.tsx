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

  // One drop-shadow per frame (not a stacked contact + ambient pair): every filter
  // pass is an offscreen surface plus a blur, and stacked pairs on every scrap doubled
  // the GPU raster work at load (T011).
  const filter =
    shadow === "paper"
      ? "drop-shadow(0 6px 10px rgb(40 38 50 / 0.24))"
      : shadow === "float"
        ? "drop-shadow(0 14px 22px rgb(20 30 60 / 0.34))"
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
