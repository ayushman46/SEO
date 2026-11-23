import { home } from "@/content/home";
import { JsonLd, faqLd, lastUpdated, pageMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { FeatureTabs } from "@/components/home/FeatureTabs";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { NightSky } from "@/components/home/NightSky";
import { SampleReport } from "@/components/home/SampleReport";
import { Faq, Problem, ProofAndEngines, ServicesTeaser } from "@/components/home/Sections";

export const metadata = pageMetadata.home;

/**
 * Nine sections (T026): the night sky moves up to be the change of pace after the
 * feature tabs; "how it works" lives in the sample-report column; the pricing
 * teaser is gone (every service row shows its price; Pricing is in the nav).
 */
export default function HomePage() {
  const updated = lastUpdated();
  return (
    <>
      {/* Organization + WebSite JSON-LD come from the root layout. */}
      <JsonLd data={faqLd(home.faq)} />
      <Hero />
      <ProofAndEngines />
      <Problem />
      <FeatureTabs />
      <NightSky />
      <SampleReport />
      <ServicesTeaser />
      <Faq />
      <FinalCta />
      <Container className="pb-10">
        <p className="text-center text-xs text-muted">
          {updated.label} <time dateTime={updated.iso}>{updated.display}</time>
        </p>
      </Container>
    </>
  );
}
