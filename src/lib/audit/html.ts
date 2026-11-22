/**
 * HTML parsing helpers (pure). Everything checks need from a page is derived here
 * once so the checks stay small and fixture-testable.
 */
import { load, type CheerioAPI } from "cheerio";
import { AuditError } from "./types";

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

/** Scripts written without spaces between words (CJK, Thai, ...): segment these with ICU. */
const NO_SPACE_SCRIPT =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const WORD_SEG = new Intl.Segmenter(undefined, { granularity: "word" });

export function countWords(s: string): number {
  const t = cleanText(s);
  if (!t) return 0;
  let n = 0;
  for (const w of t.split(" ")) {
    if (!LETTER_OR_DIGIT.test(w)) continue;
    if (NO_SPACE_SCRIPT.test(w)) {
      for (const seg of WORD_SEG.segment(w)) if (seg.isWordLike) n++;
    } else n++;
  }
  return n;
}

/** key (lower-cased name or property) -> content of the first matching <meta>, per document. */
const META_CACHE = new WeakMap<CheerioAPI, Map<string, string[]>>();

function metaIndex($: CheerioAPI): Map<string, string[]> {
  let index = META_CACHE.get($);
  if (index) return index;
  const built = new Map<string, string[]>();
  // One linear walk per document instead of a full-tree selector per lookup.
  walk(domRoot($).children ?? [], null, (n) => {
    if (!isElement(n)) return SKIP;
    if (n.name === "meta" && n.attribs.content !== undefined) {
      // name and property are separate keys; itemprop is microdata, not a meta tag key.
      for (const attr of ["name", "property"]) {
        const k = (n.attribs[attr] ?? "").toLowerCase().trim();
        if (!k) continue;
        const list = built.get(k);
        if (list) list.push(cleanText(n.attribs.content));
        else built.set(k, [cleanText(n.attribs.content)]);
      }
    }
    return null;
  });
  index = built;
  META_CACHE.set($, index);
  return index;
}

export function metaContent($: CheerioAPI, key: string): string | null {
  return metaIndex($).get(key.toLowerCase())?.[0] ?? null;
}

/** Content of every <meta> whose name or property is `key`, in document order. */
export function metaContents($: CheerioAPI, key: string): string[] {
  return metaIndex($).get(key.toLowerCase()) ?? [];
}

/**
 * Minimal structural view of the parsed DOM (domhandler nodes as produced by cheerio).
 * Walking the tree ourselves keeps every pass iterative (no stack overflow on deep
 * nesting) and linear (no per-element ancestor scans or detached clones).
 */
export interface DomNode {
  type: string;
  name?: string;
  data?: string;
  attribs?: Record<string, string>;
  children?: DomNode[];
  parent?: DomNode | null;
  prev?: DomNode | null;
  next?: DomNode | null;
}

/**
 * Hard limits on hostile pages: synchronous analysis must stay bounded. Lighthouse already
 * flags pages over 1,400 elements; Chrome's parser stops nesting at depth 512.
 */
export const MAX_ELEMENTS = 50_000;
/** Nesting depth estimated from tags before parsing (parse5 is quadratic in depth). */
export const MAX_DEPTH = 1_000;
/**
 * Real DOM depth after parsing. Looser than MAX_DEPTH because the parser adds implicit
 * elements (a nested <table><tr><td> becomes table > tbody > tr > td).
 */
export const MAX_DOM_DEPTH = 4_000;

export function isElement(n: DomNode): n is DomNode & { name: string; attribs: Record<string, string>; children: DomNode[] } {
  return n.type === "tag" || n.type === "script" || n.type === "style";
}

export function domRoot($: CheerioAPI): DomNode {
  return $.root().get(0) as unknown as DomNode;
}

/**
 * Iterative pre-order walk in document order. `visit` returns the flags passed to the
 * node's children, or SKIP to skip its subtree.
 */
export const SKIP: unique symbol = Symbol("skip-subtree");

export function walk<F>(start: DomNode[], flags: F, visit: (n: DomNode, flags: F) => F | typeof SKIP): void {
  const stack: [DomNode, F][] = [];
  for (let i = start.length - 1; i >= 0; i--) stack.push([start[i], flags]);
  while (stack.length) {
    const [n, f] = stack.pop()!;
    const r = visit(n, f);
    if (r === SKIP || !n.children) continue;
    for (let i = n.children.length - 1; i >= 0; i--) stack.push([n.children[i], r]);
  }
}

