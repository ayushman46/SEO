import {
  currencyLabels,
  pricingClosing,
  pricingExtrasHeading,
  pricingExtrasUsd,
  pricingFaq,
  pricingFaqHeading,
  pricingHighlightLabel,
  pricingIndiaComparison,
  pricingIndiaExtras,
  pricingIndiaHeading,
  pricingIndiaNotes,
  pricingNote,
  pricingNoteInr,
  pricingOrderSteps,
  pricingPage,
  pricingRateCardHeader,
  pricingServicesLink,
  pricingTaxNote,
  pricingTiers,
  pricingTiersInr,
} from "@/content/pricing";
import { JsonLd, faqLd, innerPageLd, lastUpdated, offerCatalogLd, pageMetadata } from "@/lib/seo";
import { SectionTear } from "@/components/collage/SectionTear";
import { ClosingCta } from "@/components/pages/ClosingCta";
import { CurrencySwitch } from "@/components/pages/CurrencySwitch";
import { PricingExtras } from "@/components/pages/PricingExtras";
import { PageHero } from "@/components/pages/PageHero";
import { PricingCard } from "@/components/pages/PricingCard";
import type { PricingTier } from "@/content/types";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Steps } from "@/components/ui/Steps";

export const metadata = pageMetadata.pricing;

/** The ruled columns of the rate card: one cell per tier, rules drawn between cells at every width. */
function RateSheet({ tiers, idSuffix }: { tiers: readonly PricingTier[]; idSuffix?: string }) {
  return (
    <ul className="grid md:grid-cols-2 xl:grid-cols-4">
      {tiers.map((tier) => (
        <li
          key={tier.name}
          className="min-w-0 border-t border-line-strong first:border-t-0 md:row-span-5 md:grid md:grid-rows-subgrid md:odd:border-r md:nth-2:border-t-0 xl:border-t-0 xl:border-r xl:last:border-r-0"
        >
          <PricingCard tier={tier} highlightLabel={pricingHighlightLabel} idSuffix={idSuffix} />
        </li>
      ))}
    </ul>
  );
}

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
        motif="hands-gap"
        seed={31}
        compact
        updated={u}
      />

      {/* Signature moment 3 (T026): the rate card. One ruled paper sheet under a torn
          edge, every tier on one baseline, a text currency choice in its header strip,
          quiet links per tier and one primary action under the sheet. No animation. */}
      <section aria-labelledby="plans-title" className="pt-10 pb-16 sm:pt-14 sm:pb-24">
        <Container>
          <h2 id="plans-title" className="sr-only">
            Plans and prices
          </h2>
          <SectionTear color="var(--color-paper)" seed={33} grain />
          <CurrencySwitch
            variant="text"
            heading={
              <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span>{pricingRateCardHeader.label}</span>
                <span className="flex flex-col gap-0.5 text-sm font-medium tracking-normal text-ink-2 normal-case">
                  {pricingRateCardHeader.lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              </span>
            }
            label={currencyLabels.switchLabel}
            intro={currencyLabels.intro}
            labels={{ usd: currencyLabels.usd, inr: currencyLabels.inr }}
            className="paper-grain rounded-b-panel bg-paper shadow-[0_1px_0_var(--color-line-strong)]"
            panels={{
              usd: (
                <>
                  <RateSheet tiers={pricingTiers} />
                  <PricingExtras
                    idPrefix="usd-extras"
                    heading={pricingExtrasHeading}
                    extras={pricingExtrasUsd}
                    note={pricingNote}
                    taxNote={pricingTaxNote}
                  />
                </>
              ),
              inr: (
                <>
                  <div className="max-w-2xl px-5 pt-6 sm:px-7">
                    <h3 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">{pricingIndiaHeading.title}</h3>
                    <p className="mt-1.5 max-w-[60ch] text-[0.9375rem] leading-relaxed text-pretty text-muted">{pricingIndiaHeading.intro}</p>
                  </div>
                  <RateSheet tiers={pricingTiersInr} idSuffix="inr" />
                  <PricingExtras
                    idPrefix="india-extras"
                    heading="India extras"
                    extras={pricingIndiaExtras}
                    notesHeading="Paying from India"
                    notes={pricingIndiaNotes}
                    comparison={pricingIndiaComparison}
                    note={pricingNoteInr}
                  />
                </>
              ),
            }}
          />
          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-end">
            <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center">
              <Button href={pricingServicesLink.href} variant="link">
                {pricingServicesLink.label}
              </Button>
              <Button href={pricingClosing.secondaryCta.href} size="lg" icon="arrow-right">
                {pricingClosing.secondaryCta.label}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="order-steps-title" className="pb-16 sm:pb-24">
        <Container>
          <h2 id="order-steps-title" className="font-serif text-display-sm text-balance text-ink">
            {pricingOrderSteps.title}
          </h2>
          <Steps steps={pricingOrderSteps.steps} className="mt-8" />
        </Container>
      </section>

      <section aria-labelledby="pricing-faq-title" className="border-t border-line-strong">
        <div className="paper-grain bg-paper py-16 sm:py-24">
          <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-20">
            <SectionHeading
              id="pricing-faq-title"
              kicker={pricingFaqHeading.kicker}
              title={pricingFaqHeading.title}
              className="lg:sticky lg:top-28 lg:self-start"
            >
              <div className="mt-8">
                <Button href={pricingFaqHeading.cta.href} variant="secondary">
                  {pricingFaqHeading.cta.label}
                </Button>
              </div>
            </SectionHeading>
            <Accordion marker="circle" visible={6} items={pricingFaq.map((f) => ({ title: f.q, content: <p><PlaceholderText value={f.a} /></p> }))} />
          </Container>
        </div>
      </section>

      <ClosingCta
        title={pricingClosing.title}
        body={pricingClosing.body}
        primaryCta={pricingClosing.primaryCta}
        secondaryCta={pricingClosing.secondaryCta}
      />
    </>
  );
}
