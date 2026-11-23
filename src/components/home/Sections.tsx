import Link from "next/link";
import * as homeContent from "@/content/home";
import { enginesDisclaimer, enginesHeading, site } from "@/content/site";
import { services } from "@/content/services";
import { pricingTiers } from "@/content/pricing";
import { SectionTear } from "@/components/collage/SectionTear";
import { PriceText, QualifiedPriceText } from "@/components/pages/PriceText";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { cx } from "@/components/ui/cx";
import { EngineStrip } from "@/components/ui/EngineStrip";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/*
 * Home sections after the hero, in the v1.1 layout (restored in T033, founder
 * decision): proof line, engine marquee, problem cards, how it works, services
 * cards, pricing teaser, FAQ. Paper sections meet the white page with torn edges.
 * Kept from later rounds: the honest engine heading, current copy and prices,
 * the problem statistic's source link.
 */

const { home } = homeContent;
const problemSource = homeContent.homeProblemSource;

/* ---------- Proof line + engines ---------- */

export function ProofAndEngines() {
  return (
    <section aria-label={enginesHeading} className="pt-20 pb-6 sm:pt-28">
      <Container>
        <div className="flex items-center gap-4 sm:gap-6">
          <span aria-hidden className="h-px min-w-6 flex-1 bg-line-strong" />
          <p className="max-w-xl text-center text-sm leading-relaxed text-balance text-muted sm:text-[0.9375rem]">
            {home.proofLine}
          </p>
          <span aria-hidden className="h-px min-w-6 flex-1 bg-line-strong" />
        </div>
        <EngineStrip
          label={enginesHeading}
          labelStyle="kicker"
          marquee="always"
          engines={site.enginesTracked}
          disclaimer={enginesDisclaimer}
          className="mt-14"
        />
      </Container>
    </section>
  );
}

/* ---------- Problem ---------- */

