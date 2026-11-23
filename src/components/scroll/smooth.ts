/*
 * Tiny registry between the lazily loaded Lenis controller and the rest of the
 * UI. Importing this never loads Lenis: callers work the same whether smooth
 * scrolling is active (fine pointer, motion allowed) or not.
 */

export type SmoothController = {
  scrollToElement(el: HTMLElement, block: "start" | "center"): void;
  stop(): void;
  start(): void;
};

let controller: SmoothController | null = null;
let locks = 0;

export function setSmoothController(next: SmoothController | null) {
  controller = next;
  if (next && locks > 0) next.stop();
}

/** Pause smooth scrolling (e.g. while a modal is open). Returns the matching release. */
export function lockSmoothScroll() {
  locks++;
  if (locks === 1) controller?.stop();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) controller?.start();
  };
}

/** Scroll an element into view through Lenis when it is active, natively otherwise. */
export function scrollToElement(el: HTMLElement, block: "start" | "center" = "start") {
  if (controller) {
    controller.scrollToElement(el, block);
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block });
}
