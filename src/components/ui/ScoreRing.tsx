"use client";

import { useEffect, useRef } from "react";
import { cx } from "./cx";
import { watchReveal, whenBelowFold } from "./Reveal";

/**
 * SVG score ring with a count-up. Renders the final value on the server; the
 * count-up only runs when the ring starts below the fold and motion is allowed,
 * and snaps to the final value when the ring is reached by a scroll jump.
 */
export function ScoreRing({
  value,
  label,
  size = 120,
  stroke = 8,
  tone = "light",
  animate = true,
  className,
}: {
  /** 0..100, or null when unavailable */
  value: number | null;
  label: string;
  size?: number;
  stroke?: number;
  tone?: "light" | "night";
  animate?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const tickRef = useRef<HTMLSpanElement>(null);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value === null ? 0 : Math.max(0, Math.min(100, Math.round(value)));
  const offset = c * (1 - v / 100);

  useEffect(() => {
    const wrap = wrapRef.current;
    const arc = arcRef.current;
    const num = numRef.current;
    const tickEl = tickRef.current;
    if (!animate || value === null || !wrap || !arc || !num || !tickEl) return;
    return whenBelowFold(wrap, () => {
      // Server HTML already holds the final value. The count-up never touches nodes
      // React owns: it hides the React-rendered number, writes into an empty overlay
      // span, and drives the arc through an inline style. Releasing simply removes
      // those overrides, so whatever React rendered last (the current value) shows.
      const release = () => {
        arc.style.removeProperty("stroke-dashoffset");
        num.style.removeProperty("opacity");
        tickEl.textContent = "";
      };
      arc.style.strokeDashoffset = String(c);
      // opacity (not visibility) keeps the real value in the accessibility tree.
      num.style.opacity = "0";
      tickEl.textContent = "0";
      let raf = 0;
      const cleanup = watchReveal(wrap, (shouldAnimate) => {
        if (!shouldAnimate) return release();
        const start = performance.now();
        const dur = 1300;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          if (t < 1) {
            arc.style.strokeDashoffset = String(c * (1 - (v / 100) * eased));
            tickEl.textContent = String(Math.round(v * eased));
            raf = requestAnimationFrame(tick);
          } else {
            release();
          }
        };
        raf = requestAnimationFrame(tick);
      });
      return () => {
        cleanup();
        cancelAnimationFrame(raf);
        release();
      };
    });
  }, [animate, value, c, v]);

  const night = tone === "night";
  const display = value === null ? "–" : String(v);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={value === null ? `${label}: unavailable` : `${label}: ${v} out of 100`}
      className={cx("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={night ? "stroke-white/15" : "stroke-paper-2"}
        />
        <circle
          ref={arcRef}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-accent"
        />
      </svg>
      <div aria-hidden className="absolute inset-0 grid place-items-center text-center">
        <div className="flex flex-col items-center leading-none">
          <span
            className={cx("grid font-serif tabular-nums", night ? "text-night-ink" : "text-ink")}
            style={{ fontSize: size * 0.34 }}
          >
            <span ref={numRef} className="[grid-area:1/1]">
              {display}
            </span>
            <span ref={tickRef} aria-hidden="true" className="text-center [grid-area:1/1]" />
          </span>
          {size >= 96 ? (
            <span
              className={cx(
                "mt-1 font-medium tracking-wide uppercase",
                night ? "text-night-muted" : "text-muted",
              )}
              style={{ fontSize: Math.max(10, size * 0.085) }}
            >
              {label}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