/** Text content of a node (like cheerio .text()), iterative and capped in chars and nodes visited. */
export function textOf(node: DomNode, maxChars = 100_000, maxNodes = 20_000): string {
  const out: string[] = [];
  let len = 0;
  let visited = 0;
  const stack: DomNode[] = [node];
  while (stack.length && len < maxChars && visited < maxNodes) {
    const n = stack.pop()!;
    visited++;
    if (n.type === "text" || n.type === "cdata") {
      if (n.data) {
        out.push(n.data);
        len += n.data.length;
      }
    }
    if (n.children) for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]);
  }
  const s = out.join("");
  return s.length > maxChars ? s.slice(0, maxChars) : s;
}

/** First descendant element named `tag` (document order), searching at most `maxNodes` nodes. */
export function firstDescendant(node: DomNode, tag: string, maxNodes = 500): DomNode | null {
  const stack: DomNode[] = [...(node.children ?? [])].reverse();
  let visited = 0;
  while (stack.length && visited++ < maxNodes) {
    const n = stack.pop()!;
    if (isElement(n) && n.name === tag) return n;
    if (n.children) for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]);
  }
  return null;
}

/** Element counts and nesting depth, for the hostile-page guard. */
export function domStats(root: DomNode): { elements: number; depth: number } {
  let elements = 0;
  let depth = 0;
  walk(root.children ?? [], 1, (n, d) => {
    if (!isElement(n)) return SKIP;
    elements++;
    if (d > depth) depth = d;
    return d + 1;
  });
  return { elements, depth };
}

/** Elements whose content is raw text for the parser: tags inside them don't count. */
const RAW_TEXT = new Set(["script", "style", "textarea", "title", "xmp", "iframe", "noembed", "noframes", "noscript"]);
const RAW_TEXT_END = new Map([...RAW_TEXT].map((n) => [n, new RegExp(`</${n}[\\s/>]`, "gi")]));
/** Void or implicitly closed elements: they never deepen nesting, even without a close tag. */
const NON_NESTING = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr",
  "p", "li", "dt", "dd", "option", "optgroup", "tr", "td", "th", "thead", "tbody", "tfoot", "colgroup", "caption",
  "a", "h1", "h2", "h3", "h4", "h5", "h6", "html", "head", "body", "rb", "rt", "rp",
]);
const FOREIGN = new Set(["svg", "math"]);

function isAsciiLetter(x: number): boolean {
  return (x >= 65 && x <= 90) || (x >= 97 && x <= 122);
}

/**
 * Cheap tokenizer-level scan run BEFORE parsing. parse5 is itself O(tags x open-element
 * depth) (20k nested divs take ~9 s just to parse), so hostile pages are rejected here.
 * Counts tag openings (outside comments and raw-text elements) and estimates nesting depth
 * from open/close tags of elements that really nest (self-closing only counts inside SVG/MathML,
 * as in the HTML parser). Stops as soon as a limit is exceeded. Linear in the input.
 */
export function prescanHtml(html: string): { tooComplex: boolean; openings: number; depth: number } {
  let openings = 0;
  let depth = 0;
  let maxDepth = 0;
  let foreign = 0;
  let i = html.indexOf("<");
  while (i !== -1) {
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i + 4);
      if (end === -1) break;
      i = html.indexOf("<", end + 3);
      continue;
    }
    const closing = html.charCodeAt(i + 1) === 47; /* "/" */
    const start = closing ? i + 2 : i + 1;
    if (!isAsciiLetter(html.charCodeAt(start))) {
      i = html.indexOf("<", i + 1);
      continue;
    }
    let j = start + 1;
    while (j < html.length) {
      const x = html.charCodeAt(j);
      if (isAsciiLetter(x) || (x >= 48 && x <= 57) || x === 45 || x === 58) j++;
      else break;
    }
    const name = html.slice(start, j).toLowerCase();
    if (closing) {
      if (FOREIGN.has(name) && foreign > 0) foreign--;
      if (!NON_NESTING.has(name) && depth > 0) depth--;
      i = html.indexOf("<", j);
      continue;
    }
    if (++openings > MAX_ELEMENTS) return { tooComplex: true, openings, depth: maxDepth };
    const end = RAW_TEXT_END.get(name);
    if (end && foreign === 0) {
      // Skip to the matching close tag without counting anything inside.
      end.lastIndex = j;
      const m = end.exec(html);
      if (!m) break;
      i = html.indexOf("<", m.index + 2);
      continue;
    }
    const gt = html.indexOf(">", j);
    const selfClosing = gt > 0 && html.charCodeAt(gt - 1) === 47;
    if (!NON_NESTING.has(name) && !(selfClosing && (foreign > 0 || FOREIGN.has(name)))) {
      if (FOREIGN.has(name)) foreign++;
      if (++depth > maxDepth) {
        maxDepth = depth;
        if (maxDepth > MAX_DEPTH) return { tooComplex: true, openings, depth: maxDepth };
      }
    }
    i = html.indexOf("<", j);
  }
  return { tooComplex: false, openings, depth: maxDepth };
}

