import { load } from "cheerio";
import { outcome, plural, type Check } from "../../context";

const def = { id: "seo.sitemap", category: "seo", label: "XML sitemap" } as const;

export interface ParsedSitemap {
  kind: "urlset" | "sitemapindex" | "invalid";
  /** page URLs (urlset) or child sitemap URLs (sitemapindex) */
  locs: string[];
}

export function parseSitemap(xml: string): ParsedSitemap {
  const head = xml.slice(0, 4096).toLowerCase();
  const isUrlset = /<(\w+:)?urlset[\s>]/.test(head) || /<(\w+:)?urlset[\s>]/i.test(xml);
  const isIndex = !isUrlset && /<(\w+:)?sitemapindex[\s>]/i.test(xml);
  if (!isUrlset && !isIndex) return { kind: "invalid", locs: [] };
  let locs: string[] = [];
  try {
    const $ = load(xml, { xml: true });
    $("loc").each((_, el) => {
      const t = $(el).text().trim();
      if (/^https?:\/\//i.test(t)) locs.push(t);
    });
  } catch {
    locs = [];
  }
  if (locs.length === 0) {
    // Fallback for namespaced/odd XML that the XML parser didn't expose as <loc>.
    for (const m of xml.matchAll(/<(?:\w+:)?loc>\s*(?:<!\[CDATA\[)?\s*(https?:\/\/[^<\]\s]+)/gi)) locs.push(m[1]);
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
