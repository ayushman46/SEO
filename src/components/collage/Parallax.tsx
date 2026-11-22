"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Scroll parallax for collage layers. `speed` is the fraction of scroll distance
 * the layer drifts (0.08 = subtle; negative = opposite). Measures the static
 * outer box and moves only the inner layer, so there is no feedback loop.
 * Listens only while on screen; does nothing under prefers-reduced-motion.
 */
export function Parallax({
  speed = 0.08,
  className,
  innerClassName,
  style,
  children,
}: {
  speed?: number;
  className?: string;
  innerClassName?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || typeof IntersectionObserver === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let listening = false;

    const update = () => {
      raf = 0;
      const rect = outer.getBoundingClientRect();
      const delta = rect.top + rect.height / 2 - window.innerHeight / 2;
      inner.style.transform = `translate3d(0, ${(-delta * speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const start = () => {
      if (listening || mq.matches) return;
      listening = true;
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      onScroll();
    };
    const stop = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) start();
      else stop();
    });
    io.observe(outer);

    const onMotionChange = () => {
      if (mq.matches) {
        stop();
        inner.style.transform = "";
      } else {
        start();
      }
    };
    mq.addEventListener("change", onMotionChange);

    return () => {
      io.disconnect();
      stop();
      mq.removeEventListener("change", onMotionChange);
      inner.style.transform = "";
    };
  }, [speed]);

  return (
    <div ref={outerRef} className={className} style={style}>
      <div ref={innerRef} className={innerClassName ?? "h-full w-full will-change-transform"}>
        {children}
      </div>
    </div>
  );
}
