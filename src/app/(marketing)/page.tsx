import { home } from "@/content/home";
import { JsonLd, faqLd, organizationLd, pageMetadata, websiteLd } from "@/lib/seo";
import { FeatureTabs } from "@/components/home/FeatureTabs";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { NightSky } from "@/components/home/NightSky";
import { SampleReport } from "@/components/home/SampleReport";
import { Faq, HowItWorks, PricingTeaser, Problem, ProofAndEngines, ServicesTeaser } from "@/components/home/Sections";

export const metadata = pageMetadata.home;

export default function HomePage() {
  return (
    <>
      <JsonLd data={[organizationLd(), websiteLd(), faqLd(home.faq)]} />
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
    </>
  );
}
