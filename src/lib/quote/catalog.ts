/**
 * THE sellable price list for instant quotes and order validation (T019, ADR-016).
 *
 * Pure and client-safe: no "server-only", no Node APIs. Every price the quote engine shows and
 * every price the contact action accepts comes from this one table. The amounts mirror the
 * display strings in src/content/services.ts and src/content/pricing.ts;
 * tests/quote/catalog.test.ts fails if the two ever disagree (amount or "From" wording).
 */

export type QuoteCurrency = "USD" | "INR";
export const QUOTE_CURRENCIES = ["USD", "INR"] as const satisfies readonly QuoteCurrency[];

/** Service slugs as used in src/content/services.ts and the contact form. */
export type ServiceSlug =
  | "seo-audit"
  | "geo-audit"
  | "technical-fixes"
  | "content-entity"
  | "monitoring"
  | "ai-fact-check"
  | "local-ai-setup"
  | "ai-crawler-unblock";

/**
 * "fixed": the published price is the price.
 * "from": the published price is a starting point; a person confirms the final number.
 */
export type CatalogPriceKind = "fixed" | "from";

export interface CatalogPrice {
  /** whole currency units, tax-exclusive */
  amount: number;
  kind: CatalogPriceKind;
}

export interface CatalogItem {
  /** stable catalog key */
  key: CatalogKey;
  /** slug sent with an order; matches src/content/services.ts */
  serviceSlug: ServiceSlug;
  /** other slugs that order the same item (the SEO and GEO audits are sold together) */
  alsoMatches: readonly ServiceSlug[];
  /** customer-facing name */
  label: string;
  usd: CatalogPrice;
  /** null: no rupee price is published yet, so the price is confirmed by email */
  inr: CatalogPrice | null;
  /** what one price buys */
  unit: "site" | "location" | "month";
  /**
   * false: never added to an instant quote (Monitoring is offered only after a fix is bought,
   * never pre-selected; see docs/CONVERSION_RESEARCH.md change 1).
   */
  quotable: boolean;
}

export type CatalogKey =
  | "full-audit"
  | "fix-sprint"
  | "content-entity"
  | "ai-crawler-unblock"
  | "local-ai-setup"
  | "ai-fact-check"
  | "monitoring";

/** Order matters: quote lines are listed in this order. */
export const CATALOG: readonly CatalogItem[] = [
  {
    key: "ai-crawler-unblock",
    serviceSlug: "ai-crawler-unblock",
    alsoMatches: [],
    label: "AI crawler unblock",
    usd: { amount: 49, kind: "fixed" },
    inr: { amount: 2999, kind: "fixed" },
    unit: "site",
    quotable: true,
  },
  {
    key: "fix-sprint",
    serviceSlug: "technical-fixes",
    alsoMatches: [],
    label: "Technical fix sprint",
    usd: { amount: 149, kind: "fixed" },
    inr: { amount: 9999, kind: "fixed" },
    unit: "site",
    quotable: true,
  },
  {
    key: "content-entity",
    serviceSlug: "content-entity",
    alsoMatches: [],
    label: "Content & entity",
    usd: { amount: 99, kind: "from" },
    inr: { amount: 6999, kind: "from" },
    unit: "site",
    quotable: true,
  },
  {
    key: "local-ai-setup",
    serviceSlug: "local-ai-setup",
    alsoMatches: [],
    label: "Local AI visibility setup",
    usd: { amount: 99, kind: "fixed" },
    inr: { amount: 3999, kind: "fixed" },
    unit: "location",
    quotable: true,
  },
  {
    key: "ai-fact-check",
    serviceSlug: "ai-fact-check",
    alsoMatches: [],
    label: "AI fact-check & fix",
    usd: { amount: 59, kind: "fixed" },
    inr: { amount: 3999, kind: "fixed" },
    unit: "site",
    quotable: true,
  },
  {
    key: "full-audit",
    serviceSlug: "seo-audit",
    alsoMatches: ["geo-audit"],
    label: "Full audit (SEO + GEO, reviewed by a person)",
    usd: { amount: 39, kind: "fixed" },
    inr: { amount: 2999, kind: "fixed" },
    unit: "site",
    quotable: true,
  },
  {
    key: "monitoring",
    serviceSlug: "monitoring",
    alsoMatches: [],
    label: "Monitoring",
    usd: { amount: 19, kind: "fixed" },
    inr: { amount: 999, kind: "fixed" },
    unit: "month",
    quotable: false,
  },
];

/**
 * Written scope of an instant quote. Above either cap the quote still lists prices but is not
 * fixed: a person confirms it within 1 business day.
 * - maxPagesScanned: the free audit reads the homepage plus up to five pages.
 * - maxPaidIssues: the fixed-price Fix sprint covers up to 8 fixes; above that a person quotes the larger job.
 */
export const QUOTE_SCOPE_CAP = { maxPagesScanned: 6, maxPaidIssues: 8 } as const;

/** Max line items an order may carry (mirrors the contact form validation). */
export const MAX_ORDER_ITEMS = 12;

export function catalogItem(key: CatalogKey): CatalogItem {
  const item = CATALOG.find((c) => c.key === key);
  // CATALOG is a literal covering every CatalogKey (tests assert this), so this cannot fail.
  if (!item) throw new Error(`Unknown catalog key: ${key}`);
  return item;
}

/** Catalog item ordered by a service slug (including aliases), or null. */
export function catalogItemForSlug(slug: string): CatalogItem | null {
  return CATALOG.find((c) => c.serviceSlug === slug || (c.alsoMatches as readonly string[]).includes(slug)) ?? null;
}

export function priceIn(item: CatalogItem, currency: QuoteCurrency): CatalogPrice | null {
  return currency === "USD" ? item.usd : item.inr;
}

function groupDigits(n: number, currency: QuoteCurrency): string {
  const s = String(Math.trunc(Math.abs(n)));
  if (currency === "USD") return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Indian grouping: last three digits, then pairs (1,00,000).
  if (s.length <= 3) return s;
  const head = s.slice(0, -3);
  const tail = s.slice(-3);
  return `${head.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${tail}`;
}

/** Deterministic, locale-independent price text: "$1,199", "₹14,999", "₹1,00,000". */
export function formatPrice(amount: number, currency: QuoteCurrency): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency === "USD" ? "$" : "₹"}${groupDigits(amount, currency)}`;
}
