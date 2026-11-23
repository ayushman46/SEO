/**
 * One bounded, iterative pass per page collecting what the T016 checks need (content format,
 * fact consistency, raw-HTML facts). Cached per document. Every collection is capped so a
 * hostile page stays linear.
 */
import type { CheerioAPI } from "cheerio";
import { cleanText, countWords, domRoot, isElement, SKIP, textOf, visibleText, walk, type DomNode, type PageData } from "../../html";

export const MAX_COLLECTED = 50;
const MAX_KEY_SECTIONS = 10;
const MAX_SECTION_SIBLINGS = 20;

/** Headings that usually introduce menu / price / hours content. */
export const KEY_SECTION =
  /\b(menus?|food|drinks|prices?|pricing|price ?list|rates|tariffs?|fees|opening hours|opening times|hours|timetables?|schedule|services)\b/i;
/** PDF link text or file name that suggests key facts live only in the PDF. */
export const KEY_PDF =
  /(menu|price|pricing|rates|tariff|fees|brochure|catalog|catalogue|timetable|schedule|hours|opening)/i;

export const STRUCK_CLASS = /(^|[\s_-])(was|old-?price|price-?old|was-?price|strike|strikethrough|line-?through|crossed|regular-?price)([\s_-]|$)/i;

export interface KeySection {
  heading: string;
  words: number;
  images: number;
  /** images with empty or very short (< 5 chars) alt text */
  weakAlts: number;
}

export interface PageScan {
  visibleText: string;
  pdfLinks: { href: string; text: string }[];
  keySections: KeySection[];
  struck: string[];
  hidden: string[];
  footerText: string;
  addressTexts: string[];
  telLinks: string[];
  mailLinks: string[];
  noscriptText: string;
  /** an SPA mount point (#root, #app, #__next, ...) with no content */
  emptyRoot: boolean;
  scripts: { inlineChars: number; external: number };
  /** text inside elements marked data-nosnippet (outermost only, capped) */
  nosnippetTexts: string[];
  /** words inside data-nosnippet elements */
  nosnippetWords: number;
  /** testimonial / review quote blocks (outermost only) and whether each names its source */
  testimonials: { text: string; attributed: boolean }[];
}

export const TESTIMONIAL_CLASS = /(^|[\s_-])(testimonials?|customer-reviews?|review-(item|card|text|body|content)|reviews?-(list|slider|carousel)|quote-(card|block))([\s_-]|$)/i;
export const ATTRIBUTION_TAIL = /(?:[—–-]|~)\s{0,3}[A-Z][\p{L}'.-]{1,40}(?:\s{1,3}[A-Z][\p{L}'.-]{0,40}){0,3}\s{0,3}(?:,[^,]{1,60})?$/u;

function hasAttribution(n: DomNode, text: string): boolean {
  let found = false;
  let visited = 0;
  // HTML-standard quote markup puts the attribution next to the quote, not inside it:
  // <figure><blockquote>..</blockquote><figcaption>Jane Doe</figcaption></figure> (R7 #14).
  const root = n.parent && isElement(n.parent) && n.parent.name === "figure" ? n.parent : n;
  walk([root], null, (x) => {
    if (found || ++visited > 1_000) return SKIP;
    if (!isElement(x)) return SKIP;
    const a = x.attribs;
    if (x.name === "cite" || x.name === "figcaption" || a.itemprop === "author" || /(^|[\s_-])(author|name|reviewer|client|cite|source)([\s_-]|$)/i.test(a.class ?? "")) {
      if (cleanText(textOf(x, 120, 200)).length >= 2) found = true;
    }
    return null;
  });
  return found || ATTRIBUTION_TAIL.test(text.slice(-120));
}

const CACHE = new WeakMap<CheerioAPI, PageScan>();

interface Flags {
  hidden: boolean;
  struck: boolean;
  footer: boolean;
  nosnippet: boolean;
  testimonial: boolean;
}

function isHiddenEl(a: Record<string, string>): boolean {
  if (a.hidden !== undefined) return true;
  if ((a["aria-hidden"] ?? "").toLowerCase() === "true") return true;
  const style = (a.style ?? "").toLowerCase().replace(/\s+/g, "");
  return style.includes("display:none") || style.includes("visibility:hidden");
}

