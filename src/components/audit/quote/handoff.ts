/**
 * Order hand-off from the audit report to /contact (T022). The quote travels in sessionStorage,
 * never in the URL; the link itself only carries the non-personal ?service= slug, which also
 * works as the fallback when storage is unavailable.
 */
import { QUOTE_TEXT, toOrderFields, type Quote, type QuoteOrderFields } from "@/lib/quote";

export const QUOTE_STORAGE_KEY = "seenhq:quote";
/** Fired on window when this tab stores or clears the quote (the "storage" event only fires in other tabs). */
export const QUOTE_CHANGE_EVENT = "seenhq:quote-change";

export interface StoredQuote {
  v: 1;
  orderFields: QuoteOrderFields;
  audit_id: string;
  audit_url: string;
  /** contact form service to preselect */
  service: string;
  /** what the visitor sees above the form; display only (the server re-checks prices) */
  summary: {
    site: string;
    lines: { label: string; priceText: string; covers: string[] }[];
    totalText: string;
    fixed: boolean;
    notes: string[];
  };
}

export function contactHref(quote: Pick<Quote, "lines">): string {
  const slug = quote.lines[0]?.serviceSlug;
  return slug ? `/contact?service=${encodeURIComponent(slug)}` : "/contact";
}

export function toStoredQuote(quote: Quote, audit: { id: string; url: string; hostname: string }): StoredQuote {
  return {
    v: 1,
    orderFields: toOrderFields(quote),
    audit_id: audit.id,
    audit_url: audit.url,
    service: quote.lines[0]?.serviceSlug ?? "not-sure",
    summary: {
      site: audit.hostname,
      lines: quote.lines.map((l) => ({ label: l.label, priceText: l.priceText, covers: l.covers.map((c) => c.title) })),
      totalText: quote.totalText,
      fixed: quote.fixedTotal,
      notes: [QUOTE_TEXT.tax, ...(quote.fixedTotal ? [] : [QUOTE_TEXT.confirm])],
    },
  };
}

/** Returns false when storage is unavailable (private mode, blocked); the link still works. */
export function storeQuote(data: StoredQuote): boolean {
  try {
    window.sessionStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(QUOTE_CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

const str = (v: unknown, max: number): string | null => (typeof v === "string" && v.length <= max ? v : null);

/** The raw stored string, or null (also when storage is blocked). */
export function readStoredQuoteRaw(): string | null {
  try {
    return window.sessionStorage.getItem(QUOTE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readStoredQuote(): StoredQuote | null {
  return parseStoredQuote(readStoredQuoteRaw());
}

/** Shape-checks a stored quote. Anything unexpected → null (the form works without it). */
export function parseStoredQuote(raw: string | null): StoredQuote | null {
  if (!raw || raw.length > 20_000) return null;
  try {
    const d = JSON.parse(raw) as Partial<StoredQuote> | null;
    if (!d || d.v !== 1 || !d.orderFields || !d.summary) return null;
    const of = d.orderFields;
    const s = d.summary;
    if (
      (of.quote_currency !== "USD" && of.quote_currency !== "INR") ||
      !str(of.quote_total, 20) ||
      (of.quote_fixed !== "true" && of.quote_fixed !== "false") ||
      !str(of.quote_items, 8_000) ||
      !str(d.audit_id, 64) ||
      !str(d.audit_url, 2_048) ||
      !str(d.service, 64) ||
      !str(s.site, 253) ||
      !str(s.totalText, 80) ||
      !Array.isArray(s.lines) ||
      !Array.isArray(s.notes)
    ) {
      return null;
    }
    const lines = s.lines
      .slice(0, 12)
      .filter((l) => l && str(l.label, 120) && str(l.priceText, 80) && Array.isArray(l.covers))
      .map((l) => ({ label: l.label, priceText: l.priceText, covers: l.covers.filter((c) => str(c, 200)).slice(0, 50) }));
    return {
      v: 1,
      orderFields: of,
      audit_id: d.audit_id!,
      audit_url: d.audit_url!,
      service: d.service!,
      summary: {
        site: s.site,
        lines,
        totalText: s.totalText,
        fixed: s.fixed === true,
        notes: s.notes.filter((n) => str(n, 300)).slice(0, 4),
      },
    };
  } catch {
    return null;
  }
}

export function clearStoredQuote(): void {
  try {
    window.sessionStorage.removeItem(QUOTE_STORAGE_KEY);
  } catch {
    // nothing to do
  }
  window.dispatchEvent(new Event(QUOTE_CHANGE_EVENT));
}
