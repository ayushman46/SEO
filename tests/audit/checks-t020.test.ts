/** T020: geo.snippet-eligibility, geo.review-signals, seo.bing-indexnow, seo.soft-404. */
import { describe, expect, it, vi } from "vitest";
import { robotsDirectives, snippetEligibilityCheck } from "@/lib/audit/checks/geo/snippet-eligibility";
import { reviewProfiles, reviewSignalsCheck } from "@/lib/audit/checks/geo/review-signals";
import { bingIndexNowCheck, newestLastmod } from "@/lib/audit/checks/seo/bing-indexnow";
import { soft404Outcome } from "@/lib/audit/checks/seo/soft-404";
import { probeSoft404 } from "@/lib/audit/net/soft404";
import { analyze } from "@/lib/audit/analyze";
import { ISSUE_CATALOG } from "@/lib/audit/issues";
import { ACCEPTANCE_TESTS } from "@/lib/audit/export";
import { CHECK_WEIGHTS } from "@/lib/audit/score";
import type { SafeFetchResult } from "@/lib/audit/net/fetch";
import { doc, makeCtx, page } from "./helpers";

const HOME = "https://acme.example.com/";
const NOW = new Date(Date.UTC(2026, 10, 23));
const ctxOf = (o: { head?: string; body?: string; headers?: Record<string, string>; robots?: string; sitemap?: string; more?: string[] } = {}) => {
  const ctx = makeCtx({
    pages: [
      page(doc({ head: o.head, body: o.body ?? "<h1>Acme</h1><p>Plumbers.</p>" }), HOME, o.headers ? { headers: { "content-type": "text/html", ...o.headers } } : {}),
      ...(o.more ?? []).map((b, i) => page(doc({ body: b }), `${HOME}p${i}`)),
    ],
    robots: o.robots,
    sitemap: o.sitemap,
  });
  ctx.now = NOW;
  return ctx;
};
const keys = (o: { issues: { key: string }[] }) => o.issues.map((i) => i.key).sort();

describe("geo.snippet-eligibility", () => {
  it("passes without snippet controls", () => {
    expect(snippetEligibilityCheck(ctxOf()).status).toBe("pass");
  });

  it("nosnippet / max-snippet:0 in meta or header (generic, googlebot or bingbot scope)", () => {
    const meta = snippetEligibilityCheck(ctxOf({ head: '<meta name="robots" content="index, nosnippet">' }));
    expect(keys(meta)).toEqual(["geo.snippet-eligibility:nosnippet"]);
    expect(meta.issues[0].severity).toBe("critical"); // homepage
    expect(keys(snippetEligibilityCheck(ctxOf({ headers: { "x-robots-tag": "googlebot: max-snippet:0" } })))).toEqual(["geo.snippet-eligibility:nosnippet"]);
    expect(snippetEligibilityCheck(ctxOf({ headers: { "x-robots-tag": "otherbot: nosnippet" } })).status).toBe("pass");
    expect(robotsDirectives(ctxOf({ head: '<meta name="robots" content="max-snippet:-1">' }).pages[0]).maxSnippet).toBeNull();
  });

  it("very low max-snippet and noarchive (nocache wins in Bing)", () => {
    const o = snippetEligibilityCheck(ctxOf({ head: '<meta name="robots" content="max-snippet:20, noarchive">' }));
    expect(keys(o)).toEqual(["geo.snippet-eligibility:max-snippet", "geo.snippet-eligibility:noarchive"]);
    expect(snippetEligibilityCheck(ctxOf({ head: '<meta name="bingbot" content="noarchive, nocache">' })).status).toBe("pass");
  });

  it("data-nosnippet wrapping core facts", () => {
    const o = snippetEligibilityCheck(ctxOf({ body: '<h1>Acme</h1><p>Plumbers.</p><div data-nosnippet>Call +44 113 496 0000. Boiler service from £79.</div>' }));
    expect(keys(o)).toEqual(["geo.snippet-eligibility:data-nosnippet-facts"]);
    expect(o.issues[0].detail).toMatch(/prices.*phone number/);
    expect(snippetEligibilityCheck(ctxOf({ body: '<h1>Acme</h1><p>Plumbers.</p><div data-nosnippet>We use cookies.</div>' })).status).toBe("pass");
  });

  it("Google-Extended / Applebot-Extended opt-outs are a note, not a penalty", () => {
    const o = snippetEligibilityCheck(ctxOf({ robots: "User-agent: Google-Extended\nDisallow: /\n\nUser-agent: *\nAllow: /" }));
    expect(o.status).toBe("pass");
    expect(o.summary).toMatch(/Google-Extended.*deliberate choice/);
  });

  it("copy quotes Google's documented requirement", () => {
    expect(ISSUE_CATALOG["geo.snippet-eligibility:nosnippet"].description).toMatch(/eligible to be shown with a snippet to appear as a supporting link in AI Overviews or AI Mode/);
  });
});

