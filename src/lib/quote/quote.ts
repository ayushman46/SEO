/**
 * Instant quote from an audit result (T019, ADR-016). Pure, deterministic, client-safe:
 * no randomness, no dates, no Node APIs, type-only imports from the audit contract.
 *
 * Rules (docs/DECISIONS.md ADR-016):
 * - Every price comes from ./catalog. Nothing here invents a price, discount or urgency.
 * - A "from" price is never presented as fixed; any "from" line makes the total not fixed.
 * - The DIY list is always returned, and DIY items are never priced unless the owner picks them.
 * - Prices are tax-exclusive; the quote always carries the tax note.
 */
import type { AuditIssue } from "@/lib/audit/types";
import {
  CATALOG,
  catalogItem,
  formatPrice,
  MAX_ORDER_ITEMS,
  priceIn,
  QUOTE_SCOPE_CAP,
  type CatalogItem,
  type CatalogKey,
  type QuoteCurrency,
  type ServiceSlug,
} from "./catalog";
import { checkIdOf, FIXER_CATALOG_KEY, routeFor, type Fixer, type PaidFixer } from "./mapping";

/**
 * One finding. Full issues (AuditIssue) satisfy this; so do the partial report's locked issues
 * (id/title/severity only): checkId is derived from the id and effort is treated as unknown.
 */
export type QuoteIssueInput = Pick<AuditIssue, "id" | "title" | "severity"> &
  Partial<Pick<AuditIssue, "checkId" | "effort">>;

export interface QuoteInput {
  issues: readonly QuoteIssueInput[];
  /** pages the free audit read (PartialAuditReport.pagesScanned or AuditResult.pages.length) */
  pagesScanned: number;
  currency: QuoteCurrency;
  /**
   * Issues the owner explicitly asked us to fix ("have us fix this"). When given, exactly these
   * are priced (DIY and low-severity ones included, because the owner chose them); unknown ids
   * are ignored. When omitted, the default quote covers every non-DIY issue above low severity.
   */
  selectedIssueIds?: readonly string[];
}

/** "on-request": no published price in this currency; a person confirms it by email. */
export type QuoteLinePriceKind = "fixed" | "from" | "on-request";

export interface QuoteLine {
  key: CatalogKey;
  /** send this with an order (contact form `quote_items[].serviceSlug`) */
  serviceSlug: ServiceSlug;
  label: string;
  /** the issues this line fixes, in input order; empty for the Full audit alternative */
  covers: { id: string; title: string }[];
  /** catalog amount in the quote currency; null when priceKind is "on-request" */
  price: number | null;
  priceKind: QuoteLinePriceKind;
  /** ready to render: "$149", "From $199", "Price confirmed by email" */
  priceText: string;
  unit: "site" | "location";
  /** one plain sentence about scope, or null */
  note: string | null;
}

/** Why a total is not fixed. Each maps to QUOTE_TEXT.review[reason]. */
export type QuoteReviewReason =
  | "from-price"
  | "price-on-request"
  | "pages-over-cap"
  | "issues-over-cap"
  | "involved-work";

export interface QuoteBundle {
  /** the line that absorbed the others */
  into: CatalogKey;
  /** lines that were not added because `into` already covers their issues */
  absorbed: CatalogKey[];
  /** plain English explanation */
  reason: string;
  /** catalog price of the absorbed lines in the quote currency (not a discount) */
  avoidedAmount: number;
}

export type QuoteTaxNoteKey = "excludes-applicable-taxes";
export type QuoteConfirmNoteKey = "person-confirms-within-1-business-day";

export interface Quote {
  currency: QuoteCurrency;
  /** recommended lines; their prices make up `total` */
  lines: QuoteLine[];
  /** set when one line covers what would otherwise be a separate line */
  bundle: QuoteBundle | null;
  /** not in the total, never pre-selected: the Full audit for owners who want a person to look first */
  alternatives: QuoteLine[];
  /** sum of the priced lines, tax-exclusive; 0 when there are no lines */
  total: number;
  /** "$348", "From $348", or "Price confirmed by email" */
  totalText: string;
  /** false → the UI must say a person confirms the price within 1 business day */
  fixedTotal: boolean;
  /** empty when fixedTotal is true */
  reviewReasons: QuoteReviewReason[];
  /** null when fixedTotal is true */
  confirmNote: QuoteConfirmNoteKey | null;
  /** always present: show QUOTE_TEXT.tax next to the total */
  taxNote: QuoteTaxNoteKey;
  /** things the owner can do in minutes; always shown */
  diyIssueIds: string[];
  /** low-severity (or deliberate-choice) issues we would leave for now */
  safeToIgnore: string[];
  /** issue ids priced in `lines` */
  coveredIssueIds: string[];
  /** plain-English summary, deterministic */
  summary: string;
}

