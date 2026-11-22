import { services, servicesClosing, servicesPage } from "@/content/services";
import { JsonLd, innerPageLd, lastUpdated, pageMetadata, serviceLd } from "@/lib/seo";
import { SectionTear } from "@/components/collage/SectionTear";
import { ClosingCta } from "@/components/pages/ClosingCta";
import { InPageNav } from "@/components/pages/InPageNav";
import { PageHero } from "@/components/pages/PageHero";
import { ServiceBlock } from "@/components/pages/ServiceBlock";
import { Button } from "@/components/ui/Button";
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
        motif="hands"
        seed={14}
        updated={u}
      >
        <Button href={servicesClosing.primaryCta.href} size="lg" icon="arrow-right">
          {servicesClosing.primaryCta.label}
        </Button>
        <Button href={servicesClosing.secondaryCta.href} size="lg" variant="secondary">
          {servicesClosing.secondaryCta.label}
        </Button>
      </PageHero>

      <div className="relative mt-16 sm:mt-24">
        <SectionTear color="var(--color-paper)" seed={24} grain />
        <div className="paper-grain bg-paper py-16 sm:py-24">
          <Container className="grid gap-10 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[15rem_minmax(0,1fr)]">
            <InPageNav
              label="Services on this page"
              heading="Services"
              items={services.map((s) => ({ id: s.slug, label: s.name }))}
            />
            <div className="grid min-w-0 gap-6 sm:gap-8">
              {services.map((service, i) => (
                <ServiceBlock key={service.slug} service={service} index={i} />
              ))}
            </div>
          </Container>
        </div>
        <SectionTear color="var(--color-paper)" seed={25} flip grain />
      </div>

      <ClosingCta
        title={servicesClosing.title}
        body={servicesClosing.body}
        primaryCta={servicesClosing.primaryCta}
        secondaryCta={servicesClosing.secondaryCta}
        seed={83}
      />
    </>
  );
}