describe("geo.review-signals", () => {
  it("finds review profiles in links and sameAs", () => {
    const ctx = ctxOf({
      body: '<a href="https://g.page/acme-plumbing">Google reviews</a><a href="https://www.justdial.com/Leeds/Acme">Justdial</a>',
      head: '<script type="application/ld+json">{"@type":"Plumber","name":"Acme","sameAs":["https://www.yelp.co.uk/biz/acme"]}</script>',
    });
    expect(reviewProfiles(ctx).sort()).toEqual(["Google Business Profile", "Justdial", "Yelp"]);
    expect(reviewSignalsCheck(ctx).status).toBe("pass");
  });

  it("rating schema without visible reviews is a mismatch risk", () => {
    const o = reviewSignalsCheck(
      ctxOf({
        body: '<a href="https://www.trustpilot.com/review/acme">x</a><p>Plumbers in Leeds.</p>',
        head: '<script type="application/ld+json">{"@type":"Plumber","name":"Acme","aggregateRating":{"@type":"AggregateRating","ratingValue":4.9,"reviewCount":120}}</script>',
      }),
    );
    expect(keys(o)).toEqual(["geo.review-signals:schema-without-visible"]);
  });

  it("anonymous testimonials vs named ones; no profiles", () => {
    const anon = reviewSignalsCheck(ctxOf({ body: "<blockquote>They fixed our boiler on the same day, brilliant service.</blockquote><blockquote>Friendly and fast plumbers, would use again.</blockquote>" }));
    expect(keys(anon)).toEqual(["geo.review-signals:anonymous-testimonials", "geo.review-signals:no-profiles"]);
    const named = reviewSignalsCheck(
      ctxOf({ body: '<a href="https://www.g2.com/products/acme">G2</a><blockquote>They fixed our boiler the same day, brilliant.<cite>Priya S., Leeds</cite></blockquote><div class="testimonial">Friendly and fast plumbers, would use again — John Smith</div>' }),
    );
    expect(named.status).toBe("pass");
  });

  it("copy states the evidence is correlational and vendor-run", () => {
    expect(ISSUE_CATALOG["geo.review-signals:no-profiles"].description).toMatch(/vendor-run and correlational/);
    expect(CHECK_WEIGHTS["geo.review-signals"]).toBeLessThanOrEqual(4);
  });
});

