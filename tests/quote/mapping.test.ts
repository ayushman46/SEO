import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/audit/analyze";
import { ISSUE_CATALOG } from "@/lib/audit/issues";
import { catalogItem } from "@/lib/quote/catalog";
import {
  CHECK_ROUTES,
  checkIdOf,
  FIXER_CATALOG_KEY,
  hasExplicitRoute,
  ISSUE_ROUTES,
  routeFor,
} from "@/lib/quote/mapping";
import { doc, goodHome, makeCtx, page } from "../audit/helpers";

/*
 * The engine exports no list of check ids (reported to Fable). We cover it two ways:
 * every issue in ISSUE_CATALOG (the only issues the engine can emit) and every check id that
 * analyze() actually produces for a good and a bad site.
 */
function emittedCheckIds(): string[] {
  const bad = doc({ body: "<p>hi</p>" });
  const ids = new Set<string>();
  for (const ctx of [
    makeCtx({ pages: [page(goodHome())] }),
    makeCtx({ pages: [page(bad)], robots: "User-agent: *\nDisallow: /" }),
  ]) {
    for (const c of analyze(ctx).checks) ids.add(c.id);
  }
  return [...ids].sort();
}

describe("mapping covers everything the engine can emit", () => {
  it("every issue id in ISSUE_CATALOG has an explicit route", () => {
    const missing = Object.keys(ISSUE_CATALOG).filter((id) => !hasExplicitRoute(id));
    expect(missing).toEqual([]);
  });

  it("every check id used by ISSUE_CATALOG has a check route", () => {
    const checkIds = new Set(Object.values(ISSUE_CATALOG).map((c) => c.checkId));
    const missing = [...checkIds].filter((id) => !(id in CHECK_ROUTES));
    expect(missing).toEqual([]);
  });

  it("every check id analyze() emits has a check route", () => {
    const ids = emittedCheckIds();
    expect(ids.length).toBeGreaterThan(20);
    expect(ids.filter((id) => !(id in CHECK_ROUTES))).toEqual([]);
  });

  it("issue ids follow the <checkId>:<variant> form the partial report relies on", () => {
    for (const [id, copy] of Object.entries(ISSUE_CATALOG)) expect(checkIdOf(id), id).toBe(copy.checkId);
  });

  it("routes the new GEO checks, including the AI crawler probe", () => {
    for (const id of ["geo.ai-clarity", "geo.content-format", "geo.fact-consistency", "geo.raw-html-facts", "geo.ai-crawler-probe"]) {
      expect(id in CHECK_ROUTES, id).toBe(true);
    }
    expect(routeFor({ id: "geo.ai-crawler-probe:blocked" }).fixer).toBe("ai-crawler-unblock");
  });

  it("issue overrides only refer to known issues", () => {
    for (const id of Object.keys(ISSUE_ROUTES)) expect(id in ISSUE_CATALOG, id).toBe(true);
  });
});

describe("routeFor", () => {
  it("falls back to technical-fixes for unknown ids", () => {
    expect(routeFor({ id: "seo.brand-new:thing" })).toEqual({ fixer: "technical-fixes", service: "technical-fixes" });
    expect(routeFor({ id: "internal.check-3", checkId: "internal.check-3" }).fixer).toBe("technical-fixes");
  });

  it("prefers the issue route, then the given checkId, then the id prefix", () => {
    expect(routeFor({ id: "seo.indexability:noindex" }).fixer).toBe("diy");
    expect(routeFor({ id: "seo.indexability:bad-status" }).fixer).toBe("technical-fixes");
    expect(routeFor({ id: "whatever", checkId: "seo.title" }).fixer).toBe("diy");
    expect(routeFor({ id: "seo.title:missing" }).fixer).toBe("diy");
  });

  it("is not fooled by prototype keys", () => {
    expect(routeFor({ id: "constructor" }).fixer).toBe("technical-fixes");
    expect(routeFor({ id: "__proto__:x" }).fixer).toBe("technical-fixes");
  });

  it("DIY items are the minutes-long ones", () => {
    for (const id of ["seo.title:missing", "seo.meta-description:missing", "seo.headings:missing-h1", "geo.fact-consistency:stale-year"]) {
      expect(routeFor({ id }).fixer, id).toBe("diy");
    }
  });

  it("every route's service sells through a quotable catalog item", () => {
    const routes = [...Object.values(CHECK_ROUTES), ...Object.values(ISSUE_ROUTES)];
    for (const r of routes) {
      expect(catalogItem(FIXER_CATALOG_KEY[r.service]).quotable).toBe(true);
      if (r.fixer !== "diy" && r.fixer !== "none") expect(r.service).toBe(r.fixer);
    }
  });
});

describe("routes for the checks added after T019", () => {
  it("routes the exact engine ids as agreed", () => {
    const expected: Record<string, string> = {
      "geo.snippet-eligibility:nosnippet": "diy",
      "geo.snippet-eligibility:max-snippet": "diy",
      "geo.snippet-eligibility:noarchive": "diy",
      "geo.snippet-eligibility:data-nosnippet-facts": "technical-fixes",
      "geo.review-signals:no-profiles": "local-ai-setup",
      "geo.review-signals:schema-without-visible": "technical-fixes",
      "geo.review-signals:anonymous-testimonials": "diy",
      "seo.bing-indexnow:no-lastmod": "diy",
      "seo.bing-indexnow:not-verified": "diy",
      "seo.bing-indexnow:stale-lastmod": "diy",
      "seo.soft-404:redirects-home": "technical-fixes",
      "seo.soft-404:returns-200": "technical-fixes",
      "geo.ai-crawler-probe:different-content": "technical-fixes",
    };
    for (const v of ["cloudflare", "vercel", "akamai", "sucuri", "wordfence", "imperva", "aws", "host"]) {
      expected[`geo.ai-crawler-probe:blocked-${v}`] = "ai-crawler-unblock";
    }
    for (const [id, fixer] of Object.entries(expected)) {
      expect(id in ISSUE_CATALOG, `${id} exists in the engine`).toBe(true);
      expect(routeFor({ id }).fixer, id).toBe(fixer);
    }
  });
});