export function getTitle($: CheerioAPI): string | null {
  // First <title> that isn't an SVG <title> (single linear walk, no per-element ancestor scans).
  let found: DomNode | null = null;
  walk(domRoot($).children ?? [], false, (n, inSvg) => {
    if (found || !isElement(n)) return SKIP;
    if (n.name === "title" && !inSvg) {
      found = n;
      return SKIP;
    }
    return inSvg || n.name === "svg";
  });
  if (!found) return null;
  const t = cleanText(textOf(found));
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

const SKIP_TEXT = new Set(["script", "style", "noscript", "template", "svg", "iframe"]);

/** Visible body text: iterative, no clone, no selector engine (linear on any DOM). */
export function visibleText($: CheerioAPI): string {
  const body = $("body").get(0) as unknown as DomNode | undefined;
  if (!body) return "";
  const out: string[] = [];
  walk(body.children ?? [], null, (n) => {
    if (n.type === "text") {
      if (n.data) out.push(n.data);
      return SKIP;
    }
    if (isElement(n)) return SKIP_TEXT.has(n.name) || n.type !== "tag" ? SKIP : null;
    return SKIP;
  });
  return cleanText(out.join(""));
}

/** Resolve an href against the page URL (respecting <base href>); null for non-http(s). */
export function resolveHref(href: string | undefined, pageUrl: string, baseHref?: string): string | null {
  let base: URL;
  try {
    base = baseHref ? new URL(baseHref, pageUrl) : new URL(pageUrl);
  } catch {
    return null;
  }
  return resolveAgainst(href, base);
}

/** resolveHref with the base URL already parsed (hot loop over every link on a page). */
function resolveAgainst(href: string | undefined, base: URL): string | null {
  if (!href) return null;
  const h = href.trim();
  if (!h || h.startsWith("#") || /^(mailto|tel|javascript|data|sms|fax|ftp|file):/i.test(h)) return null;
  try {
    const u = new URL(h, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

const TOO_COMPLEX = "is too complex to check (more than 50,000 HTML elements or extremely deep nesting)";

export function parsePage(input: {
  url: string;
  requestedUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  html: string;
  isHome: boolean;
}): PageData {
  const who = input.isHome ? "Your homepage" : input.url;
  if (prescanHtml(input.html).tooComplex) {
    throw new AuditError("too_large", `${who} ${TOO_COMPLEX}.`);
  }
  const $ = load(input.html);
  const root = domRoot($);
  const stats = domStats(root);
  if (stats.elements > MAX_ELEMENTS || stats.depth > MAX_DOM_DEPTH) {
    throw new AuditError("too_large", `${who} ${TOO_COMPLEX}.`);
  }

  // One linear pass for headings + links (with nav/header placement).
  const baseHref = $("base[href]").first().attr("href");
  let linkBase: URL | null = null;
  try {
    linkBase = baseHref ? new URL(baseHref, input.url) : new URL(input.url);
  } catch {
    linkBase = null;
  }
  const headings: { level: number; text: string }[] = [];
  const links: { href: string; inNav: boolean }[] = [];
  walk(root.children ?? [], false, (n, inNav) => {
    if (!isElement(n)) return SKIP;
    const name = n.name;
    if (name.length === 2 && name[0] === "h") {
      const level = Number(name[1]);
      if (level >= 1 && level <= 6) headings.push({ level, text: cleanText(textOf(n, 2_000)) });
    } else if (name === "a" && n.attribs.href !== undefined) {
      const href = linkBase ? resolveAgainst(n.attribs.href, linkBase) : null;
      if (href) links.push({ href, inNav });
    }
    return inNav || name === "nav" || name === "header" || n.attribs.role === "navigation";
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
