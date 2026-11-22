import { describe, expect, it } from "vitest";
import { doc, goodHome, makeCtx, page } from "./helpers";
import { titleCheck } from "@/lib/audit/checks/seo/title";
import { metaDescriptionCheck } from "@/lib/audit/checks/seo/meta-description";
import { headingsCheck, hasSkippedLevels } from "@/lib/audit/checks/seo/headings";
import { canonicalCheck } from "@/lib/audit/checks/seo/canonical";
import { indexabilityCheck } from "@/lib/audit/checks/seo/indexability";
import { robotsTxtCheck } from "@/lib/audit/checks/seo/robots-txt";
import { parseSitemap, sitemapCheck } from "@/lib/audit/checks/seo/sitemap";
import { imageAltCheck } from "@/lib/audit/checks/seo/image-alt";
import { structuredDataCheck } from "@/lib/audit/checks/seo/structured-data";
import { openGraphCheck } from "@/lib/audit/checks/seo/open-graph";
import { httpsCheck } from "@/lib/audit/checks/seo/https";
import { viewportCheck } from "@/lib/audit/checks/seo/viewport";
import { langCheck } from "@/lib/audit/checks/seo/lang";
import { SEO_CHECKS } from "@/lib/audit/checks/seo";

const HOME = "https://acme.example.com/";
const ABOUT = "https://acme.example.com/about/";
const keys = (o: { issues: { key: string }[] }) => o.issues.map((i) => i.key);

describe("a well-built site passes every SEO check", () => {
  it("all pass", () => {
    const ctx = makeCtx({
      pages: [page(goodHome())],
      robots: "User-agent: *\nAllow: /\nSitemap: https://acme.example.com/sitemap.xml",
      sitemap: `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${HOME}</loc></url></urlset>`,
    });
    for (const check of SEO_CHECKS) {
      const o = check(ctx);
      expect({ id: o.id, status: o.status, issues: keys(o) }).toEqual({ id: o.id, status: "pass", issues: [] });
      expect(o.score).toBe(1);
    }
  });
});

describe("seo.title", () => {
  it("flags missing, wrong length and duplicates", () => {
    const ctx = makeCtx({
      pages: [
        page(doc({ head: "" }), HOME),
        page(doc({ head: "<title>Short</title>" }), ABOUT),
        page(doc({ head: "<title>Short</title>" }), "https://acme.example.com/x"),
      ],
    });
    const o = titleCheck(ctx);
    expect(o.status).toBe("fail");
    expect(keys(o).sort()).toEqual(["seo.title:duplicate", "seo.title:length", "seo.title:missing"]);
    expect(o.issues.find((i) => i.key === "seo.title:missing")?.severity).toBe("critical"); // homepage
  });
  it("ignores <title> inside inline SVG", () => {
    const ctx = makeCtx({ pages: [page(doc({ body: "<svg><title>icon</title></svg>" }))] });
    expect(keys(titleCheck(ctx))).toContain("seo.title:missing");
  });
});

describe("seo.meta-description", () => {
  it("passes a 70–160 char description and flags short ones", () => {
    const good = "a".repeat(10) + " " + "b".repeat(80);
    expect(metaDescriptionCheck(makeCtx({ pages: [page(doc({ head: `<meta name="description" content="${good}">` }))] })).status).toBe("pass");
    const o = metaDescriptionCheck(makeCtx({ pages: [page(doc({ head: `<meta name="description" content="too short">` }))] }));
    expect(keys(o)).toEqual(["seo.meta-description:length"]);
    expect(o.status).toBe("warn");
  });
  it("flags a missing description", () => {
    expect(keys(metaDescriptionCheck(makeCtx({ pages: [page(doc())] })))).toEqual(["seo.meta-description:missing"]);
  });
});

describe("seo.headings", () => {
  it("detects skipped levels", () => {
    expect(hasSkippedLevels([1, 2, 3, 2, 3])).toBe(false);
    expect(hasSkippedLevels([1, 3])).toBe(true);
    expect(hasSkippedLevels([2, 4])).toBe(true);
    expect(hasSkippedLevels([3])).toBe(true);
  });
  it("flags no H1, multiple H1 and skips", () => {
    expect(keys(headingsCheck(makeCtx({ pages: [page(doc({ body: "<h2>a</h2>" }))] })))).toEqual(["seo.headings:missing-h1"]);
    expect(keys(headingsCheck(makeCtx({ pages: [page(doc({ body: "<h1>a</h1><h1>b</h1>" }))] })))).toEqual([
      "seo.headings:multiple-h1",
    ]);
    expect(keys(headingsCheck(makeCtx({ pages: [page(doc({ body: "<h1>a</h1><h4>b</h4>" }))] })))).toEqual([
      "seo.headings:skipped-levels",
    ]);
  });
});

