import type { ContactQuoteField } from "@/app/actions/contact-schema";
import { contactQuoteCopy } from "@/content/contact";
import type { StoredQuote } from "@/components/audit/quote/handoff";
import { buttonClass } from "@/components/ui/Button";
import { PriceText } from "@/components/pages/PriceText";

/** Hidden quote fields; the names are checked against the server's CONTACT_QUOTE_FIELDS by type. */
export function quoteFields(q: StoredQuote): Record<ContactQuoteField, string> {
  return { ...q.orderFields, audit_id: q.audit_id, audit_url: q.audit_url };
}

/** Read-only "Your quote" box above the form, with a way to send the message without it. */
export function QuoteSummary({ quote, onRemove }: { quote: StoredQuote; onRemove: () => void }) {
  const s = quote.summary;
  return (
    <section
      aria-labelledby="contact-quote-title"
      className="mb-8 rounded-card bg-paper p-4 shadow-[inset_0_0_0_1px_var(--color-line)] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="contact-quote-title" className="font-serif text-title text-balance text-ink">
            {contactQuoteCopy.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-pretty text-muted [overflow-wrap:anywhere]">
            {contactQuoteCopy.intro(s.site)}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className={buttonClass({ variant: "secondary", size: "sm", className: "shrink-0" })}
        >
          {contactQuoteCopy.remove}
        </button>
      </div>
      <ul className="mt-4 divide-y divide-line border-y border-line text-[0.9375rem]">
        {s.lines.map((l, i) => (
          <li key={i} className="flex items-baseline justify-between gap-4 py-2.5">
            <span className="min-w-0 text-ink-2">
              {l.label}
              {l.covers.length ? (
                <span className="block text-xs text-muted [overflow-wrap:anywhere]">
                  {l.covers.join("; ")}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 font-medium text-ink tabular-nums"><PriceText value={l.priceText} /></span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm text-muted">{contactQuoteCopy.totalLabel}</span>
        <span className="font-serif text-title-lg leading-none text-ink tabular-nums">
          <PriceText value={s.totalText} />
        </span>
      </p>
      {s.notes.map((n, i) => (
        <p key={i} className="mt-2 text-sm leading-relaxed text-pretty text-ink-2">
          {n}
        </p>
      ))}
    </section>
  );
}

/**
 * The quote carried over from the audit report: the read-only summary plus the hidden fields the
 * contact action reads. Rendering it with no quote renders nothing, so "Remove quote" (which
 * clears the stored quote) also removes every hidden field.
 */
export function QuoteAttachment({ quote, onRemove }: { quote: StoredQuote | null; onRemove: () => void }) {
  if (!quote) return null;
  return (
    <>
      <QuoteSummary quote={quote} onRemove={onRemove} />
      {Object.entries(quoteFields(quote)).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}
