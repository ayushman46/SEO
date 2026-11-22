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
import { doc, goodHome, makeCtx, page } from "./helpers";
import {
  ATTRIBUTION_TAIL,
  EMAIL_RE,
  PHONE_RE,
  PRICE_RE,
  STREET_RE,
  STRUCK_CLASS,
  TESTIMONIAL_CLASS,
  TIME_RANGE_RE,
} from "@/lib/audit/checks/geo/page-scan";
import { COPYRIGHT_RE, SCHEMA_HOURS_RE } from "@/lib/audit/checks/geo/fact-consistency";
import { DAY_HOURS, ENABLE_JS } from "@/lib/audit/checks/geo/raw-html-facts";
import { VISIBLE_REVIEWS } from "@/lib/audit/checks/geo/review-signals";
import { CHALLENGE_BODY, classifyLayer } from "@/lib/audit/checks/geo/crawler-probe";
import { LASTMOD_RE } from "@/lib/audit/checks/seo/bing-indexnow";
import { BARE_DOMAIN, HTML_TAG, INSTRUCTION_PATTERNS, MD_LINK_DEST, OBFUSCATED_EMAIL, URL_RE } from "@/lib/audit/ai/validate";
import { DELIM_WORDS } from "@/lib/audit/ai/prompt";
import { stripThinking } from "@/lib/audit/ai/client";
import { TITLE_RE } from "@/lib/audit/net/soft404";
import { PLATFORM_REGEXES } from "@/lib/audit/platform";

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

describe("R3 C1: PRICE_RE digit-group runs (was quadratic: 64 KB page = 22 s)", { timeout: 120_000 }, () => {
  beforeEach(() => {
    slack = Math.max(1, unitMs() / REF_UNIT_MS);
  });
  const run = (wrap: (t: string) => string) => (n: number) => fullAnalysis(doc({ body: wrap(`1${",111".repeat(n)}`) }));
  for (const [name, wrap] of [
    ["<p>", (t: string) => `<p>${t}</p>`],
    ["data-nosnippet", (t: string) => `<div data-nosnippet>${t}</div>`],
    ["<del>", (t: string) => `<del>${t}</del>`],
  ] as const) {
    it(`64 KB of ",111" groups inside ${name} is linear`, () => {
      const r = timed(() => run(wrap)(16_000));
      expect(r.ms).toBeLessThan(within(LIMIT_MS));
      expect(growth(run(wrap), 8_000)).toBeLessThan(MAX_GROWTH);
    });
  }
  it('".111" and " 111" groups too', () => {
    for (const sep of [".", " "]) {
      const r = timed(() => fullAnalysis(doc({ body: `<p>1${`${sep}111`.repeat(16_000)}</p>` })));
      expect(r.ms).toBeLessThan(within(LIMIT_MS));
    }
  });
});

/**
 * Sweep of every regex added since v1 (R3): each runs on adversarial inputs that repeat the
 * pattern's own prefix without the token it requires next. 512 KB here so the suite stays fast;
 * SWEEP_KB=2048 SHOW_SWEEP=1 prints the 2 MB table used in the R3 report.
 */
describe("R3 regex sweep: adversarial inputs stay linear", { timeout: 300_000 }, () => {
  const KB = Number(process.env.SWEEP_KB ?? 512);
  const fill = (unit: string) => unit.repeat(Math.ceil((KB * 1024) / unit.length)).slice(0, KB * 1024);
  const INPUTS: Record<string, string> = {
    commaGroups: `1${fill(",111")}`,
    dotGroups: `1${fill(".111")}`,
    spaceGroups: `1${fill(" 111")}`,
    digits: fill("9"),
    letters: fill("a"),
    spaces: `x${fill(" ")}`,
    openTags: fill("<a"),
    titleTags: fill("<title"),
    thinkTags: fill("<think>"),
    begin: fill("BEGIN "),
    atDot: fill("a (at) b "),
    times: fill("1:11 "),
    dashNames: fill("— Ab "),
    days: fill("mon "),
    wwwRuns: fill("www.a"),
    mdLinks: fill("]("),
    requestBlocked: fill("request blocked "),
    copyright: fill("© 2020 "),
    ignore: fill("ignore the "),
    goDaddy: fill("go daddy website "),
    commaSpaces: `a${fill(",  ")}`,
  };
  const REGEXES: Record<string, RegExp> = {
    PRICE_RE, PHONE_RE, EMAIL_RE, TIME_RANGE_RE, STREET_RE, STRUCK_CLASS, TESTIMONIAL_CLASS, ATTRIBUTION_TAIL,
    COPYRIGHT_RE, SCHEMA_HOURS_RE, DAY_HOURS, ENABLE_JS, VISIBLE_REVIEWS, CHALLENGE_BODY, LASTMOD_RE,
    HTML_TAG, URL_RE, BARE_DOMAIN, MD_LINK_DEST, OBFUSCATED_EMAIL, DELIM_WORDS, TITLE_RE,
    ...Object.fromEntries(INSTRUCTION_PATTERNS.map((re, i) => [`INSTRUCTION_PATTERNS[${i}]`, re])),
    ...Object.fromEntries(Object.entries(PLATFORM_REGEXES).map(([k, re]) => [`PLATFORM_REGEXES.${k}`, re])),
  };
  const worst = (fn: (s: string) => unknown) => {
    let max = 0;
    let which = "";
    for (const [name, s] of Object.entries(INPUTS)) {
      const ms = timed(() => fn(s)).ms;
      if (ms > max) {
        max = ms;
        which = name;
      }
    }
    return { max, which };
  };
  const rows: string[] = [];

  for (const [name, re] of Object.entries(REGEXES)) {
    it(name, () => {
      const r = worst((s) => {
        const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
        const it = s.matchAll(g);
        for (let n = 0; n <= 100_000 && !it.next().done; n++);
      });
      rows.push(`| ${name} | ${r.max.toFixed(0)} ms | ${r.which} |`);
      expect(r.max, `${name} on ${r.which}`).toBeLessThan(within(KB >= 2048 ? 5_000 : 1_500));
    });
  }
  it("stripThinking and classifyLayer", () => {
    const a = worst((s) => stripThinking(s));
    const b = worst((s) => classifyLayer({ method: "GET", status: 403, headers: {}, body: s, size: s.length }));
    rows.push(`| stripThinking | ${a.max.toFixed(0)} ms | ${a.which} |`, `| classifyLayer (body capped 20 KB) | ${b.max.toFixed(0)} ms | ${b.which} |`);
    expect(a.max).toBeLessThan(within(1_500));
    expect(b.max).toBeLessThan(within(1_500));
    if (process.env.SHOW_SWEEP) console.log(`input ${KB} KB
| regex | worst | input |
|---|---|---|
${rows.join("\n")}`);
  });
});
