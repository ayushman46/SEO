import Link from "next/link";
import * as homeContent from "@/content/home";
import * as siteContent from "@/content/site";
import { services } from "@/content/services";
import { PriceText } from "@/components/pages/PriceText";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EngineStrip } from "@/components/ui/EngineStrip";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";

/*
 * Home sections after the hero (T026). Openers vary on purpose (never more than two
 * kicker + heading + paragraph stacks in a row): Problem has no kicker, Services is a
 * heading and a ruled index, FAQ is a heading only. Paper sections on white meet it
 * with a straight hairline; torn edges are kept for the hero, night sky and footer.
 */

const { home } = homeContent;
/** Optional source for the problem statistic (content-seo). */
const problemSource = (homeContent as { homeProblemSource?: { label: string; href: string } }).homeProblemSource;

/* ---------- Engines ---------- */

/** Content-seo's heading for the strip; falls back while the export is being added. */
const enginesHeading: string =
  (siteContent as { enginesHeading?: string }).enginesHeading ?? "We check your site against what these engines need";

export function ProofAndEngines() {
  return (
    <section aria-label={enginesHeading} className="pt-16 pb-4 sm:pt-20">
      <Container>
        <EngineStrip
          label={enginesHeading}
          engines={siteContent.site.enginesTracked}
          disclaimer={siteContent.enginesDisclaimer}
        />
      </Container>
    </section>
  );
}

/* ---------- Problem ---------- */

export function Problem() {
  const { problem } = home;
  return (
    <section aria-labelledby="problem-title" className="mt-16 border-t border-line-strong sm:mt-20">
      <div className="paper-grain bg-paper py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <SectionHeading
            id="problem-title"
            title={problem.title}
            body={problem.body}
            size="lg"
            className="lg:sticky lg:top-28 lg:self-start"
          >
            {problemSource ? (
              <p className="mt-4 text-xs text-muted">
                Source:{" "}
                <a
                  href={problemSource.href}
                  rel="noopener noreferrer"
                  className="rounded-sm underline decoration-ink/25 underline-offset-4 hover:text-ink hover:decoration-ink"
                >
                  {problemSource.label}
                </a>
              </p>
            ) : null}
          </SectionHeading>
          <ol className="border-b border-ink">
            {problem.points.map((point, i) => (
              <li
                key={point.title}
                className="grid gap-x-6 gap-y-2 border-t border-ink py-6 sm:grid-cols-[2.5rem_minmax(0,0.9fr)_minmax(0,1.1fr)] sm:py-7"
              >
                <span aria-hidden className="font-serif text-title leading-none text-muted tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-title-lg text-balance text-ink">{point.title}</h3>
                <p className="max-w-[60ch] text-[0.9375rem] leading-relaxed text-pretty text-muted">{point.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </div>
    </section>
  );
}

/* ---------- Services index ---------- */

/** Leading price token: "$49", "From $199", "₹2,999/month", "$29/month". */
const PRICE_TOKEN = /^(From\s+)?[$₹][\d,]+(?:\.\d+)?(\/month)?/;

function splitPrice(value: string) {
  const v = value.trim();
  const m = PRICE_TOKEN.exec(v);
  // no leading price (e.g. "Included in the Full audit · $39"): a quiet line, not a figure
  if (!m) return { prefix: "", amount: "", qualifier: v };
  const prefix = m[1] ? m[1].trim() : "";
  return { prefix, amount: m[0].slice(m[1]?.length ?? 0), qualifier: v.slice(m[0].length).trim() };
}

/**
 * Ruled index of every service (T026, finding 10): number, serif name with the
 * tagline from sm, price on the right in a fixed tabular column. The whole row
 * is the link. Any count works: no grid spans, no orphans.
 */
export function ServicesTeaser() {
  const { servicesTeaser } = home;
  return (
    <section aria-labelledby="services-title" className="border-t border-line-strong">
      <div className="paper-grain bg-paper py-20 sm:py-28">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading id="services-title" kicker={servicesTeaser.kicker} title={servicesTeaser.title} />
            <Button href="/services" variant="secondary" className="self-start lg:self-auto">
              All services
            </Button>
          </div>
          <ol className="mt-12 border-b border-line">
            {services.map((service, i) => {
              const price = splitPrice(service.priceFrom);
              return (
                <li key={service.slug}>
                  <Link
                    href={`/services#${service.slug}`}
                    className="group grid grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-t border-line py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:py-6"
                  >
                    <span aria-hidden className="font-serif text-title leading-none text-muted tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-baseline gap-2 font-serif text-title-lg text-ink transition-colors group-hover:text-accent-ink">
                        {service.name}
                        <Icon
                          name="arrow-up-right"
                          size={16}
                          className="shrink-0 self-center text-muted transition-colors group-hover:text-accent-ink"
                        />
                      </span>
                      <span className="mt-1 hidden max-w-[60ch] text-[0.9375rem] leading-relaxed text-pretty text-muted sm:block">
                        {service.tagline}
                      </span>
                    </span>
                    <span className="col-start-2 flex flex-col sm:col-start-3 sm:items-end sm:text-right">
                      {price.prefix ? <span className="text-xs tracking-[0.08em] text-muted uppercase">{price.prefix}</span> : null}
                      {price.amount ? (
                        <PriceText value={price.amount} className="min-w-[5ch] text-[1.0625rem] font-semibold whitespace-nowrap text-ink" />
                      ) : null}
                      {price.qualifier ? (
                        <span className="max-w-[22ch] text-xs leading-snug text-pretty text-muted">{price.qualifier}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </Container>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="py-14 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-20">
        <SectionHeading
          id="faq-title"
          title="Questions, answered plainly"
          className="lg:sticky lg:top-28 lg:self-start"
        />
        <Accordion visible={6} items={home.faq.map((f) => ({ title: f.q, content: <p>{f.a}</p> }))} />
      </Container>
    </section>
  );
}
