import { describe, expect, it } from "vitest";
import {
  SCROLL_QUERIES,
  anchorDuration,
  createFrameBudget,
  isNativeScrollKey,
  preventSmoothFor,
  readScrollEnv,
  samePageHashTarget,
  shouldSmoothScroll,
  type ScrollEnv,
} from "./gate";

const desktop: ScrollEnv = { reducedMotion: false, coarsePointer: false, noHover: false, saveData: false };

function fakeWindow(matching: string[], saveData?: boolean) {
  return {
    matchMedia: (q: string) => ({ matches: matching.includes(q) }),
    navigator: { connection: saveData === undefined ? undefined : { saveData } },
  };
}

describe("shouldSmoothScroll", () => {
  it("initialises for a mouse/trackpad with motion allowed", () => {
    expect(shouldSmoothScroll(desktop)).toBe(true);
  });
  it("does not initialise under prefers-reduced-motion", () => {
    expect(shouldSmoothScroll({ ...desktop, reducedMotion: true })).toBe(false);
  });
  it("does not initialise on a coarse (touch) pointer", () => {
    expect(shouldSmoothScroll({ ...desktop, coarsePointer: true })).toBe(false);
  });
  it("does not initialise when the primary input cannot hover", () => {
    expect(shouldSmoothScroll({ ...desktop, noHover: true })).toBe(false);
  });
  it("does not initialise with Save-Data", () => {
    expect(shouldSmoothScroll({ ...desktop, saveData: true })).toBe(false);
  });
});

describe("readScrollEnv", () => {
  it("reads the media queries", () => {
    expect(readScrollEnv(fakeWindow([]))).toEqual(desktop);
    expect(shouldSmoothScroll(readScrollEnv(fakeWindow([SCROLL_QUERIES.reducedMotion])))).toBe(false);
    const phone = readScrollEnv(fakeWindow([SCROLL_QUERIES.coarsePointer, SCROLL_QUERIES.noHover]));
    expect(phone.coarsePointer && phone.noHover).toBe(true);
    expect(shouldSmoothScroll(phone)).toBe(false);
  });
  it("reads Save-Data when the browser exposes it", () => {
    expect(readScrollEnv(fakeWindow([], true)).saveData).toBe(true);
    expect(readScrollEnv(fakeWindow([], false)).saveData).toBe(false);
  });
});

describe("isNativeScrollKey", () => {
  it.each([" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", "Tab"])("%j is native", (k) => {
    expect(isNativeScrollKey(k)).toBe(true);
  });
  it("ignores other keys", () => {
    expect(isNativeScrollKey("a")).toBe(false);
    expect(isNativeScrollKey("Enter")).toBe(false);
  });
});

describe("preventSmoothFor", () => {
  it("leaves code blocks, fields and dialogs native", () => {
    for (const tagName of ["PRE", "TEXTAREA", "SELECT", "DIALOG"]) {
      expect(preventSmoothFor({ tagName, className: "" })).toBe(true);
    }
  });
  it("leaves overflow-auto/scroll scrollers native", () => {
    expect(preventSmoothFor({ tagName: "DIV", className: "mt-3 overflow-x-auto" })).toBe(true);
    expect(preventSmoothFor({ tagName: "UL", className: "max-h-64 overflow-y-auto pr-1" })).toBe(true);
    expect(preventSmoothFor({ tagName: "DIV", className: "overflow-auto" })).toBe(true);
  });
  it("smooths ordinary content", () => {
    expect(preventSmoothFor({ tagName: "DIV", className: "overflow-clip overflow-hidden" })).toBe(false);
    expect(preventSmoothFor({ tagName: "svg", className: { baseVal: "" } })).toBe(false);
  });
});

describe("samePageHashTarget", () => {
  const here = "https://noticr.com/pricing";
  it("returns the id for same-page fragments", () => {
    expect(samePageHashTarget("#india-pricing", here)).toBe("india-pricing");
    expect(samePageHashTarget("https://noticr.com/pricing#faq", `${here}#india-pricing`)).toBe("faq");
  });
  it("ignores other pages, empty hashes and other origins", () => {
    expect(samePageHashTarget("/services#seo", here)).toBeNull();
    expect(samePageHashTarget("#", here)).toBeNull();
    expect(samePageHashTarget("https://example.com/pricing#faq", here)).toBeNull();
    expect(samePageHashTarget("/pricing?x=1#faq", here)).toBeNull();
  });
});

describe("anchorDuration", () => {
  it("is short for hops and capped for long jumps", () => {
    expect(anchorDuration(50)).toBeCloseTo(0.55);
    expect(anchorDuration(-20000)).toBe(1.1);
    expect(anchorDuration(2000)).toBeGreaterThan(anchorDuration(500));
  });
});

describe("createFrameBudget", () => {
  it("keeps smoothing on a machine that holds 60 fps", () => {
    const b = createFrameBudget();
    let off = false;
    for (let i = 0; i < 200; i++) off = b.record(i % 20 === 0 ? 50 : 16.7) || off;
    expect(off).toBe(false);
  });
  it("switches smoothing off when glides keep missing frames", () => {
    const b = createFrameBudget();
    const results = Array.from({ length: 40 }, (_, i) => b.record(i % 2 ? 50 : 16.7));
    expect(results.slice(0, 29).some(Boolean)).toBe(false); // never decides on too few frames
    expect(results.at(-1)).toBe(true);
  });
});
