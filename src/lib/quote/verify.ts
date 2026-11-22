/**
 * Checks an order's line items against the catalog (T019). Pure; used by the contact server
 * action so a client can never set its own price. Client prices are compared, never trusted.
 */
import { catalogItemForSlug, MAX_ORDER_ITEMS, priceIn, type QuoteCurrency, type ServiceSlug } from "./catalog";
import type { OrderItem } from "./quote";

export type OrderItemProblem = "unknown-service" | "not-quotable" | "price-mismatch" | "from-mismatch";

export interface VerifiedOrderItem {
  /** as submitted (slug already shape-checked by the caller) */
  serviceSlug: string;
  label: string;
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
  const items: VerifiedOrderItem[] = input.items.slice(0, MAX_ORDER_ITEMS).map((it) => {
    const base = {
      serviceSlug: it.serviceSlug,
      label: it.label,
      submittedPrice: it.price,
      submittedFrom: it.from,
    };
    const item = catalogItemForSlug(it.serviceSlug);
    if (!item) {
      return { ...base, catalogSlug: null, catalogPrice: null, catalogFrom: null, valid: false, problem: "unknown-service" };
    }
    const p = priceIn(item, input.currency);
    const catalogPrice = p === null ? null : p.amount;
    // "on-request" (no price in this currency) is a starting point, never fixed.
    const catalogFrom = p === null ? true : p.kind === "from";
    const known = { ...base, catalogSlug: item.serviceSlug, catalogPrice, catalogFrom };
    if (!item.quotable) return { ...known, valid: false, problem: "not-quotable" };
    if (it.price !== catalogPrice) return { ...known, valid: false, problem: "price-mismatch" };
    if (it.from !== catalogFrom) return { ...known, valid: false, problem: "from-mismatch" };
    return { ...known, valid: true, problem: null };
  });

  const catalogTotal = items.reduce((sum, i) => sum + (i.valid ? (i.catalogPrice ?? 0) : 0), 0);
  const allValid = items.length > 0 && items.every((i) => i.valid);
  const valid = allValid && input.submittedTotal === catalogTotal && input.items.length <= MAX_ORDER_ITEMS;
  const fixed = valid && input.submittedFixed && items.every((i) => i.catalogFrom === false);
  return { currency: input.currency, items, catalogTotal, submittedTotal: input.submittedTotal, valid, fixed };
}
