/**
 * Hostile-page regression tests (R2 findings 1-4, 18 + the general element/depth guard).
 * Synchronous analysis can't be interrupted by the crawl budget, so every pass over a
 * page must be linear and bounded. Each case asserts completion well under 2 s.
 */
import { describe, expect, it } from "vitest";
import { load } from "cheerio";
import { analyze } from "@/lib/audit/analyze";
import { MAX_ELEMENTS, parsePage, visibleText } from "@/lib/audit/html";
import { countAnswerBlocks, hasListsOrTables } from "@/lib/audit/checks/geo/answer-ready";
import { parseSitemap } from "@/lib/audit/checks/seo/sitemap";
import { canonicalCheck } from "@/lib/audit/checks/seo/canonical";
import { AuditError } from "@/lib/audit/types";
import { makeCtx, page } from "./helpers";

const HOME = "https://acme.example.com/";
const LIMIT_MS = 1_500;

function timed<T>(fn: () => T): { value: T; ms: number } {
  const t = performance.now();
  const value = fn();
  return { value, ms: performance.now() - t };
}

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

describe("hostile pages: analysis stays linear", () => {
  it("20k repeated <h2> (answer-ready was quadratic: 66 s)", () => {
    const html = `<html><body>${"<h2>".repeat(20_000)}</body></html>`;
    const direct = timed(() => countAnswerBlocks(load(html)));
    expect(direct.ms).toBeLessThan(1_000);
    const r = timed(() => fullAnalysis(html));
    expect(r.ms).toBeLessThan(LIMIT_MS);
    expect(r.value.checks.length).toBeGreaterThan(0);
  });

  it("45k sibling <p> (visibleText clone+remove was quadratic)", () => {
    const html = `<html><body>${"<p>w ".repeat(45_000)}</body></html>`;
    const direct = timed(() => visibleText(load(html)));
    expect(direct.ms).toBeLessThan(1_000);
    const r = timed(() => fullAnalysis(html));
    expect(r.ms).toBeLessThan(2_000);
    expect(r.value.pages[0].wordCount).toBe(45_000);
  });

  it("80k <p> is rejected fast as too_large instead of being analysed", () => {
    const html = `<html><body>${"<p>".repeat(80_000)}</body></html>`;
    const r = timed(() => errorCode(() => parseHome(html)));
    expect(r.value).toBe("too_large");
    expect(r.ms).toBeLessThan(LIMIT_MS);
  });

  it("a 2 MB tag bomb is rejected before parsing", () => {
    const html = "<p>".repeat(700_000);
    const r = timed(() => errorCode(() => parseHome(html)));
    expect(r.value).toBe("too_large");
    expect(r.ms).toBeLessThan(500);
  });

  it("900 nested <div> with headings, lists and links at the bottom", () => {
    const inner =
      "<h2>Price?</h2><p>" +
      "word ".repeat(30) +
      ".</p><ul><li>a</li><li>b</li><li>c</li></ul>" +
      '<a href="/x">x</a>'.repeat(2_000);
    const html = `<html><body>${"<div>".repeat(900)}${inner}${"</div>".repeat(900)}</body></html>`;
    const r = timed(() => fullAnalysis(html));
    expect(r.ms).toBeLessThan(LIMIT_MS);
    expect(r.value.pages[0].h1Count).toBe(0);
  });

  it("2,000 nested <div> is rejected fast (parse5 itself is quadratic in depth)", () => {
    const html = `<html><body>${"<div>".repeat(2_000)}<a href="/x">x</a></body></html>`;
    const r = timed(() => errorCode(() => parseHome(html)));
    expect(r.value).toBe("too_large");
    expect(r.ms).toBeLessThan(100);
  });

  it("20k nested <div> no longer overflows the stack: it is a controlled too_large", () => {
    const html = `<html><body>${"<div>".repeat(20_000)}x</body></html>`;
    // htmlparser2 (xml mode) builds the deep tree in linear time; parse5 would take ~9 s.
    const deep = load(`<body>${"<div>".repeat(30_000)}x${"</div>".repeat(30_000)}</body>`, { xml: true });
    expect(visibleText(deep)).toBe("x");
    const r = timed(() => errorCode(() => parseHome(html)));
    expect(r.value).toBe("too_large");
    expect(r.ms).toBeLessThan(100);
  });

  it("links under deep nesting (per-link ancestor scan was O(links x depth))", () => {
    const html = `<html><body><nav><a href="/nav">n</a></nav>${"<div>".repeat(900)}${'<a href="/x">x</a>'.repeat(20_000)}</body></html>`;
    const r = timed(() => parseHome(html));
    expect(r.ms).toBeLessThan(LIMIT_MS);
    expect(r.value.links).toHaveLength(20_001);
    expect(r.value.links[0]).toEqual({ href: "https://acme.example.com/nav", inNav: true });
    expect(r.value.links[1].inNav).toBe(false);
    const a = timed(() => fullAnalysis(html));
    expect(a.ms).toBeLessThan(LIMIT_MS);
  });

  it("50k links exceed the element cap and are rejected fast", () => {
    const html = `<html><body>${'<a href="/x">x</a>'.repeat(50_000)}</body></html>`;
    const r = timed(() => errorCode(() => parseHome(html)));
    expect(r.value).toBe("too_large");
    expect(r.ms).toBeLessThan(LIMIT_MS);
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
    expect(r.ms).toBeLessThan(LIMIT_MS);
    expect(timed(() => hasListsOrTables(load(html))).ms).toBeLessThan(500);
  });

  it("sitemap ReDoS input: <loc> followed by 2 MB of whitespace", () => {
    const xml = `<urlset><loc>${" ".repeat(2 * 1024 * 1024)}`;
    const r = timed(() => parseSitemap(xml));
    expect(r.ms).toBeLessThan(LIMIT_MS);
    expect(r.value).toEqual({ kind: "urlset", locs: [] });
  });

  it("deeply nested <loc> elements in XML don't recurse or go quadratic", () => {
    const group = `${"<loc>".repeat(5_000)}https://acme.example.com/a${"</loc>".repeat(5_000)}`;
    const xml = `<urlset>${group.repeat(20)}</urlset>`;
    const r = timed(() => parseSitemap(xml));
    expect(r.ms).toBeLessThan(2_000);
    expect(r.value.kind).toBe("urlset");
  });

  it("canonical Link header made of 16k '<' is linear", () => {
    const ctx = makeCtx({ pages: [page("<html><body>x</body></html>", HOME, { headers: { link: "<".repeat(16_000) } })] });
    const r = timed(() => canonicalCheck(ctx));
    expect(r.ms).toBeLessThan(100);
    expect(r.value.issues.map((i) => i.key)).toEqual(["seo.canonical:missing"]);
  });
});
