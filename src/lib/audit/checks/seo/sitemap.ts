import { load } from "cheerio";
import { domRoot, isElement, textOf, walk, SKIP } from "../../html";
import { outcome, plural, type Check } from "../../context";

const def = { id: "seo.sitemap", category: "seo", label: "XML sitemap" } as const;

export interface ParsedSitemap {
  kind: "urlset" | "sitemapindex" | "invalid";
  /** page URLs (urlset) or child sitemap URLs (sitemapindex) */
  locs: string[];
}

/**
 * Linear-time fallback for namespaced/odd XML. Every repetition is bounded, so a long run
 * of whitespace can't cause quadratic backtracking (ReDoS).
 */
const LOC_FALLBACK = /<(?:\w{1,20}:)?loc>\s{0,64}(?:<!\[CDATA\[\s{0,64})?(https?:\/\/[^<\]\s]{1,2048})/gi;
const MAX_LOCS = 50_000;

let memo: { xml: string; result: ParsedSitemap } | null = null;

export function parseSitemap(xml: string): ParsedSitemap {
  // The crawler and sitemapCheck parse the same (up to 4 MB) body: parse it once.
  if (memo && memo.xml === xml) return memo.result;
  const result = parseSitemapUncached(xml);
  memo = { xml, result };
  return result;
}

function parseSitemapUncached(xml: string): ParsedSitemap {
  const head = xml.slice(0, 4096).toLowerCase();
  const isUrlset = /<(\w+:)?urlset[\s>]/.test(head) || /<(\w+:)?urlset[\s>]/i.test(xml);
  const isIndex = !isUrlset && /<(\w+:)?sitemapindex[\s>]/i.test(xml);
  if (!isUrlset && !isIndex) return { kind: "invalid", locs: [] };
  let locs: string[] = [];
  try {
    const $ = load(xml, { xml: true });
    // Iterative walk with bounded text per <loc>: no recursion, linear on nested/hostile XML.
    walk(domRoot($).children ?? [], null, (n) => {
      if (!isElement(n) || locs.length >= MAX_LOCS) return SKIP;
      if (n.name === "loc") {
        const t = textOf(n, 4_096, 64).trim();
        if (/^https?:\/\//i.test(t)) locs.push(t);
        return SKIP;
      }
      return null;
    });
  } catch {
    locs = [];
  }
  if (locs.length === 0) {
    // Fallback for namespaced/odd XML that the XML parser didn't expose as <loc>.
    for (const m of xml.matchAll(LOC_FALLBACK)) {
      locs.push(m[1]);
      if (locs.length >= MAX_LOCS) break;
    }
  }
  return { kind: isUrlset ? "urlset" : "sitemapindex", locs };
}

export const sitemapCheck: Check = (ctx) => {
  const s = ctx.sitemap;
  if (s.status !== "ok" || !s.text) {
    return outcome(def, {
      score: 0,
      summary: "No XML sitemap was found at /sitemap.xml or in robots.txt.",
      issues: [{ key: "seo.sitemap:missing" }],
    });
  }
  const parsed = parseSitemap(s.text);
  if (parsed.kind === "invalid") {
    return outcome(def, {
      score: 0.2,
      summary: "A sitemap exists but it isn't a valid XML sitemap.",
      issues: [{ key: "seo.sitemap:invalid", affectedUrls: [s.url] }],
    });
  }
  if (parsed.locs.length === 0) {
    return outcome(def, {
      score: 0.3,
      summary: "A sitemap exists but it doesn't list any pages.",
      issues: [{ key: "seo.sitemap:empty", affectedUrls: [s.url] }],
    });
  }
  return outcome(def, {
    score: 1,
    summary:
      parsed.kind === "sitemapindex"
        ? `Sitemap index found with ${plural(parsed.locs.length, "child sitemap")}.`
        : `Sitemap found listing ${plural(parsed.locs.length, "URL")}.`,
    issues: [],
  });
};
