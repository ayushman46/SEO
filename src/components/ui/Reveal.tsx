"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { invalidateScroll, onScrollFrame } from "@/components/scroll/loop";

/*
 * Shared scroll-reveal watcher (one IntersectionObserver, a read/write pass in
 * the shared scroll frame from components/scroll/loop, one slow failsafe
 * interval for every Reveal and ScoreRing).
 *
 * T025: where the browser supports scroll-driven animations, fade reveals are
 * pure CSS (animation-timeline: view(), see globals.css) and skip this watcher;
 * this path stays as the fallback and for the time-based "settle" variant.
 *
 * Content is never hidden by default: server HTML is fully visible, and an
 * element is only marked "pending" by script when it starts below the fold and
 * motion is allowed. It is released as soon as it nears the viewport, or at
 * once (no transition) when it is found already well inside or above the
 * viewport, which covers anchor jumps, scrollTo, find-in-page and restored
 * scroll positions.
 */

type RevealCallback = (animate: boolean) => void;

/** Element top above this fraction of the viewport height: the user jumped, show instantly. */
const JUMP = 0.65;
/** Start the animated reveal this far (fraction of viewport height) before the element enters. */
const AHEAD = 0.12;
/** Failsafe sweep, in case a scroll or intersection event was missed. */
const FAILSAFE_MS = 900;

const watched = new Map<Element, RevealCallback>();
let io: IntersectionObserver | null = null;
let unsubscribe: (() => void) | null = null;
let failsafe = 0;
let hits: [Element, boolean][] = [];

function release(el: Element, animate: boolean) {
  const cb = watched.get(el);
  if (!cb) return;
  unwatch(el);
  cb(animate);
}

// Reads every rect first (together with every other scroll subscriber), then writes.
function sweepRead() {
  const vh = window.innerHeight;
  hits = [];
  for (const el of watched.keys()) {
    const top = el.getBoundingClientRect().top;
    if (top < vh * JUMP) hits.push([el, false]);
    else if (top < vh * (1 + AHEAD)) hits.push([el, true]);
  }
}

function sweepWrite() {
  const now = hits;
  hits = [];
  for (const [el, animate] of now) release(el, animate);
}

function start() {
  if (io) return;
  io = new IntersectionObserver(
    (entries) => {
      const vh = window.innerHeight;
      for (const e of entries) {
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          release(e.target, e.boundingClientRect.top >= vh * JUMP);
        }
      }
    },
    { rootMargin: `0px 0px ${AHEAD * 100}% 0px` },
  );
  unsubscribe = onScrollFrame({ read: sweepRead, write: sweepWrite });
  window.addEventListener("hashchange", invalidateScroll);
  window.addEventListener("pageshow", invalidateScroll);
  failsafe = window.setInterval(invalidateScroll, FAILSAFE_MS);
}

function stop() {
  if (!io || watched.size) return;
  io.disconnect();
  io = null;
  unsubscribe?.();
  unsubscribe = null;
  window.removeEventListener("hashchange", invalidateScroll);
  window.removeEventListener("pageshow", invalidateScroll);
  window.clearInterval(failsafe);
  hits = [];
}

function unwatch(el: Element) {
  if (!watched.delete(el)) return;
  io?.unobserve(el);
  stop();
}

/*
 * Batched fold check. Every Reveal / ScoreRing mounts in the same commit; checking
 * each one inline (read rect, then mark pending) interleaves reads and writes and
 * forces a full style + layout per element during hydration. Instead, checks are
 * queued and run in one microtask: all rects are read first, then every callback
 * (which writes) runs.
 */
type FoldCheck = { el: Element; run: () => void; cancelled: boolean };
let foldQueue: FoldCheck[] = [];

function flushFold() {
  const queue = foldQueue;
  foldQueue = [];
  const live = queue.filter((c) => !c.cancelled);
  if (!live.length) return;
  if (
    typeof IntersectionObserver === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const vh = window.innerHeight;
  const below = live.filter((c) => c.el.getBoundingClientRect().top >= vh);
  for (const c of below) if (!c.cancelled) c.run();
}

/**
 * Runs `cb` (batched with every other check in this commit) only if `el` may
 * start hidden and animate in. `cb` may return a cleanup. Returns a cleanup.
 */
export function whenBelowFold(el: Element, cb: () => (() => void) | void) {
  let cleanup: (() => void) | void;
  const check: FoldCheck = { el, cancelled: false, run: () => (cleanup = cb()) };
  if (!foldQueue.length) queueMicrotask(flushFold);
  foldQueue.push(check);
  return () => {
    check.cancelled = true;
    cleanup?.();
  };
}

/**
 * Calls `cb(animate)` once, when `el` nears the viewport (`animate = true`) or is
 * found already well inside or above it (`animate = false`). Returns a cleanup.
 */
export function watchReveal(el: Element, cb: RevealCallback) {
  start();
  watched.set(el, cb);
  io?.observe(el);
  return () => unwatch(el);
}

let cssReveal: boolean | null = null;
/** Fade reveals run as CSS scroll-driven animations where supported (globals.css). */
function hasCssReveal() {
  if (cssReveal === null) {
    cssReveal =
      typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("animation-timeline: view()");
  }
  return cssReveal;
}

/**
 * Scroll reveal. Server HTML is fully visible, so there is no flash, no LCP
 * delay, and no hidden content without JS.
 * - "fade": rises in, scrubbed by scroll where CSS scroll-driven animations are
 *   supported, otherwise a one-off transition as it nears the viewport.
 * - "settle": a paper sheet settling (slight lift and tilt), time-based.
 *   ("tear" is accepted as its old name; the clip-path wipe was retired in T025.)
 * `delay` (ms) staggers siblings; `stagger` staggers this element's own children.
 * Transform and opacity only (T011): no clip-path, no filters, no will-change.
 */
export function Reveal({
  children,
  variant = "fade",
  delay = 0,
  stagger = false,
  className,
}: {
  children: ReactNode;
  variant?: "fade" | "settle" | "tear";
  delay?: number;
  stagger?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const v = variant === "tear" ? "settle" : variant;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (v === "fade" && hasCssReveal()) return;
    return whenBelowFold(el, () => {
      el.dataset.reveal = "pending";
      const cleanup = watchReveal(el, (animate) => {
        // Without the attribute the element is plain, fully visible content with no transition.
        if (animate) el.dataset.reveal = "done";
        else delete el.dataset.reveal;
      });
      return () => {
        cleanup();
        delete el.dataset.reveal;
      };
    });
  }, [v]);

  const style = delay
    ? ({ "--reveal-delay": `${delay}ms`, "--reveal-shift": `${Math.min(delay * 0.5, 120)}px` } as CSSProperties)
    : undefined;

  return (
    <div
      ref={ref}
      data-reveal-variant={v}
      data-reveal-stagger={stagger ? "" : undefined}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
