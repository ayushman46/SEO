import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { WHEEL_LERP, anchorDuration, createFrameBudget, isNativeScrollKey, preventSmoothFor, samePageHashTarget } from "./gate";
import { invalidateScroll, requestFrame, setScrollDriver } from "./loop";
import { setSmoothController } from "./smooth";

/*
 * Loaded with a dynamic import after first paint and idle, only when the gate in
 * SmoothScroll allows it. Lenis smooths wheel/trackpad input only:
 * - touch is never synced (syncTouch false) and the island is not even loaded on
 *   coarse-pointer / no-hover devices;
 * - keys are never handled by Lenis; a navigation key cancels any running glide
 *   so the browser's own keyboard scroll is not overwritten;
 * - nested scrollers (pre, tables, overflow-auto lists, dialogs, the fix tray)
 *   keep native scrolling via `prevent` and `data-lenis-prevent`.
 * There is no own rAF: Lenis is advanced by the shared loop in ./loop, which
 * idles when nothing moves and stops while the tab is hidden.
 */

const FRAME = 1000 / 60;
const FOCUSABLE = "a[href],button,input,select,textarea,summary,[tabindex]";

/**
 * Starts Lenis and returns its teardown. `onGiveUp` is called (after teardown)
 * if the frame-budget guard decides this machine scrolls better natively.
 */
export function startSmoothScroll(onGiveUp: () => void): () => void {
  const lenis = new Lenis({
    lerp: WHEEL_LERP,
    smoothWheel: true,
    syncTouch: false,
    orientation: "vertical",
    gestureOrientation: "vertical",
    autoRaf: false,
    anchors: false, // handled below so the URL hash, :target, history and focus stay native
    stopInertiaOnNavigate: true,
    prevent: (node) => preventSmoothFor(node),
  });

  const budget = createFrameBudget();
  let lastFrame = 0;
  let gaveUp = false;

  setScrollDriver((time, resumed) => {
    // After the loop idled, pretend one frame passed so the glide does not jump.
    if (resumed) lenis.time = time - FRAME;
    else if (!gaveUp && budget.record(time - lastFrame)) {
      gaveUp = true;
      window.setTimeout(() => {
        teardown();
        onGiveUp();
      }, 0);
    }
    lastFrame = time;
    lenis.raf(time);
    return lenis.isScrolling === "smooth";
  });
  const offVirtual = lenis.on("virtual-scroll", requestFrame);
  const offScroll = lenis.on("scroll", invalidateScroll);

  function glideTo(target: HTMLElement | number) {
    const y = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY;
    lenis.scrollTo(target, { duration: anchorDuration(y - window.scrollY) });
    requestFrame();
  }

  function scrollToElement(el: HTMLElement, block: "start" | "center") {
    if (block === "center") {
      const r = el.getBoundingClientRect();
      if (r.height < window.innerHeight) {
        glideTo(window.scrollY + r.top - (window.innerHeight - r.height) / 2);
        return;
      }
    }
    glideTo(el);
  }

  /** Stop a running glide where it is (public-API equivalent of Lenis reset()). */
  function halt() {
    lenis.scrollTo(lenis.actualScroll, { immediate: true, force: true });
  }

  let lastHashNav = -1;

  function onClick(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a[href]");
    if (!(a instanceof HTMLAnchorElement) || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const id = samePageHashTarget(a.href, window.location.href);
    const el = id ? document.getElementById(id) : null;
    if (!el || el.closest("dialog")) return; // unknown target: let the browser decide
    e.preventDefault();

    const from = window.scrollY;
    const hash = `#${encodeURIComponent(id!)}`;
    lastHashNav = performance.now();
    if (window.location.hash !== hash) {
      // A real fragment navigation: history entry, :target, hashchange and the
      // sequential-focus starting point all behave exactly as without Lenis...
      window.location.hash = hash;
      // ...then put the page back (same task, nothing painted) and glide there.
      window.scrollTo({ top: from, behavior: "instant" });
    }
    halt();
    glideTo(el);
    if (el.matches(FOCUSABLE)) el.focus({ preventScroll: true });
  }

  function onKeyDown(e: KeyboardEvent) {
    if (lenis.isScrolling === "smooth" && isNativeScrollKey(e.key)) halt();
  }

  function onPopState() {
    // back/forward restores the scroll natively; never let a running glide overwrite it
    if (performance.now() - lastHashNav > 250) halt();
  }

  window.addEventListener("click", onClick);
  window.addEventListener("keydown", onKeyDown, { capture: true });
  window.addEventListener("popstate", onPopState);

  setSmoothController({
    scrollToElement,
    stop: () => lenis.stop(),
    start: () => lenis.start(),
  });

  let tornDown = false;
  function teardown() {
    if (tornDown) return;
    tornDown = true;
    setSmoothController(null);
    setScrollDriver(null);
    offVirtual();
    offScroll();
    window.removeEventListener("click", onClick);
    window.removeEventListener("keydown", onKeyDown, { capture: true });
    window.removeEventListener("popstate", onPopState);
    lenis.destroy();
  }

  return teardown;
}
