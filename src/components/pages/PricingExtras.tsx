import type { ReactNode } from "react";
import Link from "next/link";
import type { PriceExtra } from "@/content/types";
import { Icon } from "@/components/ui/Icon";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { PriceText } from "./PriceText";

/**
 * The services that are not pricing tiers, with the notes for that price set, shown under a
 * tier grid on /pricing: "Other services" in the USD panel, "India extras" in the INR panel.
 * Notes, their heading and the comparison are optional (the USD panel has only the note and
 * the tax line). `idPrefix` keeps heading ids unique: both panels are in the HTML.
 * Server component: all text is in the HTML.
 */
export function PricingExtras({
  idPrefix,
  heading,
  extras,
  notesHeading,
  notes,
  comparison,
  note,
  taxNote,
}: {
  idPrefix: string;
  heading: string;
  extras: readonly PriceExtra[];
  notesHeading?: string;
  notes?: readonly string[];
  comparison?: { text: string; source: { label: string; href: string } };
  note: string;
  /** Set in ink under the note (the USD panel; the INR intro already states tax). */
  taxNote?: string;
}) {
  const notesTitleId = `${idPrefix}-notes-title`;
  const notesBody: ReactNode = (
    <>
      {notes?.length ? (
        <ul className="mt-6 grid gap-3">
          {notes.map((n) => (
            <li key={n} className="flex gap-3 text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
              <Icon name="check" size={16} strokeWidth={2} className="mt-1 shrink-0 text-ink-2" />
              <PlaceholderText value={n} />
            </li>
          ))}
        </ul>
      ) : null}
      <p className={notesHeading || notes?.length ? "mt-6 text-[0.9375rem] leading-relaxed text-pretty text-muted" : "text-[0.9375rem] leading-relaxed text-pretty text-muted lg:pt-2"}>
        <PlaceholderText value={note} />
      </p>
      {taxNote ? <p className="mt-3 text-[0.9375rem] leading-relaxed font-medium text-pretty text-ink-2">{taxNote}</p> : null}
      {comparison ? (
        <p className="mt-4 border-l-2 border-line-strong pl-4 text-sm leading-relaxed text-pretty text-muted">
          {comparison.text}{" "}
          <a
            href={comparison.source.href}
            rel="noopener noreferrer"
            className="rounded-sm text-accent-ink underline decoration-accent-ink/30 underline-offset-[4px] hover:decoration-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Source: {comparison.source.label}
          </a>
        </p>
      ) : null}
    </>
  );

  return (
    <div className="grid gap-10 border-t border-line-strong px-5 py-8 sm:px-7 sm:py-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
      <section aria-labelledby={`${idPrefix}-title`} className="min-w-0">
        <h3 id={`${idPrefix}-title`} className="font-serif text-display-sm text-balance text-ink">
          {heading}
        </h3>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {extras.map((x) => (
            <li key={x.name} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <h4 className="text-base font-semibold tracking-[-0.01em] text-ink">
                  <Link
                    href={x.href}
                    className="rounded-sm underline decoration-ink/20 underline-offset-[5px] hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent"
                  >
                    {x.name}
                  </Link>
                </h4>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-pretty text-muted">
                  <PlaceholderText value={x.description} />
                </p>
              </div>
              <p className="min-w-[6ch] shrink-0 text-[0.9375rem] font-semibold text-ink tabular-nums sm:pt-0.5 sm:text-right">
                <PriceText value={x.price} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      {notesHeading ? (
        <section aria-labelledby={notesTitleId} className="min-w-0">
          <h3 id={notesTitleId} className="font-serif text-display-sm text-balance text-ink">
            {notesHeading}
          </h3>
          {notesBody}
        </section>
      ) : (
        <div className="min-w-0 max-w-[60ch]">{notesBody}</div>
      )}
    </div>
  );
}
