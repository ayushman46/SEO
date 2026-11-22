import { outcome, plural, type AuditContext, type Check, type IssueSeed } from "../../context";
import { allJsonLdNodes, nodeTypes, type PageData } from "../../html";
import { emailsInText, phonesInText, PRICE_RE, scanPage, STREET_RE, timeRangesInText, type PageScan } from "./page-scan";

const def = { id: "geo.raw-html-facts", category: "geo", label: "Facts readable without JavaScript" } as const;

export type FactPresence = "in page text" | "in JSON-LD only" | "not found in raw HTML";
export const RAW_FACTS = ["phone", "email", "address", "hours", "price"] as const;
export type RawFact = (typeof RAW_FACTS)[number];

const MIN_WORDS = 80;
const ENABLE_JS = /(enable|turn on|activate)\s+javascript|javascript\s+(is\s+)?(required|disabled|needed)|requires?\s+javascript/i;

export interface ShellSignals {
  words: number;
  emptyRoot: boolean;
  noscriptAsksForJs: boolean;
  scriptHeavy: boolean;
}

/** Heuristic SPA-shell detection on the raw HTML we fetched (no JavaScript is run). */
export function shellSignals(p: PageData, s: PageScan): ShellSignals {
  const words = p.wordCount;
  const textChars = Math.max(1, s.visibleText.length);
  // External scripts count as ~5 KB each; a shell ships lots of code and almost no text.
  const scriptChars = s.scripts.inlineChars + 5_000 * s.scripts.external;
  return {
    words,
    emptyRoot: s.emptyRoot,
    noscriptAsksForJs: ENABLE_JS.test(s.noscriptText),
    scriptHeavy: scriptChars / textChars > 50 && s.scripts.external + (s.scripts.inlineChars > 0 ? 1 : 0) >= 2,
  };
}

export function isShell(sig: ShellSignals): boolean {
  if (sig.words >= MIN_WORDS) return false;
  if (sig.words < 20 && (sig.emptyRoot || sig.noscriptAsksForJs || sig.scriptHeavy)) return true;
  return [sig.emptyRoot, sig.noscriptAsksForJs, sig.scriptHeavy].filter(Boolean).length >= 2;
}

function schemaHas(ctx: AuditContext): Record<RawFact, boolean> {
  const out: Record<RawFact, boolean> = { phone: false, email: false, address: false, hours: false, price: false };
  for (const { node } of allJsonLdNodes(ctx.pages)) {
    const types = nodeTypes(node);
    if (node.telephone) out.phone = true;
    if (node.email) out.email = true;
    if (node.address || types.includes("PostalAddress")) out.address = true;
    if (node.openingHours || node.openingHoursSpecification || types.includes("OpeningHoursSpecification")) out.hours = true;
    if (node.priceRange || node.price !== undefined || node.lowPrice !== undefined || types.includes("Offer")) out.price = true;
  }
  return out;
}

const DAY_HOURS = /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\b[^.\n]{0,40}?\d{1,2}(?::\d{2})?\s?(am|pm)?/i;

function textHas(ctx: AuditContext): Record<RawFact, boolean> {
  const out: Record<RawFact, boolean> = { phone: false, email: false, address: false, hours: false, price: false };
  for (const p of ctx.pages) {
    const s = scanPage(p);
    const t = s.visibleText;
    out.phone ||= s.telLinks.length > 0 || phonesInText(t).length > 0;
    out.email ||= s.mailLinks.length > 0 || emailsInText(t).length > 0;
    STREET_RE.lastIndex = 0;
    out.address ||= s.addressTexts.some(Boolean) || STREET_RE.test(t);
    STREET_RE.lastIndex = 0;
    out.hours ||= timeRangesInText(t).length > 0 || DAY_HOURS.test(t);
    PRICE_RE.lastIndex = 0;
    out.price ||= PRICE_RE.test(t);
    PRICE_RE.lastIndex = 0;
  }
  return out;
}

export function factPresence(ctx: AuditContext): Record<RawFact, FactPresence> {
  const text = textHas(ctx);
  const schema = schemaHas(ctx);
  const out = {} as Record<RawFact, FactPresence>;
  for (const f of RAW_FACTS) out[f] = text[f] ? "in page text" : schema[f] ? "in JSON-LD only" : "not found in raw HTML";
  return out;
}

/**
 * geo.raw-html-facts: can a fetcher that doesn't run JavaScript (most AI crawlers) read the
 * page and its core facts? Honest limit: we don't run JavaScript; Google does render pages,
 * many AI crawlers don't.
 */
export const rawHtmlFactsCheck: Check = (ctx) => {
  const shellPages: string[] = [];
  for (const p of ctx.pages) if (isShell(shellSignals(p, scanPage(p)))) shellPages.push(p.url);
  const presence = factPresence(ctx);
  const jsonLdOnly = RAW_FACTS.filter((f) => presence[f] === "in JSON-LD only");
  const contactMissing = presence.phone === "not found in raw HTML" && presence.email === "not found in raw HTML";
  const factLine = RAW_FACTS.map((f) => `${f}: ${presence[f]}`).join("; ");

  const issues: IssueSeed[] = [];
  let score = 1;
  const homeShell = ctx.pages[0] && shellPages.includes(ctx.pages[0].url);
  if (shellPages.length) {
    score -= homeShell ? 0.7 : 0.4;
    issues.push({
      key: "geo.raw-html-facts:js-shell",
      affectedUrls: shellPages,
      severity: homeShell ? "high" : "medium",
      share: 4,
    });
  }
  if (jsonLdOnly.length) {
    score -= Math.min(0.3, 0.1 * jsonLdOnly.length);
    issues.push({
      key: "geo.raw-html-facts:jsonld-only",
      detail: `Only in JSON-LD: ${jsonLdOnly.join(", ")}.`,
      share: 2,
    });
  }
  if (contactMissing && !shellPages.length) {
    score -= 0.2;
    issues.push({ key: "geo.raw-html-facts:no-contact", share: 1 });
  }

  const summary = shellPages.length
    ? `${homeShell ? "Your homepage" : plural(shellPages.length, "page")} looks like a JavaScript app shell with little text before scripts run. Facts in the raw HTML: ${factLine}.`
    : `Pages have readable text without JavaScript. Facts in the raw HTML: ${factLine}.`;
  return outcome(def, { score: Math.max(0, score), summary, issues });
};
