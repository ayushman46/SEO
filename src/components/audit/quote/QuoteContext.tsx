"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { auditQuoteCopy } from "@/content/audit";
import { buildQuote, type Quote, type QuoteCurrency, type QuoteIssueInput } from "@/lib/quote";

export interface QuoteState {
  currency: QuoteCurrency;
  setCurrency: (c: QuoteCurrency) => void;
  /** the default quote for this audit (every non-DIY issue above low severity) */
  quote: Quote;
  /** issue ids the owner picked with "Add to my fix list", in the order picked */
  selected: string[];
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  /** quote for exactly the picked issues; null when nothing is picked */
  selectionQuote: Quote | null;
  titleOf: (id: string) => string;
  audit: { id: string; url: string; hostname: string };
  /** sample report: actions lead to /audit instead of an order */
  sample: boolean;
}

const QuoteContext = createContext<QuoteState | null>(null);

/** null outside a QuoteProvider (e.g. the home page preview): quote UI renders nothing there. */
export function useQuote(): QuoteState | null {
  return useContext(QuoteContext);
}

/**
 * Holds the currency choice and the "fix list" for one audit. Everything is derived with
 * buildQuote() from src/lib/quote, so the panel, the per-issue buttons and the tray can never
 * disagree. Local state only: nothing is stored until the owner asks for the quote.
 */
export function QuoteProvider({
  issues,
  pagesScanned,
  audit,
  sample = false,
  initialSelected = [],
  children,
}: {
  issues: readonly QuoteIssueInput[];
  pagesScanned: number;
  audit: { id: string; url: string; hostname: string };
  sample?: boolean;
  /** issue ids already in the fix list (tests, and a future "restore my list") */
  initialSelected?: string[];
  children?: ReactNode;
}) {
  const [currency, setCurrency] = useState<QuoteCurrency>("USD");
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [announcement, setAnnouncement] = useState("");

  const titles = useMemo(() => new Map(issues.map((i) => [i.id, i.title])), [issues]);
  const titleOf = useCallback((id: string) => titles.get(id) ?? id, [titles]);

  const quote = useMemo(() => buildQuote({ issues, pagesScanned, currency }), [issues, pagesScanned, currency]);
  // Ignore picks that are not in this audit (e.g. after the partial -> full switch).
  const picked = useMemo(() => selected.filter((id) => titles.has(id)), [selected, titles]);
  const selectionQuote = useMemo(
    () => (picked.length ? buildQuote({ issues, pagesScanned, currency, selectedIssueIds: picked }) : null),
    [issues, pagesScanned, currency, picked],
  );

  const toggle = useCallback(
    (id: string) => {
      const prev = selected;
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];
      setSelected(next);
      const title = titles.get(id) ?? id;
      if (has) {
        setAnnouncement(auditQuoteCopy.trayRemoved(title, next.length));
      } else {
        const q = buildQuote({ issues, pagesScanned, currency, selectedIssueIds: next });
        setAnnouncement(auditQuoteCopy.trayAdded(title, next.length, q.totalText));
      }
    },
    [selected, titles, issues, pagesScanned, currency],
  );

  const clear = useCallback(() => {
    setSelected([]);
    setAnnouncement(auditQuoteCopy.trayCleared);
  }, []);

  const value = useMemo<QuoteState>(
    () => ({
      currency,
      setCurrency,
      quote,
      selected: picked,
      isSelected: (id) => picked.includes(id),
      toggle,
      clear,
      selectionQuote,
      titleOf,
      audit,
      sample,
    }),
    [currency, quote, picked, toggle, clear, selectionQuote, titleOf, audit, sample],
  );

  return (
    <QuoteContext.Provider value={value}>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      {children}
    </QuoteContext.Provider>
  );
}
