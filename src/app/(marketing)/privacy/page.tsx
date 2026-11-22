import { privacy, privacyMeta } from "@/content/legal";
import { JsonLd, innerPageLd, lastUpdated, pageMetadata } from "@/lib/seo";
import { LegalBody } from "@/components/pages/LegalBody";
import { PageHero } from "@/components/pages/PageHero";

export const metadata = pageMetadata.privacy;

export default function PrivacyPage() {
  const u = lastUpdated(privacy.updated);
  return (
    <>
      <JsonLd
        data={innerPageLd({
          name: "Privacy policy",
          description: privacyMeta.metaDescription,
          path: "/privacy",
          dateModified: privacy.updated,
        })}
      />
      <PageHero kicker="Legal" title={privacy.title} intro={privacyMeta.metaDescription} seed={71} compact updated={u} />
      <LegalBody doc={privacy} />
    </>
  );
}