describe("seo.canonical", () => {
  it("missing / relative / other host / multiple", () => {
    expect(keys(canonicalCheck(makeCtx({ pages: [page(doc())] })))).toEqual(["seo.canonical:missing"]);
    expect(keys(canonicalCheck(makeCtx({ pages: [page(doc({ head: '<link rel="canonical" href="/">' }))] })))).toEqual([
      "seo.canonical:relative",
    ]);
    const other = canonicalCheck(makeCtx({ pages: [page(doc({ head: '<link rel="canonical" href="https://other.com/">' }))] }));
    expect(keys(other)).toEqual(["seo.canonical:other-host"]);
    expect(other.status).toBe("fail");
    const multi = canonicalCheck(
      makeCtx({
        pages: [page(doc({ head: `<link rel="canonical" href="${HOME}"><link rel="canonical" href="${ABOUT}">` }))],
      }),
    );
    expect(keys(multi)).toEqual(["seo.canonical:multiple"]);
  });
  it("accepts www ↔ apex as the same site and the Link header form", () => {
    expect(
      canonicalCheck(makeCtx({ pages: [page(doc({ head: '<link rel="canonical" href="https://www.acme.example.com/">' }))] })).status,
    ).toBe("pass");
    expect(
      canonicalCheck(makeCtx({ pages: [page(doc(), HOME, { headers: { link: `<${HOME}>; rel="canonical"` } })] })).status,
    ).toBe("pass");
  });
});

describe("seo.indexability", () => {
  it("noindex meta on the homepage is critical", () => {
    const o = indexabilityCheck(makeCtx({ pages: [page(doc({ head: '<meta name="robots" content="noindex, follow">' }))] }));
    expect(o.status).toBe("fail");
    expect(o.issues[0]).toMatchObject({ key: "seo.indexability:noindex", severity: "critical" });
  });
  it("X-Robots-Tag header, scoped and unscoped", () => {
    const h = (v: string) => indexabilityCheck(makeCtx({ pages: [page(doc(), HOME, { headers: { "x-robots-tag": v } })] }));
    expect(h("noindex").status).toBe("fail");
    expect(h("googlebot: noindex").status).toBe("fail");
    expect(h("otherbot: noindex").status).toBe("pass");
    expect(h("max-snippet: 50, noarchive").status).toBe("pass");
  });
  it("non-200 pages are flagged", () => {
    const o = indexabilityCheck(makeCtx({ pages: [page(doc()), page(doc(), ABOUT, { status: 404 })] }));
    expect(keys(o)).toEqual(["seo.indexability:bad-status"]);
    expect(o.score).toBeCloseTo(0.5);
  });
});

describe("seo.robots-txt", () => {
  it("missing → warn, blocking all → critical", () => {
    expect(robotsTxtCheck(makeCtx({ pages: [page(doc())] })).status).toBe("warn");
    const o = robotsTxtCheck(makeCtx({ pages: [page(doc())], robots: "User-agent: *\nDisallow: /" }));
    expect(o.status).toBe("fail");
    expect(o.issues[0]).toMatchObject({ key: "seo.robots-txt:blocks-all", severity: "critical" });
  });
  it("blocking only some paths passes", () => {
    expect(robotsTxtCheck(makeCtx({ pages: [page(doc())], robots: "User-agent: *\nDisallow: /admin" })).status).toBe("pass");
  });
});

