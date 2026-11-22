import {
  pricingClosing,
  pricingFaq,
  pricingHighlightLabel,
  pricingNote,
  pricingPage,
  pricingTiers,
} from "@/content/pricing";
import { JsonLd, faqLd, innerPageLd, lastUpdated, offerCatalogLd, pageMetadata } from "@/lib/seo";
import { SectionTear } from "@/components/collage/SectionTear";
import { ClosingCta } from "@/components/pages/ClosingCta";
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
            <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-pretty text-muted">
              <PlaceholderText value={pricingNote} />
            </p>
            <Button href="/services" variant="link" icon="arrow-right" className="self-start md:self-auto">
              See every service in detail
            </Button>
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
