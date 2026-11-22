/** T016: geo.content-format, geo.fact-consistency, geo.raw-html-facts (deterministic, fixtures only). */
import { describe, expect, it } from "vitest";
import { contentFormatCheck } from "@/lib/audit/checks/geo/content-format";
import { copyrightYear, factConsistencyCheck, isStaleYear } from "@/lib/audit/checks/geo/fact-consistency";
import { factPresence, rawHtmlFactsCheck } from "@/lib/audit/checks/geo/raw-html-facts";
import { phonesInText, priceValue, timeRangesInText } from "@/lib/audit/checks/geo/page-scan";
import { analyze } from "@/lib/audit/analyze";
import { ISSUE_CATALOG } from "@/lib/audit/issues";
import { doc, goodHome, makeCtx, page } from "./helpers";

const HOME = "https://acme.example.com/";
const NOW = new Date(Date.UTC(2026, 10, 23));
const ctxOf = (body: string, head = "", extra: { now?: Date; more?: string[] } = {}) => {
  const ctx = makeCtx({
    pages: [page(doc({ head, body }), HOME), ...(extra.more ?? []).map((b, i) => page(doc({ body: b }), `${HOME}p${i}`))],
  });
  ctx.now = extra.now ?? NOW;
  return ctx;
};
const keys = (o: { issues: { key: string }[] }) => o.issues.map((i) => i.key).sort();
const LONG_TEXT = "We cook fresh food every day using local produce from farms around the valley. ".repeat(3);

