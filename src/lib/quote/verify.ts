/**
 * Checks an order's line items against the catalog (T019, R3 H1/L4). Pure; used by the contact
 * server action so a client can never set its own price, label or scope. Client values are
 * compared, never trusted: a known item always carries the catalog label.
 */
import {
  catalogItemForSlug,
  largerJobPriceIn,
  MAX_ORDER_ITEMS,
  priceIn,
  type CatalogKey,
  type QuoteCurrency,
  type ServiceSlug,
} from "./catalog";
import type { OrderItem } from "./quote";

export type OrderItemProblem =
  | "unknown-service"
  | "not-quotable"
  | "duplicate"
  | "price-mismatch"
  | "from-mismatch"
  | "label-mismatch";

export interface VerifiedOrderItem {
  /** as submitted (slug already shape-checked by the caller) */
  serviceSlug: string;
  /** the catalog label for known services; the client's text only when the slug is unknown */
  label: string;
  /** the client's label, kept only when it differs from the catalog label (shown as evidence) */
  submittedLabel: string | null;
  submittedPrice: number | null;
  submittedFrom: boolean;
  /** catalog values; null when the slug is unknown or has no price in this currency */
  catalogSlug: ServiceSlug | null;
  catalogPrice: number | null;
  catalogFrom: boolean | null;
  valid: boolean;
  problem: OrderItemProblem | null;
}

export interface VerifiedOrder {
  currency: QuoteCurrency;
  items: VerifiedOrderItem[];
  /** sum of catalog prices of valid items; never the client's number */
  catalogTotal: number;
  submittedTotal: number | null;
  /** true only when every item matches the catalog and the submitted total equals catalogTotal */
  valid: boolean;
  /**
   * true only when the client said fixed AND every item is a fixed catalog price. The server never
   * upgrades a quote to fixed; it can only downgrade.
   */
  fixed: boolean;
}

export function verifyOrder(input: {
  currency: QuoteCurrency;
  items: readonly OrderItem[] | readonly { serviceSlug: string; label: string; price: number | null; from: boolean }[];
  submittedTotal: number | null;
  submittedFixed: boolean;
}): VerifiedOrder {
  const seen = new Set<CatalogKey>();
  const items: VerifiedOrderItem[] = input.items.slice(0, MAX_ORDER_ITEMS).map((it) => {
    const submitted = {
      serviceSlug: it.serviceSlug,
      submittedPrice: it.price,
      submittedFrom: it.from,
    };
    const item = catalogItemForSlug(it.serviceSlug);
    if (!item) {
      return {
        ...submitted,
        label: it.label,
        submittedLabel: null,
        catalogSlug: null,
        catalogPrice: null,
        catalogFrom: null,
        valid: false,
        problem: "unknown-service",
      };
    }
    // A Fix sprint line covering more than its own scope cap carries its larger-job starting price
    // (always "from"); it is never accepted as a fixed price.
    const larger = largerJobPriceIn(item, input.currency);
    const p = larger && it.from && it.price === larger.amount ? larger : priceIn(item, input.currency);
    const catalogPrice = p === null ? null : p.amount;
    // "on-request" (no price in this currency) is a starting point, never fixed.
    const catalogFrom = p === null ? true : p.kind === "from";
    const labelMatches = it.label.trim() === item.label;
    const known = {
      ...submitted,
      label: item.label,
      submittedLabel: labelMatches ? null : it.label,
      catalogSlug: item.serviceSlug,
      catalogPrice,
      catalogFrom,
    };
    const duplicate = seen.has(item.key);
    seen.add(item.key);
    const problem: OrderItemProblem | null = !item.quotable
      ? "not-quotable"
      : duplicate
        ? "duplicate"
        : it.price !== catalogPrice
          ? "price-mismatch"
          : it.from !== catalogFrom
            ? "from-mismatch"
            : !labelMatches
              ? "label-mismatch"
              : null;
    return { ...known, valid: problem === null, problem };
  });

  const catalogTotal = items.reduce((sum, i) => sum + (i.valid ? (i.catalogPrice ?? 0) : 0), 0);
  const allValid = items.length > 0 && items.every((i) => i.valid);
  const valid = allValid && input.submittedTotal === catalogTotal && input.items.length <= MAX_ORDER_ITEMS;
  const fixed = valid && input.submittedFixed && items.every((i) => i.catalogFrom === false);
  return { currency: input.currency, items, catalogTotal, submittedTotal: input.submittedTotal, valid, fixed };
}
