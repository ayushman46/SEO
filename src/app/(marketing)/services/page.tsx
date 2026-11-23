import { services, servicesClosing, servicesPage } from "@/content/services";
import { JsonLd, innerPageLd, lastUpdated, pageMetadata, serviceLd } from "@/lib/seo";
import { ClosingCta } from "@/components/pages/ClosingCta";
import { InPageNav } from "@/components/pages/InPageNav";
import { PageHero } from "@/components/pages/PageHero";
import { ServiceBlock } from "@/components/pages/ServiceBlock";
import { Container } from "@/components/ui/Container";

export const metadata = pageMetadata.services;

export default function ServicesPage() {
  const u = lastUpdated();
  return (
    <>
      <JsonLd
        data={[
          ...innerPageLd({ name: "Services", description: servicesPage.metaDescription, path: "/services" }),
          ...services.map(serviceLd),
        ]}
      />
      <PageHero
        kicker={servicesPage.kicker}
        title={servicesPage.title}
        intro={servicesPage.intro}
        motif="marble"
        seed={14}
        updated={u}
      />

      <div className="mt-14 border-t border-line-strong sm:mt-20">
        <div className="paper-grain bg-paper py-14 sm:py-20">
          <Container className="grid gap-10 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[15rem_minmax(0,1fr)]">
            <InPageNav
              label="Services on this page"
              heading="Services"
              items={services.map((s) => ({ id: s.slug, label: s.name }))}
            />
            <div className="grid min-w-0 gap-14 sm:gap-20">
              {services.map((service, i) => (
                <ServiceBlock key={service.slug} service={service} index={i} />
              ))}
            </div>
          </Container>
        </div>
      </div>

      <ClosingCta
        title={servicesClosing.title}
        body={servicesClosing.body}
        primaryCta={servicesClosing.primaryCta}
        secondaryCta={servicesClosing.secondaryCta}
      />
    </>
  );
}
