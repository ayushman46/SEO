"use client";

import { useEffect } from "react";
import { SCROLL_QUERIES, readScrollEnv, shouldSmoothScroll } from "./gate";

/**
 * Smooth-scroll island (T025). Renders nothing. After the page has loaded and
 * the main thread is idle, and only if the gate allows it (fine pointer that can
 * hover, motion allowed, no Save-Data), it dynamic-imports the Lenis controller,
 * so Lenis adds nothing to LCP or TBT. It tears Lenis down again if the user
 * switches on reduced motion or the primary pointer changes, and for good if
 * the frame-budget guard finds the machine keeps missing frames while gliding.
 */
export function SmoothScroll() {
  useEffect(() => {
    let disposed = false;
    let loading = false;
    let stop: (() => void) | null = null;
    let gaveUp = false; // the frame-budget guard switched smoothing off for this page life
    let idle = 0;
    let timer = 0;
    const allowed = () => !gaveUp && shouldSmoothScroll(readScrollEnv(window));

    function load() {
      if (loading || stop || disposed) return;
      loading = true;
      import("./lenis-controller")
        .then((m) => {
          loading = false;
          if (!disposed && !stop && allowed()) {
            stop = m.startSmoothScroll(() => {
              gaveUp = true;
              stop = null;
            });
          }
        })
        .catch(() => {
          loading = false; // native scrolling simply stays on
        });
    }

    function whenIdle() {
      const run = () => {
        if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(load, { timeout: 2500 });
        else timer = window.setTimeout(load, 300);
      };
      if (document.readyState === "complete") run();
      else window.addEventListener("load", run, { once: true });
    }

    function evaluate() {
      if (allowed()) {
        if (!stop) whenIdle();
      } else if (stop) {
        stop();
        stop = null;
      }
    }

    const queries = Object.values(SCROLL_QUERIES).map((q) => window.matchMedia(q));
    queries.forEach((mq) => mq.addEventListener("change", evaluate));
    evaluate();

    return () => {
      disposed = true;
      queries.forEach((mq) => mq.removeEventListener("change", evaluate));
      if (idle) window.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
      stop?.();
    };
  }, []);

  return null;
}
