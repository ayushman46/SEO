import type { PriceExtra } from "@/content/types";
import { Icon } from "@/components/ui/Icon";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { PriceText } from "./PriceText";
import Link from "next/link";

/**
 * Rupee add-ons and India notes, shown under the INR tier grid on /pricing.
 * Server component: all text is in the HTML.
 */
export function IndiaPricingExtras({
  extras,
  notes,
  comparison,
  note,
}: {
  extras: readonly PriceExtra[];
  notes: readonly string[];
  comparison: { text: string; source: { label: string; href: string } };
  note: string;
}) {
  return (
    <div className="mt-12 grid gap-10 border-t border-line pt-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
      <section aria-labelledby="india-extras-title" className="min-w-0">
        <h3 id="india-extras-title" className="font-serif text-[2rem] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[2.25rem]">
          India extras
        </h3>
        <ul className="mt-6 divide-y divide-line rounded-panel bg-white shadow-[inset_0_0_0_1px_var(--color-line)]">
          {extras.map((x) => (
            <li key={x.name} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-6">
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
              <p className="shrink-0 text-[0.9375rem] font-semibold text-ink sm:pt-0.5 sm:text-right">
                <PriceText value={x.price} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="india-notes-title" className="min-w-0">
        <h3 id="india-notes-title" className="font-serif text-[2rem] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[2.25rem]">
          Paying from India
        </h3>
        <ul className="mt-6 grid gap-3">
          {notes.map((n) => (
            <li key={n} className="flex gap-3 text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-600 text-white">
                <Icon name="check" size={13} strokeWidth={2.4} />
              </span>
              <PlaceholderText value={n} />
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[0.9375rem] leading-relaxed text-pretty text-muted">
          <PlaceholderText value={note} />
        </p>
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
      </section>
    </div>
  );
}
