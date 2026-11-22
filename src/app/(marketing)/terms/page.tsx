import { terms, termsMeta } from "@/content/legal";
import { JsonLd, innerPageLd, lastUpdated, pageMetadata } from "@/lib/seo";
import { LegalBody } from "@/components/pages/LegalBody";
import { PageHero } from "@/components/pages/PageHero";

export const metadata = pageMetadata.terms;

export default function TermsPage() {
  const u = lastUpdated(terms.updated);
  return (
    <>
      <JsonLd
        data={innerPageLd({
          name: "Terms of service",
          description: termsMeta.metaDescription,
          path: "/terms",
          dateModified: terms.updated,
        })}
      />
      <PageHero kicker="Legal" title={terms.title} intro={termsMeta.metaDescription} seed={72} compact updated={u} />
      <LegalBody doc={terms} />
    </>
  );
}
