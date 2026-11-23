/*
 * One requestAnimationFrame loop for everything scroll-linked (T025): the Lenis
 * glide (when loaded), Parallax and the Reveal sweep. Each frame runs, in order:
 *   1. the driver (Lenis writes the new scroll position),
 *   2. every subscriber's `read` (rects only, no writes),
 *   3. every subscriber's `write` (transforms / attributes only).
 * So one frame never interleaves layout reads and writes. The loop only runs
 * while something changed (a scroll or resize event, or a glide in progress)
 * and never while the tab is hidden.
 */

export type ScrollSubscriber = { read?: () => void; write?: () => void };
/** Returns true while it needs another frame. `resumed` is true on the first frame after the loop idled. */
export type ScrollDriver = (time: number, resumed: boolean) => boolean;

const subscribers = new Set<ScrollSubscriber>();
let driver: ScrollDriver | null = null;
let raf = 0;
let dirty = false;
let continuing = false;
let listening = false;

function frame(time: number) {
  raf = 0;
  const more = driver ? driver(time, !continuing) : false;
  continuing = more;
  if (dirty) {
    dirty = false;
    const subs = [...subscribers];
    for (const s of subs) s.read?.();
    for (const s of subs) s.write?.();
  }
  if (more) requestFrame();
}

/** Ask for one frame (coalesced). No-op while the tab is hidden. */
export function requestFrame() {
  if (raf || typeof window === "undefined" || document.visibilityState === "hidden") return;
  raf = requestAnimationFrame(frame);
}

/** Something scroll-related changed: run subscribers on the next frame. */
export function invalidateScroll() {
  dirty = true;
  requestFrame();
}

function onVisibility() {
  if (document.visibilityState === "hidden") {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    continuing = false;
  } else if (driver || dirty) {
    invalidateScroll();
  }
}

function sync() {
  const want = subscribers.size > 0 || driver !== null;
  if (want && !listening) {
    listening = true;
    window.addEventListener("scroll", invalidateScroll, { passive: true });
    window.addEventListener("resize", invalidateScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
  } else if (!want && listening) {
    listening = false;
    window.removeEventListener("scroll", invalidateScroll);
    window.removeEventListener("resize", invalidateScroll);
    document.removeEventListener("visibilitychange", onVisibility);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    continuing = false;
  }
}

/** Run `sub` in the shared frame after every scroll/resize. Returns an unsubscribe. */
export function onScrollFrame(sub: ScrollSubscriber) {
  subscribers.add(sub);
  sync();
  invalidateScroll();
  return () => {
    subscribers.delete(sub);
    sync();
  };
}

/** Install (or remove, with null) the smooth-scroll driver. */
export function setScrollDriver(next: ScrollDriver | null) {
  driver = next;
  continuing = false;
  sync();
  if (next) requestFrame();
}
