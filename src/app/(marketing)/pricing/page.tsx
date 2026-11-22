import {
  currencyLabels,
  pricingClosing,
  pricingFaq,
  pricingHighlightLabel,
  pricingIndiaComparison,
  pricingIndiaExtras,
  pricingIndiaHeading,
  pricingIndiaNotes,
  pricingNote,
  pricingNoteInr,
  pricingOrderSteps,
  pricingPage,
  pricingTaxNote,
  pricingTiers,
  pricingTiersInr,
} from "@/content/pricing";
import { JsonLd, faqLd, innerPageLd, lastUpdated, offerCatalogLd, pageMetadata } from "@/lib/seo";
import { SectionTear } from "@/components/collage/SectionTear";
import { ClosingCta } from "@/components/pages/ClosingCta";
import { CurrencySwitch } from "@/components/pages/CurrencySwitch";
import { IndiaPricingExtras } from "@/components/pages/IndiaPricingExtras";
import { PageHero } from "@/components/pages/PageHero";
import { PricingCard } from "@/components/pages/PricingCard";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata = pageMetadata.pricing;

export default function PricingPage() {
  const u = lastUpdated();
  const faq = faqLd(pricingFaq);
  const hasFaqLd = Array.isArray(faq.mainEntity) && faq.mainEntity.length > 0;

  return (
    <>
      <JsonLd
        data={[
          ...innerPageLd({ name: "Pricing", description: pricingPage.metaDescription, path: "/pricing" }),
          offerCatalogLd(pricingTiers),
          ...(hasFaqLd ? [faq] : []),
        ]}
      />
      <PageHero
        kicker={pricingPage.kicker}
        title={pricingPage.title}
        intro={pricingPage.intro}
        motif="marble"
        seed={31}
        updated={u}
      >
        <Button href={pricingClosing.primaryCta.href} size="lg" icon="arrow-right">
          {pricingClosing.primaryCta.label}
        </Button>
        <Button href={pricingClosing.secondaryCta.href} size="lg" variant="secondary">
          {pricingClosing.secondaryCta.label}
        </Button>
      </PageHero>

      <section aria-labelledby="plans-title" className="pt-16 pb-20 sm:pt-20 sm:pb-28">
        <Container>
          <h2 id="plans-title" className="sr-only">
            Plans and prices
          </h2>
          <CurrencySwitch
            label={currencyLabels.switchLabel}
            intro={currencyLabels.intro}
            labels={{ usd: currencyLabels.usd, inr: currencyLabels.inr }}
            panels={{
              usd: (
                <>
                  <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-4">
                    {pricingTiers.map((tier, i) => (
                      <li key={tier.name} className="min-w-0">
                        <Reveal delay={i * 80} className="h-full">
                          <PricingCard tier={tier} highlightLabel={pricingHighlightLabel} />
                        </Reveal>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-10 flex flex-col gap-5 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-2xl text-[0.9375rem] leading-relaxed text-pretty text-muted">
                      <p>
                        <PlaceholderText value={pricingNote} />
                      </p>
                      <p className="mt-2 font-medium text-ink-2">{pricingTaxNote}</p>
                    </div>
                    <Button href="/services" variant="link" icon="arrow-right" className="self-start md:self-auto">
                      See every service in detail
                    </Button>
                  </div>
                </>
              ),
              inr: (
                <>
                  <div className="mb-8 max-w-2xl">
                    <h3 className="text-lg font-semibold tracking-[-0.01em] text-ink">{pricingIndiaHeading.title}</h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-muted">{pricingIndiaHeading.intro}</p>
                  </div>
                  <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-4">
                    {pricingTiersInr.map((tier) => (
                      <li key={tier.name} className="min-w-0">
                        <PricingCard tier={tier} highlightLabel={pricingHighlightLabel} idSuffix="inr" />
                      </li>
                    ))}
                  </ul>
                  <IndiaPricingExtras
                    extras={pricingIndiaExtras}
                    notes={pricingIndiaNotes}
                    comparison={pricingIndiaComparison}
                    note={pricingNoteInr}
                  />
                </>
              ),
            }}
          />
        </Container>
      </section>

      <section aria-labelledby="order-steps-title" className="pb-20 sm:pb-28">
        <Container>
          <div className="border-t border-line pt-10 sm:pt-12">
            <h2 id="order-steps-title" className="font-serif text-display-sm text-ink">
              {pricingOrderSteps.title}
            </h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
              {pricingOrderSteps.steps.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-card bg-white p-5 shadow-[inset_0_0_0_1px_var(--color-line)] sm:p-6"
                >
                  <span aria-hidden className="font-serif text-2xl leading-none text-accent-ink tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-[1.0625rem] font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section aria-labelledby="pricing-faq-title" className="relative">
        <SectionTear color="var(--color-paper)" seed={36} grain />
        <div className="paper-grain bg-paper py-20 sm:py-28">
          <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-20">
            <SectionHeading
              id="pricing-faq-title"
              kicker="FAQ"
              title="Questions about pricing"
              className="lg:sticky lg:top-28 lg:self-start"
            >
              <div className="mt-8">
                <Button href="/contact" variant="secondary" icon="arrow-right">
                  Ask us anything else
                </Button>
              </div>
            </SectionHeading>
            <Accordion items={pricingFaq.map((f) => ({ title: f.q, content: <p><PlaceholderText value={f.a} /></p> }))} />
          </Container>
        </div>
        <SectionTear color="var(--color-paper)" seed={37} flip grain />
      </section>

      <ClosingCta
        title={pricingClosing.title}
        body={pricingClosing.body}
        primaryCta={pricingClosing.primaryCta}
        secondaryCta={pricingClosing.secondaryCta}
        seed={84}
      />
    </>
  );
}