function isStruckEl(name: string, a: Record<string, string>): boolean {
  if (name === "del" || name === "s" || name === "strike") return true;
  const style = (a.style ?? "").toLowerCase().replace(/\s+/g, "");
  if (style.includes("line-through")) return true;
  return STRUCK_CLASS.test(a.class ?? "");
}

const SPA_ROOT_IDS = new Set(["root", "app", "__next", "__nuxt", "svelte", "main-app", "react-root"]);

function hasContent(n: DomNode): boolean {
  return cleanText(textOf(n, 200, 500)).length > 0 || (n.children ?? []).some((c) => isElement(c) && c.name !== "script");
}

function headingLevel(n: DomNode): number {
  if (!isElement(n) || n.name.length !== 2 || n.name[0] !== "h") return 0;
  const l = Number(n.name[1]);
  return l >= 1 && l <= 6 ? l : 0;
}

/** Following element siblings belonging to this heading's section (until a same-or-higher heading). */
function sectionSiblings(h: DomNode, level: number): DomNode[] {
  let anchor: DomNode = h;
  for (let climb = 0; climb < 3; climb++) {
    const out: DomNode[] = [];
    let n = anchor.next ?? null;
    while (n && out.length < MAX_SECTION_SIBLINGS) {
      if (isElement(n)) {
        const l = headingLevel(n);
        if (l && l <= level) break;
        out.push(n);
      }
      n = n.next ?? null;
    }
    if (out.length > 0) return out;
    const parent = anchor.parent;
    if (!parent || !isElement(parent) || parent.name === "body" || parent.name === "main") return [];
    anchor = parent;
  }
  return [];
}

function analyseSection(h: DomNode, level: number): KeySection {
  const sibs = sectionSiblings(h, level);
  let words = 0;
  let images = 0;
  let weakAlts = 0;
  for (const s of sibs) {
    words += countWords(textOf(s, 3_000, 2_000));
    let visited = 0;
    walk([s], null, (n) => {
      if (++visited > 1_000) return SKIP;
      if (isElement(n) && n.name === "img") {
        images++;
        if ((n.attribs.alt ?? "").trim().length < 5) weakAlts++;
      }
      return null;
    });
  }
  return { heading: cleanText(textOf(h, 200, 200)), words, images, weakAlts };
}

