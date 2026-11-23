import type { Service } from "@/content/types";
import { serviceCardCta } from "@/content/services";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { PriceText } from "./PriceText";

/**
 * One service on /services (T026): no card chrome and no icon tile; a ruled block
 * on paper. Name, tagline and price on the left; description, deliverables (bare
 * check marks) and "Who it's for" (a native disclosure) on the right from xl.
 * One quiet action per service (serviceCardCta, "Order this", secondary); the free audit is in
 * the nav, hero and closing band. The section id is the slug (anchors from home,
 * footer and the in-page nav); html scroll-padding clears the floating nav.
 */
export function ServiceBlock({ service, index }: { service: Service; index: number }) {
  const titleId = `${service.slug}-title`;
  return (
    <section
      id={service.slug}
      aria-labelledby={titleId}
      className="grid gap-8 border-t border-ink pt-8 sm:pt-10 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:gap-12"
    >
      <div className="min-w-0">
        <span aria-hidden className="font-serif text-title leading-none text-muted tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h2 id={titleId} className="mt-4 font-serif text-display-sm text-balance text-ink">
          {service.name}
        </h2>
        <p className="mt-3 max-w-[40ch] text-[1.0625rem] leading-snug font-medium text-pretty text-ink-2">{service.tagline}</p>
        <p className="mt-6 border-t border-line pt-4">
          <span className="block text-xs tracking-[0.08em] text-muted uppercase">Price</span>
          {/^(From\s+)?[$₹]/.test(service.priceFrom.trim()) ? (
            <PriceText value={service.priceFrom} className="mt-1 block font-serif text-title-lg text-ink" />
          ) : (
            // e.g. "Included in the Full audit · $39": a quiet line, not the large figure
            <PriceText value={service.priceFrom} className="mt-1 block text-[0.9375rem] font-medium text-ink-2" />
          )}
        </p>
        <div className="mt-6">
          <Button href={`/contact?service=${service.slug}`} variant="secondary">
            {serviceCardCta.label}
            <span className="sr-only">{serviceCardCta.srSuffix(service.name)}</span>
          </Button>
        </div>
      </div>

      <div className="min-w-0">
        <p className="max-w-[66ch] text-[1.0625rem] leading-relaxed text-pretty text-muted">
          <PlaceholderText value={service.description} />
        </p>
        <h3 className="mt-8 border-t border-line pt-5 text-kicker font-semibold text-muted uppercase">What you get</h3>
        <ul className="mt-4 grid gap-2.5">
          {service.deliverables.map((d) => (
            <li key={d} className="flex gap-3 text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
              <Icon name="check" size={16} strokeWidth={2} className="mt-1 shrink-0 text-ink-2" />
              <PlaceholderText value={d} />
            </li>
          ))}
        </ul>
        <details className="group/who mt-6 border-t border-line pt-4">
          <summary className="inline-flex cursor-pointer items-center gap-2 rounded-sm text-kicker font-semibold text-muted uppercase hover:text-ink">
            Who it&rsquo;s for
            <span aria-hidden className="transition-transform duration-200 group-open/who:rotate-90">
              ›
            </span>
          </summary>
          <p className="mt-3 max-w-[66ch] text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
            <PlaceholderText value={service.forWho} />
          </p>
        </details>
      </div>
    </section>
  );
}