describe("seo.bing-indexnow", () => {
  const fresh = '<urlset><url><loc>https://acme.example.com/</loc><lastmod>2026-11-01</lastmod></url></urlset>';
  it("verified + fresh sitemap passes", () => {
    expect(bingIndexNowCheck(ctxOf({ head: '<meta name="msvalidate.01" content="ABC">', sitemap: fresh })).status).toBe("pass");
  });

  it("never fails: at most warn, even when everything is missing", () => {
    const o = bingIndexNowCheck(ctxOf({ sitemap: "<urlset><url><loc>https://acme.example.com/</loc></url></urlset>" }));
    expect(o.status).toBe("warn");
    expect(keys(o)).toEqual(["seo.bing-indexnow:no-lastmod", "seo.bing-indexnow:not-verified"]);
    const stale = bingIndexNowCheck(ctxOf({ head: '<meta name="msvalidate.01" content="ABC">', sitemap: fresh.replace("2026-11-01", "2024-01-01") }));
    expect(keys(stale)).toEqual(["seo.bing-indexnow:stale-lastmod"]);
    expect(stale.status).toBe("warn");
  });

  it("parses lastmod and copy is honest about Copilot", () => {
    expect(newestLastmod("<lastmod>2025-01-01</lastmod><lastmod>2026-02-03T10:00:00+00:00</lastmod>")?.toISOString().slice(0, 10)).toBe("2026-02-03");
    expect(ISSUE_CATALOG["seo.bing-indexnow:not-verified"].description).toMatch(/confirmed to feed Microsoft Copilot; whether it feeds other assistants isn't confirmed/);
    expect(ISSUE_CATALOG["seo.bing-indexnow:not-verified"].howToFix).toMatch(/1\).*2\).*3\)/);
  });
});

describe("seo.soft-404", () => {
  const res = (status: number, location: string | null = null, text = ""): SafeFetchResult => ({
    requestedUrl: "", finalUrl: "", status, headers: {}, bytes: Buffer.from(text), text, truncated: false, redirects: [], location,
  });

  it("one request to a made-up path on the audited host, no redirects followed", async () => {
    const f = vi.fn(async () => res(404));
    const p = await probeSoft404(ctxOf(), { timeoutMs: 3_000, fetcher: f, path: "/seenhq-missing-page-test" });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, opts] = f.mock.calls[0] as unknown as [string, { maxRedirects: number }];
    expect(url).toBe("https://acme.example.com/seenhq-missing-page-test");
    expect(opts.maxRedirects).toBe(0);
    expect(soft404Outcome(p, ctxOf()).status).toBe("pass");
  });

  it("200 → fail; redirect to home → warn; other redirect → pass; skipped → unavailable", async () => {
    const ctx = ctxOf();
    const run = async (r: SafeFetchResult) => soft404Outcome(await probeSoft404(ctx, { timeoutMs: 3_000, fetcher: async () => r }), ctx);
    const soft = await run(res(200, null, "<title>Oops</title>"));
    expect(soft.status).toBe("fail");
    expect(keys(soft)).toEqual(["seo.soft-404:returns-200"]);
    expect(keys(await run(res(301, "https://acme.example.com/")))).toEqual(["seo.soft-404:redirects-home"]);
    expect((await run(res(301, "https://acme.example.com/404"))).status).toBe("pass");
    expect(soft404Outcome({ status: "skipped", reason: "not_run" }, ctx).status).toBe("unavailable");
    const err = await probeSoft404(ctx, { timeoutMs: 3_000, fetcher: async () => Promise.reject(new Error("x")) });
    expect(err).toEqual({ status: "skipped", reason: "error" });
  });

  it("respects robots.txt for our own bot", async () => {
    const f = vi.fn(async () => res(404));
    const p = await probeSoft404(ctxOf({ robots: "User-agent: seenhqbot\nDisallow: /" }), { timeoutMs: 3_000, fetcher: f });
    expect(p).toEqual({ status: "skipped", reason: "robots" });
    expect(f).not.toHaveBeenCalled();
  });
});

describe("T020 wiring", () => {
  it("every new check has a weight, a real label and an acceptance test", () => {
    const a = analyze(ctxOf());
    for (const id of ["geo.snippet-eligibility", "geo.review-signals", "seo.bing-indexnow", "seo.soft-404", "geo.ai-crawler-probe"]) {
      const c = a.checks.find((x) => x.id === id)!;
      expect(c, id).toBeTruthy();
      expect(c.label.length, id).toBeGreaterThan(5);
      expect(c.label, id).not.toBe("Check");
      expect(CHECK_WEIGHTS[id], id).toBeGreaterThan(0);
      expect(ACCEPTANCE_TESTS[id], id).toBeTruthy();
    }
    expect(a.checks.find((x) => x.id === "seo.soft-404")!.status).toBe("unavailable");
  });
});