/** Default English copy for the keys above. content-seo may override in the UI. */
export const QUOTE_TEXT = {
  tax: "Prices exclude applicable taxes.",
  confirm: "A person confirms the final price within 1 business day, before you pay anything.",
  onRequest: "Price confirmed by email",
  review: {
    "from-price": "Some prices are starting prices; the final price depends on the work involved.",
    "price-on-request": "One service has no published price in this currency yet.",
    "pages-over-cap": `The quote covers the ${QUOTE_SCOPE_CAP.maxPagesScanned} pages the free audit reads; a larger site needs a person to look.`,
    "issues-over-cap": `More than ${QUOTE_SCOPE_CAP.maxPaidIssues} fixes is a larger job than the fixed-price Fix sprint covers, so a person quotes it.`,
    "involved-work": "At least one fix needs a developer, so a person scopes it first.",
  } satisfies Record<QuoteReviewReason, string>,
} as const;

const MAX_INPUT_ISSUES = 300;
const MAX_TITLE_CHARS = 200;

const LINE_NOTES: Partial<Record<CatalogKey, string>> = {
  "local-ai-setup": "Priced for one location; each extra location costs the same.",
  "ai-fact-check": "Up to 10 questions on 4 assistants, fixes to the sources you control and one re-test after 30 days.",
  "fix-sprint": `Up to ${QUOTE_SCOPE_CAP.maxPaidIssues} fixes from this list on one site, with before/after proof for each.`,
  "content-entity": "Covers the pages and sections listed here; the price depends on how many there are.",
};

const FULL_AUDIT_NOTE =
  "A person reviews up to 15 pages and emails you a plan: what to fix first, what can wait and what to ignore.";

const plural = (n: number, one: string, many: string): string => (n === 1 ? one : many);

function priceTextFor(kind: QuoteLinePriceKind, price: number | null, currency: QuoteCurrency): string {
  if (kind === "on-request" || price === null) return QUOTE_TEXT.onRequest;
  return kind === "from" ? `From ${formatPrice(price, currency)}` : formatPrice(price, currency);
}

function makeLine(item: CatalogItem, currency: QuoteCurrency, covers: QuoteLine["covers"], note: string | null): QuoteLine {
  const p = priceIn(item, currency);
  const priceKind: QuoteLinePriceKind = p === null ? "on-request" : p.kind;
  const price = p === null ? null : p.amount;
  return {
    key: item.key,
    serviceSlug: item.serviceSlug,
    label: item.label,
    covers,
    price,
    priceKind,
    priceText: priceTextFor(priceKind, price, currency),
    unit: item.unit === "location" ? "location" : "site",
    note,
  };
}