describe("seo.sitemap", () => {
  it("parses urlset, sitemap index and rejects junk", () => {
    expect(parseSitemap(`<urlset><url><loc>${HOME}</loc></url><url><loc>${ABOUT}</loc></url></urlset>`)).toEqual({
      kind: "urlset",
      locs: [HOME, ABOUT],
    });
    expect(parseSitemap(`<sitemapindex><sitemap><loc>${HOME}s1.xml</loc></sitemap></sitemapindex>`).kind).toBe("sitemapindex");
    expect(parseSitemap("<html><body>Not found</body></html>").kind).toBe("invalid");
  });
  it("missing, invalid, empty, ok", () => {
    expect(keys(sitemapCheck(makeCtx({ pages: [page(doc())] })))).toEqual(["seo.sitemap:missing"]);
    expect(keys(sitemapCheck(makeCtx({ pages: [page(doc())], sitemap: "hello" })))).toEqual(["seo.sitemap:invalid"]);
    expect(keys(sitemapCheck(makeCtx({ pages: [page(doc())], sitemap: "<urlset></urlset>" })))).toEqual(["seo.sitemap:empty"]);
    expect(sitemapCheck(makeCtx({ pages: [page(doc())], sitemap: `<urlset><url><loc>${HOME}</loc></url></urlset>` })).status).toBe("pass");
  });
});

describe("seo.image-alt", () => {
  it("counts missing alt only; alt='' and role=presentation are decorative", () => {
    const html = doc({
      body: '<img src=a alt="A cat"><img src=b alt=""><img src=c role="presentation"><img src=d><img src=e>',
    });
    const o = imageAltCheck(makeCtx({ pages: [page(html)] }));
    expect(o.score).toBeCloseTo(0.6);
    expect(o.status).toBe("warn");
    expect(o.summary).toContain("60% of 5 images");
  });
  it("no images → pass", () => {
    expect(imageAltCheck(makeCtx({ pages: [page(doc())] })).status).toBe("pass");
  });
});

describe("seo.structured-data", () => {
  it("missing / invalid JSON / no @type / valid", () => {
    expect(keys(structuredDataCheck(makeCtx({ pages: [page(doc())] })))).toEqual(["seo.structured-data:missing"]);
    const bad = structuredDataCheck(
      makeCtx({ pages: [page(doc({ head: '<script type="application/ld+json">{"@type": "Organization",}</script>' }))] }),
    );
    expect(keys(bad)).toEqual(["seo.structured-data:invalid-json"]);
    expect(
      keys(structuredDataCheck(makeCtx({ pages: [page(doc({ head: '<script type="application/ld+json">{"name":"x"}</script>' }))] }))),
    ).toEqual(["seo.structured-data:no-type"]);
    const ok = structuredDataCheck(
      makeCtx({ pages: [page(doc({ head: '<script type="application/ld+json">[{"@type":"Organization","name":"x"}]</script>' }))] }),
    );
    expect(ok.status).toBe("pass");
    expect(ok.summary).toContain("Organization");
  });
});

describe("seo.open-graph", () => {
  it("reports which tags are missing", () => {
    const o = openGraphCheck(makeCtx({ pages: [page(doc({ head: '<meta property="og:title" content="x">' }))] }));
    expect(keys(o)).toEqual(["seo.open-graph:incomplete"]);
    expect(o.issues[0].detail).toContain("og:image");
    expect(o.score).toBeCloseTo(1 / 3);
  });
});

describe("seo.https", () => {
  it("http final URL is critical; missing redirect warns", () => {
    const http = makeCtx({ pages: [page(doc(), "http://acme.example.com/")] });
    expect(httpsCheck(http).issues[0]).toMatchObject({ key: "seo.https:not-https" });
    expect(httpsCheck(http).status).toBe("fail");
    const noRedirect = makeCtx({ pages: [page(doc())], httpToHttps: { checked: true, redirectsToHttps: false } });
    expect(keys(httpsCheck(noRedirect))).toEqual(["seo.https:no-redirect"]);
    expect(httpsCheck(makeCtx({ pages: [page(doc())] })).status).toBe("pass");
  });
});

describe("seo.viewport and seo.lang", () => {
  it("viewport needs width=device-width", () => {
    expect(viewportCheck(makeCtx({ pages: [page(doc({ head: '<meta name="viewport" content="width=1024">' }))] })).status).toBe("fail");
    expect(
      viewportCheck(makeCtx({ pages: [page(doc({ head: '<meta name="viewport" content="width=device-width,initial-scale=1">' }))] }))
        .status,
    ).toBe("pass");
  });
  it("lang must be non-empty", () => {
    expect(langCheck(makeCtx({ pages: [page(doc({ lang: null }))] })).status).toBe("fail");
    expect(langCheck(makeCtx({ pages: [page(doc({ lang: "" }))] })).status).toBe("fail");
    expect(langCheck(makeCtx({ pages: [page(doc({ lang: "en-GB" }))] })).status).toBe("pass");
  });
});
