import { methodologyFaq, methodologyPage, methodologySections } from "@/content/methodology";
import { sampleReportLinks } from "@/content/sample-report";
import { JsonLd, faqLd, innerPageLd, lastUpdated, pageMetadata } from "@/lib/seo";
import { DocBody } from "@/components/pages/DocBody";
import { PageHero } from "@/components/pages/PageHero";
import { Button } from "@/components/ui/Button";

export const metadata = pageMetadata.methodology;

export default function MethodologyPage() {
  const u = lastUpdated();
  const faq = faqLd(methodologyFaq);
  const hasFaqLd = Array.isArray(faq.mainEntity) && faq.mainEntity.length > 0;

  return (
    <>
      <JsonLd
        data={[
          ...innerPageLd({ name: "How the audit works", description: methodologyPage.metaDescription, path: "/methodology" }),
          ...(hasFaqLd ? [faq] : []),
        ]}
      />
      <PageHero
        kicker={methodologyPage.kicker}
        title={methodologyPage.title}
        intro={methodologyPage.intro}
        seed={53}
        updated={u}
      >
        <Button href="/audit" size="lg" icon="arrow-right">
          Run the free audit
        </Button>
        <Button href={sampleReportLinks.href} size="lg" variant="secondary">
          {sampleReportLinks.hero}
        </Button>
      </PageHero>
      <DocBody
        label={methodologyPage.title}
        sections={methodologySections}
        faq={{ id: "faq", title: "Common questions", items: methodologyFaq }}
      />
    </>
  );
}