function listJoin(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** Uses the line's own priceText so the summary and the lines can never disagree. */
function linePhrase(line: QuoteLine): string {
  if (line.priceKind === "on-request") return `${line.label} (price confirmed by email)`;
  const text = line.priceKind === "from" ? `from ${line.priceText.slice("From ".length)}` : line.priceText;
  return `${line.label} (${text})`;
}

interface Routed {
  issue: QuoteIssueInput;
  fixer: Fixer;
  service: PaidFixer;
}

function sanitizeIssues(issues: readonly QuoteIssueInput[]): QuoteIssueInput[] {
  const seen = new Set<string>();
  const out: QuoteIssueInput[] = [];
  for (const i of issues) {
    if (out.length >= MAX_INPUT_ISSUES) break;
    if (!i || typeof i.id !== "string" || i.id === "" || seen.has(i.id)) continue;
    seen.add(i.id);
    out.push({ ...i, title: typeof i.title === "string" ? i.title.slice(0, MAX_TITLE_CHARS) : "" });
  }
  return out;
}

/** Builds the instant quote. Same input → same output. */
export function buildQuote(input: QuoteInput): Quote {
  const currency: QuoteCurrency = input.currency === "INR" ? "INR" : "USD";
  const pagesScanned = Number.isFinite(input.pagesScanned) ? Math.max(0, Math.floor(input.pagesScanned)) : 0;
  const issues = sanitizeIssues(input.issues);
  const selected = input.selectedIssueIds ? new Set(input.selectedIssueIds) : null;

  const routed: Routed[] = issues.map((issue) => {
    const r = routeFor(issue);
    return { issue, fixer: r.fixer, service: r.service };
  });

  const diyIssueIds = routed.filter((r) => r.fixer === "diy").map((r) => r.issue.id);
  const safeToIgnore = routed
    .filter((r) => r.fixer !== "diy" && (r.issue.severity === "low" || r.fixer === "none"))
    .filter((r) => !selected?.has(r.issue.id))
    .map((r) => r.issue.id);

  const paidIssues: Routed[] = selected
    ? routed.filter((r) => selected.has(r.issue.id))
    : routed.filter((r) => r.fixer !== "diy" && r.fixer !== "none" && r.issue.severity !== "low");

  // Group by catalog item.
  const groups = new Map<CatalogKey, Routed[]>();
  for (const r of paidIssues) {
    const key = FIXER_CATALOG_KEY[r.service];
    const g = groups.get(key);
    if (g) g.push(r);
    else groups.set(key, [r]);
  }

  // Bundle: the fix sprint already sets robots.txt up correctly, so robots.txt-level AI crawler
  // blocks need no separate unblock job. Server, CDN or firewall blocks (the probe) still do.
  let bundle: QuoteBundle | null = null;
  const sprint = groups.get("fix-sprint");
  const unblock = groups.get("ai-crawler-unblock");
  if (sprint && unblock && unblock.every((r) => (r.issue.checkId ?? checkIdOf(r.issue.id)) === "geo.ai-crawlers")) {
    sprint.push(...unblock);
    groups.delete("ai-crawler-unblock");
    const absorbedPrice = priceIn(catalogItem("ai-crawler-unblock"), currency);
    bundle = {
      into: "fix-sprint",
      absorbed: ["ai-crawler-unblock"],
      reason:
        "The fix sprint already includes setting up robots.txt, so the AI crawler rules are fixed there instead of as a separate AI crawler unblock.",
      avoidedAmount: absorbedPrice?.amount ?? 0,
    };
  }

  const lines: QuoteLine[] = [];
  for (const item of CATALOG) {
    const g = groups.get(item.key);
    if (!g || g.length === 0) continue;
    lines.push(
      makeLine(
        item,
        currency,
        g.map((r) => ({ id: r.issue.id, title: r.issue.title })),
        LINE_NOTES[item.key] ?? null,
      ),
    );
  }
  // MAX_ORDER_ITEMS bounds what an order may carry; the catalog has fewer quotable items.
  lines.splice(MAX_ORDER_ITEMS);

  const coveredIssueIds = lines.flatMap((l) => l.covers.map((c) => c.id));

  const reviewReasons: QuoteReviewReason[] = [];
  if (lines.length > 0) {
    if (lines.some((l) => l.priceKind === "from")) reviewReasons.push("from-price");
    if (lines.some((l) => l.priceKind === "on-request")) reviewReasons.push("price-on-request");
    if (pagesScanned > QUOTE_SCOPE_CAP.maxPagesScanned) reviewReasons.push("pages-over-cap");
    if (coveredIssueIds.length > QUOTE_SCOPE_CAP.maxPaidIssues) reviewReasons.push("issues-over-cap");
    if (paidIssues.some((r) => r.issue.effort === "involved")) reviewReasons.push("involved-work");
  }
  const fixedTotal = reviewReasons.length === 0;
  const total = lines.reduce((sum, l) => sum + (l.price ?? 0), 0);
  const allOnRequest = lines.length > 0 && lines.every((l) => l.price === null);
  const totalText = allOnRequest
    ? QUOTE_TEXT.onRequest
    : fixedTotal
      ? formatPrice(total, currency)
      : `From ${formatPrice(total, currency)}`;

  const fullAudit = catalogItem("full-audit");
  const alternatives = issues.length > 0 ? [makeLine(fullAudit, currency, [], FULL_AUDIT_NOTE)] : [];

  const summary = buildSummary({
    issueCount: issues.length,
    pagesScanned,
    diyCount: diyIssueIds.length,
    ignoreCount: safeToIgnore.length,
    selectedCount: selected ? paidIssues.length : null,
    lines,
    bundle,
    fixedTotal,
    allOnRequest,
    totalText,
  });

  return {
    currency,
    lines,
    bundle,
    alternatives,
    total,
    totalText,
    fixedTotal,
    reviewReasons,
    confirmNote: fixedTotal ? null : "person-confirms-within-1-business-day",
    taxNote: "excludes-applicable-taxes",
    diyIssueIds,
    safeToIgnore,
    coveredIssueIds,
    summary,
  };
}

function buildSummary(s: {
  issueCount: number;
  pagesScanned: number;
  diyCount: number;
  ignoreCount: number;
  selectedCount: number | null;
  lines: QuoteLine[];
  bundle: QuoteBundle | null;
  fixedTotal: boolean;
  allOnRequest: boolean;
  totalText: string;
}): string {
  const where =
    s.pagesScanned > 0 ? ` on the ${s.pagesScanned} ${plural(s.pagesScanned, "page", "pages")} we read` : "";
  if (s.issueCount === 0) return `We found no issues${where}, so there is nothing to quote.`;

  const out: string[] = [`We found ${s.issueCount} ${plural(s.issueCount, "issue", "issues")}${where}.`];
  if (s.diyCount > 0) {
    out.push(
      s.diyCount === 1
        ? "One of them you can fix yourself in a few minutes; the report shows how."
        : `${s.diyCount} of them you can fix yourself in a few minutes; the report shows how.`,
    );
  }
  if (s.ignoreCount > 0) {
    out.push(`${s.ignoreCount} ${plural(s.ignoreCount, "is", "are")} low priority and safe to leave for now.`);
  }

  if (s.lines.length === 0) {
    out.push(
      s.selectedCount !== null
        ? "You haven't picked any issues for us to fix yet."
        : "Nothing else needs paid help.",
    );
    return out.join(" ");
  }

  const services = listJoin(s.lines.map(linePhrase));
  out.push(
    s.selectedCount !== null
      ? `For the ${s.selectedCount} ${plural(s.selectedCount, "issue", "issues")} you picked, we suggest ${services}.`
      : s.diyCount + s.ignoreCount > 0
        ? `For the rest, we suggest ${services}.`
        : `We suggest ${services}.`,
  );
  if (s.bundle) out.push(s.bundle.reason);

  if (s.allOnRequest) {
    out.push("A person confirms the price by email within 1 business day, before you pay anything.");
  } else if (s.fixedTotal) {
    out.push(`Total ${s.totalText}, fixed, excluding applicable taxes.`);
  } else {
    out.push(
      `Total ${s.totalText.charAt(0).toLowerCase()}${s.totalText.slice(1)}, excluding applicable taxes; a person confirms the final price within 1 business day, before you pay anything.`,
    );
  }
  return out.join(" ");
}

/* ------------------------------------------------------------------ */
/* Per-issue helper and order hand-off                                  */
/* ------------------------------------------------------------------ */

export interface IssueFixInfo {
  fixer: Fixer;
  /** true: show "Fix it myself" as the suggested path (both buttons stay equally prominent) */
  diy: boolean;
  /** the service a "have us fix this" click adds */
  serviceSlug: ServiceSlug;
  serviceLabel: string;
  /** e.g. "From $199" or "$149"; the price of the whole service, not of this one issue */
  priceText: string;
}

/** For per-issue "have us fix this" buttons. Works with the partial report's minimal shape. */
export function issueFixInfo(issue: Pick<QuoteIssueInput, "id" | "checkId">, currency: QuoteCurrency): IssueFixInfo {
  const r = routeFor(issue);
  const item = catalogItem(FIXER_CATALOG_KEY[r.service]);
  const p = priceIn(item, currency);
  const kind: QuoteLinePriceKind = p === null ? "on-request" : p.kind;
  return {
    fixer: r.fixer,
    diy: r.fixer === "diy",
    serviceSlug: item.serviceSlug,
    serviceLabel: item.label,
    priceText: priceTextFor(kind, p === null ? null : p.amount, currency),
  };
}

/** One order line as the contact form carries it (`quote_items` is a JSON array of these). */
export interface OrderItem {
  serviceSlug: ServiceSlug;
  /** ≤ 120 chars */
  label: string;
  /** null when the line is "on-request" */
  price: number | null;
  /** true unless the price is fixed */
  from: boolean;
}

/** Hidden-field values for the contact form. Field names match the contact server action. */
export interface QuoteOrderFields {
  quote_currency: QuoteCurrency;
  quote_total: string;
  quote_fixed: "true" | "false";
  quote_items: string;
}

export function toOrderItems(quote: Pick<Quote, "lines">): OrderItem[] {
  return quote.lines.slice(0, MAX_ORDER_ITEMS).map((l) => ({
    serviceSlug: l.serviceSlug,
    label: l.label.slice(0, 120),
    price: l.price,
    from: l.priceKind !== "fixed",
  }));
}

export function toOrderFields(quote: Quote): QuoteOrderFields {
  return {
    quote_currency: quote.currency,
    quote_total: String(quote.total),
    quote_fixed: quote.fixedTotal ? "true" : "false",
    quote_items: JSON.stringify(toOrderItems(quote)),
  };
}
