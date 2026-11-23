"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { onScrollFrame } from "@/components/scroll/loop";

/*
 * Scroll parallax for collage layers, driven by ONE shared controller: one
 * IntersectionObserver, and a subscription to the shared scroll frame
 * (components/scroll/loop, the same rAF that advances Lenis) held only while
 * some layer is on screen. Each frame reads every rect first, then writes every
 * transform. Does nothing under prefers-reduced-motion.
 *
 * Performance notes (T011): no `will-change` (it pinned large GPU layers for the
 * whole page life and cost seconds of raster on mobile). The first, at-rest offset
 * is a 2D translate, which does not promote a layer; a 3D translate is used only
 * once the user actually scrolls, so the layer is composited while it moves.
 */

type Layer = { outer: HTMLElement; inner: HTMLElement; speed: number; visible: boolean };

const layers = new Map<HTMLElement, Layer>();
let io: IntersectionObserver | null = null;
let mq: MediaQueryList | null = null;
let unsubscribe: (() => void) | null = null;
let startY = 0;
let scrolled = false;
let moves: [HTMLElement, number][] = [];

function read() {
  if (!scrolled && window.scrollY !== startY) scrolled = true;
  const vh = window.innerHeight;
  moves = [];
  for (const l of layers.values()) {
    if (!l.visible) continue;
    const rect = l.outer.getBoundingClientRect();
    moves.push([l.inner, -(rect.top + rect.height / 2 - vh / 2) * l.speed]);
  }
}

function write() {
  for (const [inner, y] of moves) {
    inner.style.transform = scrolled ? `translate3d(0, ${y.toFixed(1)}px, 0)` : `translate(0, ${y.toFixed(1)}px)`;
  }
  moves = [];
}

function syncListening() {
  const want = !mq?.matches && [...layers.values()].some((l) => l.visible);
  if (want && !unsubscribe) unsubscribe = onScrollFrame({ read, write });
  else if (!want && unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

function onMotionChange() {
  if (mq?.matches) for (const l of layers.values()) l.inner.style.transform = "";
  syncListening();
}

function register(layer: Layer) {
  if (!io) {
    startY = window.scrollY;
    mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", onMotionChange);
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const l = layers.get(e.target as HTMLElement);
        if (l) l.visible = e.isIntersecting;
      }
      syncListening();
    });
  }
  layers.set(layer.outer, layer);
  io.observe(layer.outer);
}

function unregister(outer: HTMLElement) {
  const l = layers.get(outer);
  if (!l) return;
  layers.delete(outer);
  io?.unobserve(outer);
  l.inner.style.transform = "";
  syncListening();
  if (!layers.size) {
    io?.disconnect();
    io = null;
    mq?.removeEventListener("change", onMotionChange);
    mq = null;
    scrolled = false;
  }
}

/**
 * `speed` is the fraction of scroll distance the layer drifts (0.08 = subtle;
 * negative = opposite). Measures the static outer box and moves only the inner
 * layer, so there is no feedback loop.
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
    register({ outer, inner, speed, visible: false });
    return () => unregister(outer);
  }, [speed]);

  return (
    <div ref={outerRef} className={className} style={style}>
      <div ref={innerRef} className={innerClassName ?? "h-full w-full"}>
        {children}
      </div>
    </div>
  );
}