export function Problem() {
  const { problem } = home;
  return (
    <section aria-labelledby="problem-title" className="relative mt-20 sm:mt-28">
      <SectionTear color="var(--color-paper)" seed={4} grain />
      <div className="paper-grain bg-paper py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              id="problem-title"
              kicker={problem.kicker}
              title={problem.title}
              body={problem.body}
              measure="wide"
            >
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
            </SectionHeading>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2">
            {problem.points.map((point, i) => (
              <li key={point.title}>
                <Reveal delay={i * 90} className="h-full">
                  <div className="h-full rounded-card bg-white p-6 shadow-paper sm:p-7">
                    <span className="grid size-11 place-items-center rounded-xl bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)]">
                      <Icon name={point.icon} size={22} />
                    </span>
                    <h3 className="mt-6 font-serif text-[1.625rem] leading-[1.1] text-balance text-ink">
                      {point.title}
                    </h3>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-pretty text-muted">
                      {point.body}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </div>
      <SectionTear color="var(--color-paper)" seed={8} flip grain />
    </section>
  );
}

/* ---------- How it works ---------- */

export function HowItWorks() {
  const { howItWorks } = home;
  return (
    <section aria-labelledby="how-title" className="py-24 sm:py-32">
      <Container>
        <SectionHeading id="how-title" kicker={howItWorks.kicker} title={howItWorks.title} align="center" />
        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {howItWorks.steps.map((step, i) => (
            <li key={step.title}>
              <Reveal delay={i * 120}>
                <div className="relative border-t border-ink pt-6">
                  <span aria-hidden className="absolute -top-[5px] left-0 size-2.5 rounded-full bg-accent" />
                  {/* decorative numeral via pseudo-element: not read out, not contrast-checked */}
                  <span
                    aria-hidden
                    data-n={String(i + 1).padStart(2, "0")}
                    className="block font-serif text-[4.5rem] leading-none text-ink/15 tabular-nums before:content-[attr(data-n)]"
                  />
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.01em] text-ink">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-[0.9875rem] leading-relaxed text-pretty text-muted">{step.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- Services teaser ---------- */

/** Leading price token: "$39", "From $99", "₹999/month", "$19/month". */
const PRICE_TOKEN = /^(From\s+)?[$₹][\d,]+(?:\.\d+)?(\/month)?/;

/**
 * "$99 per location" -> the amount ("$99") on one unbreakable line and any
 * qualifier on its own muted line beneath, so price strings never wrap
 * mid-phrase. A line without a leading price ("Included in the Full audit · $39")
 * is set whole, with its trailing price kept on the last word's line.
 */
function PriceLine({ value }: { value: string }) {
  const v = value.trim();
  const m = PRICE_TOKEN.exec(v);
  const qualifier = m ? v.slice(m[0].length).trim() : "";
  return (
    <span className="mt-auto block pt-6">
      <span className="flex flex-col gap-1.5 border-t border-line pt-5">
        {m ? (
          <PriceText
            value={m[0]}
            className="text-[1.0625rem] leading-tight font-semibold whitespace-nowrap text-ink"
          />
        ) : (
          <QualifiedPriceText
            value={v}
            className="text-[0.9375rem] leading-snug font-semibold text-pretty text-ink"
          />
        )}
        {qualifier ? <span className="text-[0.8125rem] leading-snug text-pretty text-muted">{qualifier}</span> : null}
      </span>
    </span>
  );
}

/**
 * v1.1 service cards. Eight services: one column on phones, two from md, four
 * from xl (two even rows, no orphan).
 */
export function ServicesTeaser() {
  const { servicesTeaser } = home;
  return (
    <section aria-labelledby="services-title" className="relative">
      <SectionTear color="var(--color-paper)" seed={15} grain />
      <div className="paper-grain bg-paper py-20 sm:py-28">
        <Container>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              id="services-title"
              kicker={servicesTeaser.kicker}
              title={servicesTeaser.title}
              body={servicesTeaser.body}
              measure="wide"
            />
            <Button href="/services" variant="secondary" icon="arrow-right" className="self-start lg:self-auto">
              All services
            </Button>
          </div>
          <ul className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service, i) => (
              <li key={service.slug}>
                <Reveal delay={(i % 4) * 90} className="h-full">
                  <Link
                    href={`/services#${service.slug}`}
                    className="group flex h-full flex-col rounded-card bg-white p-6 shadow-paper transition-[box-shadow,transform] duration-300 ease-(--ease-paper) hover:-translate-y-0.5 hover:shadow-float sm:p-7"
                  >
                    <span className="flex items-center justify-between">
                      <span aria-hidden className="font-serif text-lg text-muted tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="grid size-9 place-items-center rounded-full bg-paper text-ink transition-colors group-hover:bg-accent-600 group-hover:text-white">
                        <Icon name="arrow-up-right" size={18} />
                      </span>
                    </span>
                    <span className="mt-8 font-serif text-[2rem] leading-[1.05] text-balance text-ink">
                      {service.name}
                    </span>
                    <span className="mt-3 text-[0.9375rem] leading-relaxed text-pretty text-muted">
                      {service.tagline}
                    </span>
                    <PriceLine value={service.priceFrom} />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </div>
      <SectionTear color="var(--color-paper)" seed={16} flip grain />
    </section>
  );
}

/* ---------- Pricing teaser ---------- */

export function PricingTeaser() {
  const { pricingTeaser } = home;
  return (
    <section aria-labelledby="pricing-title" className="py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-20">
        <SectionHeading
          id="pricing-title"
          kicker={pricingTeaser.kicker}
          title={pricingTeaser.title}
          body={pricingTeaser.body}
          measure="wide"
        >
          <div className="mt-8">
            <Button href={pricingTeaser.cta.href} icon="arrow-right">
              {pricingTeaser.cta.label}
            </Button>
          </div>
        </SectionHeading>
        <Reveal>
          <ul className="overflow-hidden rounded-panel bg-white shadow-[inset_0_0_0_1px_var(--color-line)]">
            {pricingTiers.map((tier) => {
              const highlighted = "highlighted" in tier && tier.highlighted;
              return (
                <li
                  key={tier.name}
                  className={cx(
                    "relative flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-6 py-5 last:border-b-0 sm:px-8 sm:py-6",
                    highlighted && "bg-accent-soft/50",
                  )}
                >
                  {highlighted ? <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent" /> : null}
                  <div className="min-w-0">
                    <h3 className="font-serif text-[1.75rem] leading-none text-ink">{tier.name}</h3>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-pretty text-muted">{tier.description}</p>
                  </div>
                  <p className="shrink-0 text-right">
                    <PriceText value={tier.price} className="font-serif text-[2rem] leading-none text-ink" />
                    <span className="ml-1.5 text-sm text-muted">{tier.cadence}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}

/* ---------- FAQ ---------- */

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-20">
        <SectionHeading
          id="faq-title"
          kicker="FAQ"
          title={homeContent.homeFaqHeading}
          className="lg:sticky lg:top-28 lg:self-start"
        />
        <Accordion marker="circle" items={home.faq.map((f) => ({ title: f.q, content: <p>{f.a}</p> }))} />
      </Container>
    </section>
  );
}
