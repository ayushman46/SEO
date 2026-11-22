import { outcome, type AuditContext, type Check, type IssueSeed } from "../../context";
import { allJsonLdNodes, cleanText, nodeTypes, type JsonLdNode } from "../../html";
import {
  phoneDigits,
  phoneKey,
  phonesInText,
  PRICE_RE,
  pricesInText,
  scanPage,
  STREET_RE,
  TIME_RANGE_RE,
  timeRangesInText,
} from "./page-scan";

const def = { id: "geo.fact-consistency", category: "geo", label: "Consistent prices & contact details" } as const;

const PENALTY = {
  "geo.fact-consistency:struck-price": 0.35,
  "geo.fact-consistency:schema-price": 0.3,
  "geo.fact-consistency:phones": 0.25,
  "geo.fact-consistency:addresses": 0.25,
  "geo.fact-consistency:hours": 0.25,
  "geo.fact-consistency:hidden-facts": 0.15,
  "geo.fact-consistency:emails": 0.1,
  "geo.fact-consistency:stale-year": 0.1,
} as const;
type Key = keyof typeof PENALTY;

function strings(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (typeof v === "number") return [String(v)];
  if (Array.isArray(v)) return v.flatMap((x) => (typeof x === "string" || typeof x === "number" ? [String(x)] : []));
  return [];
}

export function normStreet(s: string): string {
  return cleanText(s)
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\bst\b/g, "street")
    .replace(/\brd\b/g, "road")
    .replace(/\bave\b/g, "avenue")
    .replace(/\bln\b/g, "lane")
    .replace(/\bdr\b/g, "drive")
    .replace(/\bblvd\b/g, "boulevard")
    .replace(/\s+/g, " ")
    .trim();
}

/** Footer copyright year (the later year of a range), or null. */
export function copyrightYear(text: string): number | null {
  let best: number | null = null;
  for (const m of text.matchAll(/(?:©|\(c\)|copyright)\s*(?:(?:19|20)\d{2}\s*[-–—]\s*)?((?:19|20)\d{2})/gi)) {
    const y = Number(m[1]);
    if (best === null || y > best) best = y;
  }
  return best;
}

/** Is the copyright year stale? In January last year's notice is still normal. */
export function isStaleYear(year: number, now: Date): boolean {
  const current = now.getUTCFullYear();
  const cutoff = now.getUTCMonth() === 0 ? current - 1 : current;
  return year < cutoff;
}

function schemaHours(node: JsonLdNode): string[] {
  const out: string[] = [];
  for (const s of strings(node.openingHours)) {
    for (const m of s.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)) {
      out.push(`${m[1].padStart(2, "0")}:${m[2]}-${m[3].padStart(2, "0")}:${m[4]}`);
    }
  }
  if (nodeTypes(node).includes("OpeningHoursSpecification")) {
    const o = strings(node.opens)[0];
    const c = strings(node.closes)[0];
    const fmt = (t: string) => {
      const m = t.match(/^(\d{1,2}):(\d{2})/);
      return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
    };
    const a = o ? fmt(o) : null;
    const b = c ? fmt(c) : null;
    if (a && b) out.push(`${a}-${b}`);
  }
  return out;
}

export interface FactInventory {
  phones: Map<string, string>; // key → display digits
  emails: Set<string>;
  streets: Set<string>;
  schemaHours: Set<string>;
  textHours: Set<string>;
  schemaPrices: { value: number; url: string }[];
  visiblePrices: Set<number>;
}

export function factInventory(ctx: AuditContext): FactInventory {
  const inv: FactInventory = {
    phones: new Map(),
    emails: new Set(),
    streets: new Set(),
    schemaHours: new Set(),
    textHours: new Set(),
    schemaPrices: [],
    visiblePrices: new Set(),
  };
  const addPhone = (raw: string) => {
    const d = phoneDigits(raw);
    if (d && inv.phones.size < 20) inv.phones.set(phoneKey(d), d);
  };
  for (const { node, url } of allJsonLdNodes(ctx.pages)) {
    for (const t of strings(node.telephone)) addPhone(t);
    for (const e of strings(node.email)) inv.emails.add(e.replace(/^mailto:/i, "").trim().toLowerCase());
    if (nodeTypes(node).includes("PostalAddress")) {
      for (const s of strings(node.streetAddress)) if (s.trim()) inv.streets.add(normStreet(s));
    } else if (typeof node.address === "string" && node.address.trim()) {
      const m = node.address.match(STREET_RE);
      if (m) inv.streets.add(normStreet(m[0]));
    }
    for (const h of schemaHours(node)) inv.schemaHours.add(h);
    if (nodeTypes(node).some((t) => t === "Offer" || t === "AggregateOffer")) {
      for (const k of ["price", "lowPrice"] as const) {
        const v = Number(strings(node[k])[0]?.replace(/[^\d.]/g, ""));
        if (Number.isFinite(v) && v > 0 && inv.schemaPrices.length < 50) inv.schemaPrices.push({ value: v, url });
      }
    }
  }
  for (const p of ctx.pages) {
    const s = scanPage(p);
    for (const t of s.telLinks) addPhone(decodeSafe(t));
    for (const e of s.mailLinks) inv.emails.add(decodeSafe(e).trim().toLowerCase());
    for (const a of s.addressTexts) {
      for (const m of a.matchAll(STREET_RE)) inv.streets.add(normStreet(m[0]));
    }
    for (const r of timeRangesInText(s.visibleText)) if (inv.textHours.size < 50) inv.textHours.add(r);
    for (const v of pricesInText(s.visibleText)) inv.visiblePrices.add(v);
  }
  inv.emails.delete("");
  return inv;
}

function decodeSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

const has = (re: RegExp, s: string) => {
  re.lastIndex = 0;
  const r = re.test(s);
  re.lastIndex = 0;
  return r;
};

/**
 * geo.fact-consistency: struck-through prices, hidden prices/phones/hours, schema prices that
 * aren't shown, and different phone numbers, emails, street addresses or hours across the pages
 * and schema we read, plus a stale footer copyright year. AI models quote what they read,
 * including old prices. Honest limits: styles from external CSS aren't seen; call-tracking
 * numbers and multi-location businesses legitimately show several values.
 */
export const factConsistencyCheck: Check = (ctx) => {
  const now = ctx.now ?? new Date();
  const found = new Map<Key, { urls: Set<string>; detail: string }>();
  const flag = (key: Key, url: string | null, detail: string) => {
    const e = found.get(key) ?? { urls: new Set<string>(), detail };
    if (url) e.urls.add(url);
    found.set(key, e);
  };

  const struckExamples: string[] = [];
  const hiddenKinds = new Set<string>();
  let staleYear: number | null = null;
  for (const p of ctx.pages) {
    const s = scanPage(p);
    for (const t of s.struck) {
      if (has(PRICE_RE, t)) {
        if (struckExamples.length < 3) struckExamples.push(t.slice(0, 60));
        flag("geo.fact-consistency:struck-price", p.url, "");
      }
    }
    for (const t of s.hidden) {
      const kinds: string[] = [];
      if (has(PRICE_RE, t)) kinds.push("prices");
      if (phonesInText(t).length) kinds.push("phone numbers");
      if (has(TIME_RANGE_RE, t) && timeRangesInText(t).length) kinds.push("opening times");
      if (kinds.length) {
        kinds.forEach((k) => hiddenKinds.add(k));
        flag("geo.fact-consistency:hidden-facts", p.url, "");
      }
    }
    if (p.isHome || staleYear === null) {
      const footer = s.footerText || s.visibleText.slice(-1_500);
      const y = copyrightYear(footer);
      if (y !== null && isStaleYear(y, now)) {
        staleYear = y;
        flag("geo.fact-consistency:stale-year", p.url, `Your footer says © ${y}; it's now ${now.getUTCFullYear()}.`);
      }
    }
  }
  if (struckExamples.length) {
    found.get("geo.fact-consistency:struck-price")!.detail = `Crossed-out text with a price: ${struckExamples.map((e) => `"${e}"`).join(", ")}.`;
  }
  if (hiddenKinds.size) {
    found.get("geo.fact-consistency:hidden-facts")!.detail = `Hidden content contains ${[...hiddenKinds].join(", ")}.`;
  }

  const inv = factInventory(ctx);
  if (inv.phones.size > 1) {
    flag(
      "geo.fact-consistency:phones",
      null,
      `We found ${inv.phones.size} different phone numbers in links and schema (${[...inv.phones.values()].slice(0, 4).join(", ")}).`,
    );
  }
  if (inv.emails.size > 1) {
    flag("geo.fact-consistency:emails", null, `We found ${inv.emails.size} different email addresses (${[...inv.emails].slice(0, 4).join(", ")}).`);
  }
  if (inv.streets.size > 1) {
    flag("geo.fact-consistency:addresses", null, `We found ${inv.streets.size} different street addresses (${[...inv.streets].slice(0, 3).join("; ")}).`);
  }
  if (inv.schemaHours.size > 0 && inv.textHours.size > 0 && ![...inv.schemaHours].some((h) => inv.textHours.has(h))) {
    flag(
      "geo.fact-consistency:hours",
      null,
      `Schema says ${[...inv.schemaHours].slice(0, 3).join(", ")}; your pages show ${[...inv.textHours].slice(0, 3).join(", ")}.`,
    );
  }
  const unseen = inv.schemaPrices.filter((p) => ![...inv.visiblePrices].some((v) => Math.abs(v - p.value) < 0.005));
  if (unseen.length) {
    flag(
      "geo.fact-consistency:schema-price",
      null,
      `Schema prices not shown as text on the pages we read: ${[...new Set(unseen.map((u) => u.value))].slice(0, 4).join(", ")}.`,
    );
    for (const u of unseen) found.get("geo.fact-consistency:schema-price")!.urls.add(u.url);
  }

  const issues: IssueSeed[] = [...found.entries()].map(([key, e]) => ({
    key,
    affectedUrls: [...e.urls],
    detail: e.detail || undefined,
    share: PENALTY[key] * 10,
  }));
  if (issues.length === 0) {
    return outcome(def, {
      score: 1,
      summary: "No crossed-out or hidden prices, and contact details, prices and hours agree across the pages and schema we read.",
      issues,
    });
  }
  const score = 1 - [...found.keys()].reduce((s, k) => s + PENALTY[k], 0);
  return outcome(def, {
    score: Math.max(0, score),
    summary: `${issues.length} possible ${issues.length === 1 ? "mismatch" : "mismatches"} an AI model could quote: ${[...found.keys()]
      .map((k) => LABEL[k])
      .join(", ")}.`,
    issues,
  });
};

const LABEL: Record<Key, string> = {
  "geo.fact-consistency:struck-price": "crossed-out prices",
  "geo.fact-consistency:schema-price": "schema prices not shown on the page",
  "geo.fact-consistency:phones": "several phone numbers",
  "geo.fact-consistency:addresses": "several street addresses",
  "geo.fact-consistency:hours": "opening hours that differ",
  "geo.fact-consistency:hidden-facts": "hidden prices or contact details",
  "geo.fact-consistency:emails": "several email addresses",
  "geo.fact-consistency:stale-year": "an old copyright year",
};