export function scanPage(p: PageData): PageScan {
  const cached = CACHE.get(p.$);
  if (cached) return cached;
  const scan: PageScan = {
    visibleText: visibleText(p.$),
    pdfLinks: [],
    keySections: [],
    struck: [],
    hidden: [],
    footerText: "",
    addressTexts: [],
    telLinks: [],
    mailLinks: [],
    noscriptText: "",
    emptyRoot: false,
    scripts: { inlineChars: 0, external: 0 },
    nosnippetTexts: [],
    nosnippetWords: 0,
    testimonials: [],
  };
  const keyHeadings: { node: DomNode; level: number }[] = [];
  let footers = 0;

  walk<Flags>(domRoot(p.$).children ?? [], { hidden: false, struck: false, footer: false, nosnippet: false, testimonial: false }, (n, f) => {
    if (!isElement(n)) return SKIP;
    const a = n.attribs;
    const name = n.name;
    const next: Flags = { ...f };

    if (name === "script") {
      if (a.src) scan.scripts.external++;
      else if ((a.type ?? "").toLowerCase() !== "application/ld+json") {
        scan.scripts.inlineChars += textOf(n, 500_000, 5).length;
      }
      return SKIP;
    }
    if (name === "style" || name === "template") return SKIP;
    if (name === "noscript") {
      if (scan.noscriptText.length < 2_000) scan.noscriptText += ` ${textOf(n, 1_000, 200)}`;
      return SKIP;
    }
    if (name === "a" && a.href !== undefined) {
      const href = a.href.trim();
      if (/^tel:/i.test(href) && scan.telLinks.length < MAX_COLLECTED) scan.telLinks.push(href.slice(4, 64));
      else if (/^mailto:/i.test(href) && scan.mailLinks.length < MAX_COLLECTED) scan.mailLinks.push(href.slice(7).split("?")[0].slice(0, 254));
      else if (scan.pdfLinks.length < MAX_COLLECTED) {
        const path = href.split(/[?#]/)[0];
        if (/\.pdf$/i.test(path)) {
          const text = cleanText(textOf(n, 200, 200));
          const file = decodeSafe(path.split("/").pop() ?? "");
          if (KEY_PDF.test(text) || KEY_PDF.test(file)) scan.pdfLinks.push({ href: href.slice(0, 500), text });
        }
      }
    }
    if (!f.hidden && isHiddenEl(a)) {
      next.hidden = true;
      if (scan.hidden.length < MAX_COLLECTED) {
        const t = cleanText(textOf(n, 300, 1_000));
        if (t) scan.hidden.push(t);
      }
    }
    if (!f.struck && isStruckEl(name, a)) {
      next.struck = true;
      if (scan.struck.length < MAX_COLLECTED) {
        const t = cleanText(textOf(n, 300, 1_000));
        if (t) scan.struck.push(t);
      }
    }
    if (!f.footer && (name === "footer" || a.role === "contentinfo")) {
      next.footer = true;
      if (footers++ < 2) scan.footerText += ` ${cleanText(textOf(n, 3_000, 5_000))}`;
    }
    if (!f.nosnippet && a["data-nosnippet"] !== undefined) {
      next.nosnippet = true;
      const t = cleanText(textOf(n, 5_000, 5_000));
      scan.nosnippetWords += countWords(t);
      if (scan.nosnippetTexts.length < MAX_COLLECTED && t) scan.nosnippetTexts.push(t.slice(0, 2_000));
    }
    if (!f.testimonial && (name === "blockquote" || TESTIMONIAL_CLASS.test(`${a.class ?? ""} ${a.id ?? ""}`) || a.itemtype?.endsWith("/Review"))) {
      next.testimonial = true;
      if (scan.testimonials.length < 30) {
        const t = cleanText(textOf(n, 1_500, 1_500));
        if (countWords(t) >= 5) scan.testimonials.push({ text: t.slice(0, 300), attributed: hasAttribution(n, t) });
      }
    }
    if (name === "address" && scan.addressTexts.length < 10) {
      scan.addressTexts.push(cleanText(textOf(n, 300, 500)));
    }
    if (name === "div" && a.id && SPA_ROOT_IDS.has(a.id) && !hasContent(n)) scan.emptyRoot = true;
    const level = headingLevel(n);
    if (level && level <= 4 && keyHeadings.length < MAX_KEY_SECTIONS * 3) {
      const t = cleanText(textOf(n, 200, 200));
      if (t && t.length <= 80 && KEY_SECTION.test(t)) keyHeadings.push({ node: n, level });
    }
    return next;
  });

  for (const { node, level } of keyHeadings.slice(0, MAX_KEY_SECTIONS)) scan.keySections.push(analyseSection(node, level));
  scan.footerText = scan.footerText.trim();
  CACHE.set(p.$, scan);
  return scan;
}

function decodeSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/* ── Shared fact patterns (deterministic) ── */

/** Integer part of a price: grouped ("1,299" / "1.299" / "1 299", ≤ 5 groups) or ≤ 9 plain digits. */
const PRICE_INT = String.raw`(?:\d{1,3}(?:[.,  ]\d{3}){1,5}|\d{1,9})`;
const PRICE_DEC = String.raw`(?:[.,]\d{1,2})?`;
/**
 * Currency amounts: £79, $1,299.00, 79 €, 1.299,50 €, 49 USD.
 * Every repetition is bounded and the suffix form can't start inside a number, so each start
 * position does constant work: linear on any input (R3 C1: the old unbounded group followed by
 * a required currency token was quadratic). `\b` follows only the letter codes (R3 M5).
 */
export const PRICE_RE = new RegExp(
  String.raw`(?:\p{Sc}\s?${PRICE_INT}${PRICE_DEC}(?!\d)|(?<![\d.,])${PRICE_INT}${PRICE_DEC}\s?(?:\p{Sc}|(?:USD|EUR|GBP|INR|AUD|CAD|CHF|JPY)\b))`,
  "gu",
);
/** Phone numbers written like phone numbers: a + prefix, parentheses, or 2+ separator groups. */
export const PHONE_RE = /(?<![\d+])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,5}\)[\s.-]?)?\d{2,5}(?:[\s.-]\d{2,5}){1,4}/g;
export const EMAIL_RE = /(?<![a-z0-9._%+-])[a-z0-9._%+-]{1,64}@[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63}){0,8}\.[a-z]{2,24}/gi;
/** 9-17, 9am-5pm, 09:00–17:30, 9.30am to 6pm */
export const TIME_RANGE_RE =
  /\b(\d{1,2})(?:[:.](\d{2}))?\s?(am|pm|a\.m\.|p\.m\.)?\s?(?:-|–|—|to|until|till)\s?(\d{1,2})(?:[:.](\d{2}))?\s?(am|pm|a\.m\.|p\.m\.)?/gi;
