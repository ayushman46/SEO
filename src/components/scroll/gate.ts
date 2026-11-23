/*
 * Pure rules for the smooth-scroll island (T025). No DOM access at import time,
 * so they are unit-tested in node (gate.test.ts).
 */

export type ScrollEnv = {
  /** prefers-reduced-motion: reduce */
  reducedMotion: boolean;
  /** primary pointer is coarse (touch screens, most phones and tablets) */
  coarsePointer: boolean;
  /** primary input cannot hover (touch-first devices that report a fine pointer) */
  noHover: boolean;
  /** the user asked for reduced data (Save-Data) */
  saveData: boolean;
};

export const SCROLL_QUERIES = {
  reducedMotion: "(prefers-reduced-motion: reduce)",
  coarsePointer: "(pointer: coarse)",
  noHover: "(hover: none)",
} as const;

/**
 * Inertia smoothing only for a mouse wheel or trackpad on a hover-capable device,
 * with motion allowed and no data-saving request. Touch keeps native momentum
 * scrolling; keyboard scrolling is always native (Lenis never handles keys).
 */
export function shouldSmoothScroll(env: ScrollEnv): boolean {
  return !env.reducedMotion && !env.coarsePointer && !env.noHover && !env.saveData;
}

type MatchMediaWindow = {
  matchMedia(q: string): { matches: boolean };
  navigator?: object;
};

export function readScrollEnv(win: MatchMediaWindow): ScrollEnv {
  return {
    reducedMotion: win.matchMedia(SCROLL_QUERIES.reducedMotion).matches,
    coarsePointer: win.matchMedia(SCROLL_QUERIES.coarsePointer).matches,
    noHover: win.matchMedia(SCROLL_QUERIES.noHover).matches,
    saveData: (win.navigator as { connection?: { saveData?: boolean } } | undefined)?.connection?.saveData === true,
  };
}

/**
 * Keys the browser scrolls with natively. Lenis does not listen to keys, but if a
 * wheel glide is still running it would overwrite the native scroll on the next
 * frame, so any of these cancels the glide first.
 */
const NATIVE_SCROLL_KEYS = new Set([
  " ",
  "Spacebar",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
]);

export function isNativeScrollKey(key: string): boolean {
  return NATIVE_SCROLL_KEYS.has(key);
}

/**
 * Wheel input inside these elements is left to the browser: Lenis must not
 * capture scrolling in code blocks, scrollable tables or lists, form fields,
 * or any modal. Elements can also opt out with `data-lenis-prevent`.
 */
const NATIVE_TAGS = new Set(["PRE", "TEXTAREA", "SELECT", "DIALOG", "IFRAME"]);
const SCROLLER_CLASS = /(^|\s)overflow(-[xy])?-(auto|scroll)(\s|$)/;

export function preventSmoothFor(node: { tagName: string; className: unknown }): boolean {
  if (NATIVE_TAGS.has(node.tagName)) return true;
  return typeof node.className === "string" && SCROLLER_CLASS.test(node.className);
}

/** Same-document fragment link? Returns the decoded target id, or null. */
export function samePageHashTarget(href: string, current: string): string | null {
  let to: URL;
  let from: URL;
  try {
    to = new URL(href, current);
    from = new URL(current);
  } catch {
    return null;
  }
  if (to.origin !== from.origin || to.pathname !== from.pathname || to.search !== from.search) return null;
  if (to.hash.length < 2) return null;
  try {
    return decodeURIComponent(to.hash.slice(1));
  } catch {
    return null;
  }
}

/** Glide length for anchor jumps, in seconds: short hops feel instant, long ones never drag. */
export function anchorDuration(distancePx: number): number {
  const d = Math.abs(distancePx);
  return Math.min(1.1, Math.max(0.55, 0.45 + d / 5000));
}

/** Smoothing for wheel input (Lenis `lerp`). 0.1 is Lenis' default; higher is tighter. */
export const WHEEL_LERP = 0.13;

/**
 * Frame-budget guard. Lenis moves wheel scrolling onto the main thread, so on a
 * slow machine it could cost frames that native scrolling would not. While a
 * glide runs, every frame interval is fed in; once at least `MIN_FRAMES` were
 * seen and more than a quarter of them missed ~30 fps, smoothing gives up for
 * the session and native scrolling takes over.
 */
export const BUDGET = { slowMs: 34, minFrames: 30, maxSlowShare: 0.25 } as const;

export function createFrameBudget(budget = BUDGET) {
  let frames = 0;
  let slow = 0;
  return {
    /** Returns true when smoothing should be switched off. */
    record(intervalMs: number): boolean {
      frames++;
      if (intervalMs > budget.slowMs) slow++;
      return frames >= budget.minFrames && slow / frames > budget.maxSlowShare;
    },
  };
}
