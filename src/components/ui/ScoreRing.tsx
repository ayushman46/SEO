"use client";

import { useEffect, useRef } from "react";
import { cx } from "./cx";

/**
 * SVG score ring with a count-up. Renders the final value on the server; the
 * count-up only runs when the ring starts below the fold and motion is allowed.
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

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value === null ? 0 : Math.max(0, Math.min(100, Math.round(value)));
  const offset = c * (1 - v / 100);

  useEffect(() => {
    const wrap = wrapRef.current;
    const arc = arcRef.current;
    const num = numRef.current;
    if (!animate || value === null || !wrap || !arc || !num) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (wrap.getBoundingClientRect().top < window.innerHeight * 0.95) return;

    arc.style.strokeDashoffset = String(c);
    num.textContent = "0";
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1300;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          arc.style.strokeDashoffset = String(c * (1 - (v / 100) * eased));
          num.textContent = String(Math.round(v * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(wrap);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      arc.style.strokeDashoffset = String(offset);
      num.textContent = String(v);
    };
  }, [animate, value, c, v, offset]);

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
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
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
            ref={numRef}
            className={cx("font-serif tabular-nums", night ? "text-night-ink" : "text-ink")}
            style={{ fontSize: size * 0.34 }}
          >
            {display}
          </span>
          {size >= 96 ? (
            <span
              className={cx("mt-1 font-medium tracking-wide uppercase", night ? "text-night-muted" : "text-muted")}
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