describe("geo.content-format", () => {
  it("passes when key sections are text", () => {
    const o = contentFormatCheck(ctxOf(`<h2>Prices</h2><ul><li>Haircut £25</li></ul><p>${LONG_TEXT}</p><img src="a.jpg" alt="Salon chair">`));
    expect(o.status).toBe("pass");
  });

  it("flags a menu PDF by link text or file name", () => {
    const a = contentFormatCheck(ctxOf('<a href="/files/x.pdf">Download our menu</a>'));
    expect(keys(a)).toEqual(["geo.content-format:pdf-only"]);
    const b = contentFormatCheck(ctxOf('<a href="/files/Price%20List%202026.pdf?v=2">here</a>'));
    expect(keys(b)).toEqual(["geo.content-format:pdf-only"]);
    expect(contentFormatCheck(ctxOf('<a href="/files/annual-report.pdf">Annual report</a>')).status).toBe("pass");
  });

  it("flags image-only price/menu/hours sections and weak alt text", () => {
    const o = contentFormatCheck(ctxOf('<section><h2>Our menu</h2><img src="menu1.jpg" alt=""><img src="menu2.jpg"></section><h2>About</h2><p>x</p>'));
    expect(keys(o)).toEqual(["geo.content-format:image-only", "geo.content-format:weak-alt"]);
    expect(o.issues[0].detail).toContain('"Our menu"');
    // heading wrapped in its own div: the images are in the next sibling of the wrapper
    const w = contentFormatCheck(ctxOf('<div><h2>Opening hours</h2></div><div><img src="hours.png" alt="Opening hours: Mon-Fri 9am-5pm"></div>'));
    expect(keys(w)).toEqual(["geo.content-format:image-only"]);
  });

  it("copy states the honest limit and includes a text template", () => {
    expect(ISSUE_CATALOG["geo.content-format:pdf-only"].description).toMatch(/don't open the PDF/);
    expect(ISSUE_CATALOG["geo.content-format:image-only"].howToFix).toContain("<h2>");
  });
});

describe("geo.fact-consistency", () => {
  it("passes on a clean page", () => {
    expect(factConsistencyCheck(ctxOf(`<p>${LONG_TEXT}</p><footer>© 2026 Acme</footer>`)).status).toBe("pass");
  });

  it("flags crossed-out prices (tag, inline style, class)", () => {
    for (const html of [
      "<p>Now £19 <s>£29</s></p>",
      '<p><span style="text-decoration: line-through">$29.00</span> $19</p>',
      '<p><span class="price old-price">€29</span> €19</p>',
    ]) {
      expect(keys(factConsistencyCheck(ctxOf(html))), html).toContain("geo.fact-consistency:struck-price");
    }
    expect(factConsistencyCheck(ctxOf("<p><del>old wording</del></p>")).status).toBe("pass");
  });

  it("flags hidden prices / phones / times but not hidden plain text", () => {
    const o = factConsistencyCheck(ctxOf('<div style="display:none">Call +44 113 496 0000</div><p hidden>Mon-Fri 9am-5pm</p>'));
    expect(keys(o)).toContain("geo.fact-consistency:hidden-facts");
    expect(o.issues.find((i) => i.key === "geo.fact-consistency:hidden-facts")!.detail).toMatch(/phone numbers.*opening times/);
    expect(factConsistencyCheck(ctxOf('<span aria-hidden="true">menu</span>')).status).toBe("pass");
  });

  it("different phone numbers across links and schema; same number in two formats is fine", () => {
    const schema = '<script type="application/ld+json">{"@type":"Plumber","name":"Acme","telephone":"+44 113 496 0000"}</script>';
    expect(factConsistencyCheck(ctxOf('<a href="tel:01134960000">Call</a>', schema)).status).toBe("pass");
    const o = factConsistencyCheck(ctxOf('<a href="tel:01134960999">Call</a>', schema));
    expect(keys(o)).toEqual(["geo.fact-consistency:phones"]);
    expect(ISSUE_CATALOG["geo.fact-consistency:phones"].description).toMatch(/[Cc]all-tracking/);
  });

  it("schema Offer price not shown on the page", () => {
    const schema = '<script type="application/ld+json">{"@type":"Product","name":"Plan","offers":{"@type":"Offer","price":"29.00","priceCurrency":"USD"}}</script>';
    expect(keys(factConsistencyCheck(ctxOf("<p>Only $19 per month</p>", schema)))).toEqual(["geo.fact-consistency:schema-price"]);
    expect(factConsistencyCheck(ctxOf("<p>Only $29 per month</p>", schema)).status).toBe("pass");
  });

  it("schema hours that match no hours on the page", () => {
    const schema =
      '<script type="application/ld+json">{"@type":"Dentist","name":"Smile","openingHoursSpecification":{"@type":"OpeningHoursSpecification","opens":"09:00","closes":"17:00"}}</script>';
    expect(keys(factConsistencyCheck(ctxOf("<p>Open Mon-Fri 8am-6pm</p>", schema)))).toEqual(["geo.fact-consistency:hours"]);
    expect(factConsistencyCheck(ctxOf("<p>Open Mon-Fri 9am-5pm</p>", schema)).status).toBe("pass");
  });

  it("different street addresses across pages", () => {
    const o = factConsistencyCheck(
      ctxOf("<address>12 High Street, Leeds</address>", "", { more: ["<address>40 Park Road, Leeds</address>"] }),
    );
    expect(keys(o)).toEqual(["geo.fact-consistency:addresses"]);
    expect(factConsistencyCheck(ctxOf("<address>12 High St., Leeds</address>", "", { more: ["<address>12 High Street, Leeds</address>"] })).status).toBe("pass");
  });

  it("stale footer year uses the date passed in", () => {
    expect(copyrightYear("© 2019–2025 Acme Ltd")).toBe(2025);
    expect(copyrightYear("Copyright 2024 Acme")).toBe(2024);
    expect(isStaleYear(2025, NOW)).toBe(true);
    expect(isStaleYear(2026, NOW)).toBe(false);
    expect(isStaleYear(2026, new Date(Date.UTC(2027, 0, 10)))).toBe(false); // January grace
    expect(isStaleYear(2025, new Date(Date.UTC(2027, 0, 10)))).toBe(true);
    const o = factConsistencyCheck(ctxOf("<footer>© 2023 Acme</footer>"));
    expect(keys(o)).toEqual(["geo.fact-consistency:stale-year"]);
    expect(o.issues[0].detail).toContain("2026");
    expect(factConsistencyCheck(ctxOf("<footer>© 2023 Acme</footer>", "", { now: new Date(Date.UTC(2023, 5, 1)) })).status).toBe("pass");
  });
});

describe("geo.raw-html-facts", () => {
  it("reports each core fact as in text / JSON-LD only / not found", () => {
    const schema = '<script type="application/ld+json">{"@type":"Dentist","name":"Smile","email":"hi@smile.example","openingHours":"Mo-Fr 09:00-17:00"}</script>';
    const ctx = ctxOf(`<p>${LONG_TEXT} Call (0113) 496 0000. Check-ups from £45.</p>`, schema);
    expect(factPresence(ctx)).toEqual({
      phone: "in page text",
      email: "in JSON-LD only",
      address: "not found in raw HTML",
      hours: "in JSON-LD only",
      price: "in page text",
    });
    const o = rawHtmlFactsCheck(ctx);
    expect(keys(o)).toEqual(["geo.raw-html-facts:jsonld-only"]);
    expect(o.summary).toContain("email: in JSON-LD only");
  });

  it("detects a JavaScript app shell", () => {
    const shell =
      '<div id="root"></div><noscript>You need to enable JavaScript to run this app.</noscript><script src="/static/js/main.js"></script><script src="/static/js/vendor.js"></script>';
    const o = rawHtmlFactsCheck(ctxOf(shell));
    expect(keys(o)).toEqual(["geo.raw-html-facts:js-shell"]);
    expect(o.issues[0].severity).toBe("high");
    expect(o.status).toBe("fail");
    expect(ISSUE_CATALOG["geo.raw-html-facts:js-shell"].description).toMatch(/don't run JavaScript/);
  });

  it("server-rendered pages with scripts are not shells", () => {
    const o = rawHtmlFactsCheck(ctxOf(`<div id="__next"><h1>Acme</h1><p>${LONG_TEXT}</p><a href="mailto:hi@acme.example.com">Email</a></div><script src="/a.js"></script><script src="/b.js"></script>`));
    expect(o.status).toBe("pass");
  });

  it("no contact detail anywhere", () => {
    expect(keys(rawHtmlFactsCheck(ctxOf(`<p>${LONG_TEXT}</p>`)))).toEqual(["geo.raw-html-facts:no-contact"]);
  });
});

describe("patterns", () => {
  it("phones, prices, times", () => {
    expect(phonesInText("Call +44 113 496 0000 or (0113) 496-0001; order 1234567; years 2019-2024")).toEqual(["441134960000", "01134960001"]);
    expect(priceValue("£1,299.50")).toBe(1299.5);
    expect(priceValue("1.299,50 €")).toBe(1299.5);
    expect(timeRangesInText("Mon–Fri 9am–5:30pm, Sat 10:00-14:00, delivery in 3-5 days")).toEqual(["09:00-17:30", "10:00-14:00"]);
  });

  it("hostile text stays fast (no regex backtracking blow-up)", { timeout: 60_000 }, () => {
    // Asserted as growth (doubling the input must not ~4x the time), so machine load can't flake it.
    const run = (n: number) => {
      const html = doc({ body: `<p>${"a".repeat(10 * n)}@</p><p>${"1 ".repeat(5 * n / 2)}</p><p>${"£1,".repeat(n)}</p>` });
      const ctx = makeCtx({ pages: [page(html, HOME)] });
      const t = performance.now();
      analyze(ctx);
      return performance.now() - t;
    };
    const best = (n: number) => Math.min(run(n), run(n));
    const t1 = best(10_000);
    const t2 = best(20_000);
    expect(t2 / Math.max(t1, 25)).toBeLessThan(3.2);
    expect(t2).toBeLessThan(15_000); // the regex bug took minutes at this size
  });
});

describe("integration", () => {
  it("the good fixture still passes all three new checks", () => {
    const a = analyze(makeCtx({ pages: [page(goodHome(HOME), HOME)] }));
    for (const id of ["geo.content-format", "geo.fact-consistency", "geo.raw-html-facts"]) {
      expect(a.checks.find((c) => c.id === id)?.status, id).toBe("pass");
    }
  });
});