export const STREET_RE =
  /\b\d{1,5}[a-z]?\s{1,3}(?:[A-Z][\w'-]{0,30}\s{1,3}){0,4}(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|way|place|pl|court|ct|square|sq|terrace|crescent|close|parkway|highway|hwy)\b\.?/gi;

/** Digits of a plausible phone number (7–15 digits), else null. */
export function phoneDigits(s: string): string | null {
  const d = s.replace(/\D/g, "");
  if (d.length < 7 || d.length > 15) return null;
  if (/^(19|20)\d{2}(19|20)\d{2}$/.test(d)) return null; // "2019-2024"
  return d;
}

/** Comparable key: last 9 digits, so "+44 113 496 0000" and "0113 496 0000" match. */
export function phoneKey(d: string): string {
  return d.slice(-9);
}

export function phonesInText(s: string): string[] {
  const out: string[] = [];
  for (const m of s.matchAll(PHONE_RE)) {
    const raw = m[0];
    // Must look like a phone: + prefix, parentheses, or at least two separators.
    const seps = (raw.match(/[\s.-]/g) ?? []).length;
    if (!raw.startsWith("+") && !raw.includes("(") && seps < 2) continue;
    if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(raw.trim())) continue; // dates
    const d = phoneDigits(raw);
    if (d) out.push(d);
    if (out.length >= MAX_COLLECTED) break;
  }
  return out;
}

export function emailsInText(s: string): string[] {
  return [...new Set((s.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase()))].slice(0, MAX_COLLECTED);
}

/** Numeric value of a price string ("£1,299.50" → 1299.5). */
export function priceValue(s: string): number | null {
  const m = s.match(/\d[\d.,\s]*/);
  if (!m) return null;
  let t = m[0].replace(/\s/g, "");
  // "1.299,50" (EU) vs "1,299.50": the last separator followed by 1-2 digits is the decimal mark.
  const dec = t.match(/[.,](\d{1,2})$/);
  if (dec) {
    const intPart = t.slice(0, -dec[0].length).replace(/[.,]/g, "");
    t = `${intPart}.${dec[1]}`;
  } else t = t.replace(/[.,]/g, "");
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

export function pricesInText(s: string): number[] {
  const out: number[] = [];
  for (const m of s.matchAll(PRICE_RE)) {
    const v = priceValue(m[0]);
    if (v !== null) out.push(v);
    if (out.length >= 200) break;
  }
  return out;
}

/** Normalise a time range to "HH:MM-HH:MM" (24 h), or null. */
export function normTimeRange(m: RegExpMatchArray): string | null {
  const to24 = (h: string, min: string | undefined, ap: string | undefined, other?: string) => {
    let hh = Number(h);
    const mm = Number(min ?? "0");
    if (hh > 24 || mm > 59) return null;
    const mer = (ap ?? other ?? "").toLowerCase().replace(/\./g, "");
    if (mer === "pm" && hh < 12) hh += 12;
    if (mer === "am" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  // Need some time-ness: a meridiem or minutes, otherwise "3-5 days" would match.
  if (!m[2] && !m[3] && !m[5] && !m[6]) return null;
  const a = to24(m[1], m[2], m[3], undefined);
  const b = to24(m[4], m[5], m[6], undefined);
  return a && b ? `${a}-${b}` : null;
}

export function timeRangesInText(s: string): string[] {
  const out = new Set<string>();
  for (const m of s.matchAll(TIME_RANGE_RE)) {
    const r = normTimeRange(m);
    if (r) out.add(r);
    if (out.size >= MAX_COLLECTED) break;
  }
  return [...out];
}
