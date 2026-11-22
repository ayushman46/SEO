/**
 * Hostile-page regression tests (R2 findings 1-4, 18 + the general element/depth guard).
 * Synchronous analysis can't be interrupted by the crawl budget, so every pass over a
 * page must be linear and bounded. Each case asserts completion well under 2 s.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { load } from "cheerio";
import { analyze } from "@/lib/audit/analyze";
import { MAX_ELEMENTS, parsePage, visibleText } from "@/lib/audit/html";
import { countAnswerBlocks, hasListsOrTables } from "@/lib/audit/checks/geo/answer-ready";
import { parseSitemap } from "@/lib/audit/checks/seo/sitemap";
import { canonicalCheck } from "@/lib/audit/checks/seo/canonical";
import { AuditError } from "@/lib/audit/types";
import { goodHome, makeCtx, page } from "./helpers";

const HOME = "https://acme.example.com/";
const BASE_LIMIT_MS = 1_500;

function timed<T>(fn: () => T): { value: T; ms: number } {
  const t = performance.now();
  const value = fn();
  return { value, ms: performance.now() - t };
}

/*
 * De-flaking (absolute ms limits failed under parallel test load):
 *  1. Every time limit is multiplied by `slack`, measured right before each test: the best of 3
 *     runs of a fixed, benign analysis workload divided by its time on an idle dev machine. A
 *     machine that is 3x slower right now gets 3x the limits; an idle machine gets the originals.
 *  2. The "stays linear" claims are also asserted directly: doubling the hostile input must not
 *     more than ~triple the time (linear ≈ 2x, the quadratic bugs these guard against ≈ 4x).
 *     Sizes are interleaved, best of 3 each, so a single preempted run can't fail the ratio.
 */
const REF_UNIT_MS = 60;
const CALIBRATION_HTML = goodHome().replace(
  "</main>",
  `${"<section><h2>Topic</h2><p>Some words here for a paragraph of text.</p></section>".repeat(800)}</main>`,
);
function unitMs(): number {
  let best = Infinity;
  for (let i = 0; i < 3; i++) best = Math.min(best, timed(() => analyze(makeCtx({ pages: [page(CALIBRATION_HTML, HOME)] }))).ms);
  return best;
}
let slack = 1;
/**
 * Limit scaled to the machine's speed, measured before the test AND again at the assertion
 * (load can change mid-test); never below the original limit.
 */
const within = (ms: number) => ms * Math.max(slack, unitMs() / REF_UNIT_MS);
const LIMIT_MS = BASE_LIMIT_MS;

/** time(2n) / time(n); small timings are floored so noise on tiny inputs can't fail it */
function growth(run: (n: number) => unknown, n: number): number {
  // Interleaved so a load spike hits both sizes, best of 3 each.
  let t1 = Infinity;
  let t2 = Infinity;
  for (let i = 0; i < 3; i++) {
    t1 = Math.min(t1, timed(() => run(n)).ms);
    t2 = Math.min(t2, timed(() => run(2 * n)).ms);
  }
  return t2 / Math.max(t1, 25);
}
const MAX_GROWTH = 3.2;

/** parsePage + every check, as the real pipeline does for the homepage. */
function fullAnalysis(html: string) {
  return analyze(makeCtx({ pages: [page(html, HOME)] }));
}

function parseHome(html: string) {
  return parsePage({ url: HOME, requestedUrl: HOME, statusCode: 200, headers: {}, html, isHome: true });
}

function errorCode(fn: () => unknown): string {
  try {
    fn();
    return "ok";
  } catch (e) {
    expect(e).toBeInstanceOf(AuditError);
    return (e as AuditError).code;
  }
}

