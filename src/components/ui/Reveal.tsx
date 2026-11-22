"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/*
 * Shared scroll-reveal watcher (one IntersectionObserver, one rAF-throttled
 * scroll check, one slow failsafe interval for every Reveal and ScoreRing).
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
let raf = 0;
let failsafe = 0;

function release(el: Element, animate: boolean) {
  const cb = watched.get(el);
  if (!cb) return;
  unwatch(el);
  cb(animate);
}

function sweep() {
  raf = 0;
  const vh = window.innerHeight;
  const hits: [Element, boolean][] = [];
  // read every rect first, then write, so the sweep never thrashes layout
  for (const el of watched.keys()) {
    const top = el.getBoundingClientRect().top;
    if (top < vh * JUMP) hits.push([el, false]);
    else if (top < vh * (1 + AHEAD)) hits.push([el, true]);
  }
  for (const [el, animate] of hits) release(el, animate);
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(sweep);
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
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("hashchange", schedule);
  window.addEventListener("pageshow", schedule);
  failsafe = window.setInterval(schedule, FAILSAFE_MS);
}

function stop() {
  if (!io || watched.size) return;
  io.disconnect();
  io = null;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  window.removeEventListener("hashchange", schedule);
  window.removeEventListener("pageshow", schedule);
  window.clearInterval(failsafe);
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
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

/**
 * Fade-up (or paper-tear wipe) on scroll. Server HTML is fully visible, so there
 * is no flash, no LCP delay, and no hidden content without JS.
 */
export function Reveal({
  children,
  variant = "fade",
  delay = 0,
  className,
}: {
  children: ReactNode;
  variant?: "fade" | "tear";
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
  }, []);

  return (
    <div
      ref={ref}
      data-reveal-variant={variant}
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
