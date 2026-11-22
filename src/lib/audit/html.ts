/**
 * HTML parsing helpers (pure). Everything checks need from a page is derived here
 * once so the checks stay small and fixture-testable.
 */
import { load, type CheerioAPI } from "cheerio";

export type JsonLdNode = Record<string, unknown>;

export interface JsonLdBlock {
  /** false when the script body is not valid JSON */
  valid: boolean;
  /** every object with an @type found anywhere inside the block (incl. @graph / nested) */
  nodes: JsonLdNode[];
}

export interface PageData {
  /** final URL after redirects */
  url: string;
  requestedUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  isHome: boolean;
  $: CheerioAPI;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  /** heading levels in document order, e.g. [1, 2, 2, 3] */
  headingLevels: number[];
  headings: { level: number; text: string }[];
  wordCount: number;
  jsonLd: JsonLdBlock[];
  /** links (absolute, hash stripped) with a flag for nav/header placement */
  links: { href: string; inNav: boolean }[];
}

const WS = /\s+/g;

export function cleanText(s: string | undefined | null): string {
  return (s ?? "").replace(WS, " ").trim();
}

export function countWords(s: string): number {
  const t = cleanText(s);
  if (!t) return 0;
  return t.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function metaContent($: CheerioAPI, key: string): string | null {
  const lower = key.toLowerCase();
  let found: string | null = null;
  $("meta").each((_, el) => {
    if (found !== null) return;
    const $el = $(el);
    const name = ($el.attr("name") ?? $el.attr("property") ?? $el.attr("itemprop") ?? "").toLowerCase().trim();
    if (name === lower) {
      const c = $el.attr("content");
      if (c !== undefined) found = cleanText(c);
    }
  });
  return found;
}

export function getTitle($: CheerioAPI): string | null {
  const el = $("title")
    .filter((_, e) => $(e).parents("svg").length === 0)
    .first();
  if (el.length === 0) return null;
  const t = cleanText(el.text());
  return t.length > 0 ? t : null;
}

/** Types of a JSON-LD node, without any schema.org prefix. */
export function nodeTypes(node: JsonLdNode): string[] {
  const t = node["@type"];
  const list = Array.isArray(t) ? t : [t];
  return list
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.replace(/^https?:\/\/schema\.org\//i, "").replace(/^schema:/i, "").trim())
    .filter(Boolean);
}

function collectNodes(value: unknown, out: JsonLdNode[], depth = 0): void {
  if (depth > 12 || value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const v of value) collectNodes(v, out, depth + 1);
    return;
  }
  const obj = value as JsonLdNode;
  if (obj["@type"] !== undefined) out.push(obj);
  for (const [k, v] of Object.entries(obj)) {
    if (k === "@context") continue;
    if (v && typeof v === "object") collectNodes(v, out, depth + 1);
  }
}

export function parseJsonLd($: CheerioAPI): JsonLdBlock[] {
  const blocks: JsonLdBlock[] = [];
  $('script[type="application/ld+json" i]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw) {
      blocks.push({ valid: false, nodes: [] });
      return;
    }
    try {
      // Some CMSs wrap JSON-LD in HTML comments / CDATA.
      const cleaned = raw
        .replace(/^\s*<!--/, "")
        .replace(/-->\s*$/, "")
        .replace(/^\s*\/\/\s*<!\[CDATA\[/, "")
        .replace(/\/\/\s*\]\]>\s*$/, "");
      const parsed: unknown = JSON.parse(cleaned);
      const nodes: JsonLdNode[] = [];
      collectNodes(parsed, nodes);
      blocks.push({ valid: true, nodes });
    } catch {
      blocks.push({ valid: false, nodes: [] });
    }
  });
  return blocks;
}

export function allJsonLdNodes(pages: PageData[]): { node: JsonLdNode; url: string }[] {
  const out: { node: JsonLdNode; url: string }[] = [];
  for (const p of pages) for (const b of p.jsonLd) for (const n of b.nodes) out.push({ node: n, url: p.url });
  return out;
}

export function visibleText($: CheerioAPI): string {
  const body = $("body").clone();
  body.find("script, style, noscript, template, svg, iframe").remove();
  return cleanText(body.text());
}

/** Resolve an href against the page URL (respecting <base href>); null for non-http(s). */
export function resolveHref(href: string | undefined, pageUrl: string, baseHref?: string): string | null {
  if (!href) return null;
  const h = href.trim();
  if (!h || h.startsWith("#") || /^(mailto|tel|javascript|data|sms|fax|ftp|file):/i.test(h)) return null;
  try {
    const base = baseHref ? new URL(baseHref, pageUrl) : new URL(pageUrl);
    const u = new URL(h, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

export function parsePage(input: {
  url: string;
  requestedUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  html: string;
  isHome: boolean;
}): PageData {
  const $ = load(input.html);
  const headings: { level: number; text: string }[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = (el as { tagName?: string }).tagName ?? "";
    const level = Number(tag.slice(1));
    if (level >= 1 && level <= 6) headings.push({ level, text: cleanText($(el).text()) });
  });

  const baseHref = $("base[href]").first().attr("href");
  const links: { href: string; inNav: boolean }[] = [];
  $("a[href]").each((_, el) => {
    const $el = $(el);
    const href = resolveHref($el.attr("href"), input.url, baseHref);
    if (!href) return;
    const inNav = $el.parents("nav, header, [role=navigation]").length > 0;
    links.push({ href, inNav });
  });

  const desc = metaContent($, "description");
  return {
    ...input,
    $,
    title: getTitle($),
    metaDescription: desc && desc.length > 0 ? desc : null,
    h1Count: headings.filter((h) => h.level === 1).length,
    headingLevels: headings.map((h) => h.level),
    headings,
    wordCount: countWords(visibleText($)),
    jsonLd: parseJsonLd($),
    links,
  };
}
