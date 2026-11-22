import type { Service } from "@/content/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PlaceholderText } from "@/components/ui/PlaceholderText";

const SERVICE_ICONS: Record<string, string> = {
  "seo-audit": "search",
  "geo-audit": "sparkles",
  "technical-fixes": "gauge",
  "content-entity": "file",
  monitoring: "clock",
};

/**
 * One service on /services. The section id is the slug (anchors from home,
 * footer and the in-page nav); html scroll-padding clears the floating nav.
 */
export function ServiceBlock({ service, index }: { service: Service; index: number }) {
  const titleId = `${service.slug}-title`;
  return (
    <section
      id={service.slug}
      aria-labelledby={titleId}
      className="scroll-mt-2 rounded-panel bg-white p-6 shadow-paper sm:p-9 lg:p-10"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-xl bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)]">
          <Icon name={SERVICE_ICONS[service.slug] ?? "sparkles"} size={22} />
        </span>
        <span aria-hidden className="font-serif text-2xl leading-none text-muted tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h2 id={titleId} className="mt-7 font-serif text-display-sm text-balance text-ink">
        {service.name}
      </h2>
      <p className="mt-3 text-lg leading-snug font-medium text-pretty text-ink-2">{service.tagline}</p>

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-12">
        <div className="min-w-0">
          <p className="text-[1rem] leading-relaxed text-pretty text-muted">
            <PlaceholderText value={service.description} />
          </p>
          <div className="mt-8 border-t border-line pt-6">
            <h3 className="text-kicker font-semibold text-muted uppercase">Who it&rsquo;s for</h3>
            <p className="mt-3 text-[1rem] leading-relaxed text-pretty text-ink-2">
              <PlaceholderText value={service.forWho} />
            </p>
          </div>
        </div>

        <div className="paper-grain flex min-w-0 flex-col rounded-card bg-paper p-5 sm:p-7">
          <h3 className="text-kicker font-semibold text-muted uppercase">What you get</h3>
          <ul className="mt-4 grid gap-3">
            {service.deliverables.map((d) => (
              <li key={d} className="flex gap-3 text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-600 text-white">
                  <Icon name="check" size={13} strokeWidth={2.4} />
                </span>
                <PlaceholderText value={d} />
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-7">
            <div className="border-t border-line-strong pt-5">
              <p className="text-sm text-muted">Price</p>
              <p className="mt-1 font-serif text-[1.75rem] leading-tight text-ink">
                <PlaceholderText value={service.priceFrom} />
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href={`/contact?service=${service.slug}`} icon="arrow-right">
                Get a quote<span className="sr-only"> for {service.name}</span>
              </Button>
              <Button href="/audit" variant="secondary">
                Run a free audit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