describe("hostile pages: analysis stays linear", { timeout: 60_000 }, () => {
  beforeEach(() => {
    slack = Math.max(1, unitMs() / REF_UNIT_MS);
  });

  it("20k repeated <h2> (answer-ready was quadratic: 66 s)", () => {
    const html = `<html><body>${"<h2>".repeat(20_000)}</body></html>`;
    const direct = timed(() => countAnswerBlocks(load(html)));
    expect(direct.ms).toBeLessThan(within(1_000));
    const r = timed(() => fullAnalysis(html));
    expect(r.ms).toBeLessThan(within(LIMIT_MS));
    expect(r.value.checks.length).toBeGreaterThan(0);
    expect(growth((n) => fullAnalysis(`<html><body>${"<h2>".repeat(n)}</body></html>`), 10_000)).toBeLessThan(MAX_GROWTH);
  });

  it("45k sibling <p> (visibleText clone+remove was quadratic)", () => {
    const html = `<html><body>${"<p>w ".repeat(45_000)}</body></html>`;
    const direct = timed(() => visibleText(load(html)));
    expect(direct.ms).toBeLessThan(within(1_000));
    const r = timed(() => fullAnalysis(html));
    expect(r.ms).toBeLessThan(within(2_000));
    expect(r.value.pages[0].wordCount).toBe(45_000);
    expect(growth((n) => fullAnalysis(`<html><body>${"<p>w ".repeat(n)}</body></html>`), 22_500)).toBeLessThan(MAX_GROWTH);
  });

  it("80k <p> is rejected fast as too_large instead of being analysed", () => {
    const html = `<html><body>${"<p>".repeat(80_000)}</body></html>`;
    const r = timed(() => errorCode(() => parseHome(html)));
    expect(r.value).toBe("too_large");
    expect(r.ms).toBeLessThan(within(LIMIT_MS));
  });

  it("a 2 MB tag bomb is rejected before parsing", () => {
    const html = "<p>".repeat(700_000);
    const r = timed(() => errorCode(() => parseHome(html)));
    expect(r.value).toBe("too_large");
    expect(r.ms).toBeLessThan(within(500));
  });

  it("900 nested <div> with headings, lists and links at the bottom", () => {
    const inner =
      "<h2>Price?</h2><p>" +
      "word ".repeat(30) +
      ".</p><ul><li>a</li><li>b</li><li>c</li></ul>" +
      '<a href="/x">x</a>'.repeat(2_000);
    const html = `<html><body>${"<div>".repeat(900)}${inner}${"</div>".repeat(900)}</body></html>`;
    const r = timed(() => fullAnalysis(html));
    expect(r.ms).toBeLessThan(within(LIMIT_MS));
    expect(r.value.pages[0].h1Count).toBe(0);
  });

  it("2,000 nested <div> is rejected fast (parse5 itself is quadratic in depth)", () => {
    const html = `<html><body>${"<div>".repeat(2_000)}<a href="/x">x</a></body></html>`;
    const r = timed(() => errorCode(() => parseHome(html)));
    expect(r.value).toBe("too_large");
    expect(r.ms).toBeLessThan(within(100));
  });

  it("20k nested <div> no longer overflows the stack: it is a controlled too_large", () => {
    const html = `<html><body>${"<div>".repeat(20_000)}x</body></html>`;
    // htmlparser2 (xml mode) builds the deep tree in linear time; parse5 would take ~9 s.
    const deep = load(`<body>${"<div>".repeat(30_000)}x${"</div>".repeat(30_000)}</body>`, { xml: true });
    expect(visibleText(deep)).toBe("x");
    const r = timed(() => errorCode(() => parseHome(html)));
    expect(r.value).toBe("too_large");
    expect(r.ms).toBeLessThan(within(100));
  });

  it("links under deep nesting (per-link ancestor scan was O(links x depth))", () => {
    const html = `<html><body><nav><a href="/nav">n</a></nav>${"<div>".repeat(900)}${'<a href="/x">x</a>'.repeat(20_000)}</body></html>`;
    const r = timed(() => parseHome(html));
    expect(r.ms).toBeLessThan(within(LIMIT_MS));
    expect(r.value.links).toHaveLength(20_001);
    expect(r.value.links[0]).toEqual({ href: "https://acme.example.com/nav", inNav: true });
    expect(r.value.links[1].inNav).toBe(false);
    const a = timed(() => fullAnalysis(html));
    expect(a.ms).toBeLessThan(within(LIMIT_MS));
    const build = (n: number) => `<html><body><nav><a href="/nav">n</a></nav>${"<div>".repeat(900)}${'<a href="/x">x</a>'.repeat(n)}</body></html>`;
    expect(growth((n) => fullAnalysis(build(n)), 10_000)).toBeLessThan(MAX_GROWTH);
  });

  it("50k links exceed the element cap and are rejected fast", () => {
    const html = `<html><body>${'<a href="/x">x</a>'.repeat(50_000)}</body></html>`;
    const r = timed(() => errorCode(() => parseHome(html)));
    expect(r.value).toBe("too_large");
    expect(r.ms).toBeLessThan(within(LIMIT_MS));
  });

  it("element cap boundary: just under the cap is analysed", () => {
    const n = MAX_ELEMENTS - 10;
    const html = `<html><head></head><body>${"<i></i>".repeat(n)}</body></html>`;
    expect(errorCode(() => parseHome(html))).toBe("ok");
  });

  it("nested <h2><span> chains, nested tables, nested <details><summary>", () => {
    const html =
      "<html><body><main>" +
      "<h2><span>".repeat(450) +
      "</span></h2>".repeat(450) +
      "<table><tr><td>".repeat(300) +
      "</td></tr></table>".repeat(300) +
      "<details><summary>Why?".repeat(450) +
      "</summary></details>".repeat(450) +
      "</main></body></html>";
    const r = timed(() => fullAnalysis(html));
    expect(r.ms).toBeLessThan(within(LIMIT_MS));
    expect(timed(() => hasListsOrTables(load(html))).ms).toBeLessThan(within(500));
  });

  it("sitemap ReDoS input: <loc> followed by 2 MB of whitespace", () => {
    const xml = `<urlset><loc>${" ".repeat(2 * 1024 * 1024)}`;
    const r = timed(() => parseSitemap(xml));
    expect(r.ms).toBeLessThan(within(LIMIT_MS));
    expect(r.value).toEqual({ kind: "urlset", locs: [] });
  });

  it("deeply nested <loc> elements in XML don't recurse or go quadratic", () => {
    const group = `${"<loc>".repeat(5_000)}https://acme.example.com/a${"</loc>".repeat(5_000)}`;
    const xml = `<urlset>${group.repeat(20)}</urlset>`;
    const r = timed(() => parseSitemap(xml));
    expect(r.ms).toBeLessThan(within(2_000));
    expect(r.value.kind).toBe("urlset");
  });

  it("canonical Link header made of 16k '<' is linear", () => {
    const ctx = makeCtx({ pages: [page("<html><body>x</body></html>", HOME, { headers: { link: "<".repeat(16_000) } })] });
    const r = timed(() => canonicalCheck(ctx));
    expect(r.ms).toBeLessThan(within(100));
    expect(r.value.issues.map((i) => i.key)).toEqual(["seo.canonical:missing"]);
  });
});
