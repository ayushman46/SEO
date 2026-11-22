import { home } from "@/content/home";
import { JsonLd, faqLd, lastUpdated, pageMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { FeatureTabs } from "@/components/home/FeatureTabs";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { NightSky } from "@/components/home/NightSky";
import { SampleReport } from "@/components/home/SampleReport";
import {
  Faq,
  HowItWorks,
  PricingTeaser,
  Problem,
  ProofAndEngines,
  ServicesTeaser,
} from "@/components/home/Sections";

export const metadata = pageMetadata.home;

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
      <HowItWorks />
      <SampleReport />
      <ServicesTeaser />
      <PricingTeaser />
      <NightSky />
      <Faq />
      <FinalCta />
      <Container className="-mt-8 pb-10 sm:-mt-14">
        <p className="text-center text-xs text-muted">
          {updated.label} <time dateTime={updated.iso}>{updated.display}</time>
        </p>
      </Container>
    </>
  );
}
