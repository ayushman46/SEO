"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { auditQuoteCopy } from "@/content/audit";
import { QUOTE_TEXT, type Quote, type QuoteCurrency } from "@/lib/quote";
import { buttonClass, type ButtonVariant } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { PriceText } from "@/components/pages/PriceText";
import { Icon } from "@/components/ui/Icon";
import { contactHref, storeQuote, toStoredQuote } from "./handoff";
import type { QuoteState } from "./QuoteContext";

const CURRENCIES: { value: QuoteCurrency; label: string }[] = [
  { value: "USD", label: auditQuoteCopy.currencyUsd },
  { value: "INR", label: auditQuoteCopy.currencyInr },
];

/**
 * USD / India ₹ choice, styled like the /pricing switch but built on native radios:
 * it changes prices across the report, so it is a setting, not a set of tabs.
 * Arrow keys move between the two for free.
 */
export function CurrencyToggle({ q, name, className }: { q: QuoteState; name: string; className?: string }) {
  return (
    <fieldset className={cx("min-w-0", className)}>
      <legend className="sr-only">{auditQuoteCopy.currencyLabel}</legend>
      <div className="inline-flex max-w-full items-center gap-2">
        {CURRENCIES.map((c) => {
          const checked = q.currency === c.value;
          return (
            <label
              key={c.value}
              className={cx(
                "relative inline-flex min-h-10 cursor-pointer items-center rounded-sm px-1.5 text-sm font-medium whitespace-nowrap decoration-accent decoration-2 underline-offset-[6px] transition-colors",
                "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent",
                checked ? "text-ink underline" : "text-muted hover:text-ink",
              )}
            >
              <input
                type="radio"
                name={name}
                value={c.value}
                checked={checked}
                onChange={() => q.setCurrency(c.value)}
                className="sr-only"
              />
              {c.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Total with the tax note always beside it, and the confirm note when the total is not fixed. */
export function QuoteTotal({ quote, compact = false }: { quote: Quote; compact?: boolean }) {
  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cx("text-muted", compact ? "text-xs" : "text-sm")}>{auditQuoteCopy.totalLabel}</span>
        <PriceText value={quote.totalText} className={cx("font-serif leading-none text-ink", compact ? "text-title" : "text-display-sm")} />
        <span className={cx("text-muted", compact ? "text-xs" : "text-sm")}>{QUOTE_TEXT.tax}</span>
      </p>
      {quote.confirmNote ? (
        <p className={cx("mt-2 leading-relaxed text-pretty text-ink-2", compact ? "text-xs" : "text-sm")}>{QUOTE_TEXT.confirm}</p>
      ) : null}
    </div>
  );
}

/**
 * "Request …" link: stores the quote for the contact form, then navigates. The href only carries
 * the service slug, so it still works (without the quote) when storage is blocked.
 * On the sample report it leads to /audit instead.
 */
export function RequestLink({
  q,
  quote,
  children,
  variant = "primary",
  pill = false,
  className,
}: {
  q: QuoteState;
  quote: Quote;
  children: ReactNode;
  variant?: ButtonVariant;
  /** Keep the standard one-line pill shape (to sit beside an ordinary <Button>). */
  pill?: boolean;
  className?: string;
}) {
  const cls = buttonClass({
    variant,
    size: "md",
    className: cx(pill ? undefined : "h-auto! min-h-11 rounded-control! py-2 whitespace-normal! text-center", className),
  });
  if (q.sample) {
    return (
      <Link href="/audit" className={cls}>
        {auditQuoteCopy.sampleRequest}
        <Icon name="arrow-right" size={18} className="shrink-0" />
      </Link>
    );
  }
  return (
    <Link href={contactHref(quote)} className={cls} onClick={() => storeQuote(toStoredQuote(quote, q.audit))}>
      {children}
      <Icon name="arrow-right" size={18} className="shrink-0" />
    </Link>
  );
}
