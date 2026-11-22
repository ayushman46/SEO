import { aboutClosing, aboutPage, aboutSections } from "@/content/about";
import { JsonLd, innerPageLd, lastUpdated, pageMetadata } from "@/lib/seo";
import { SectionTear } from "@/components/collage/SectionTear";
import { AboutCollage } from "@/components/pages/AboutCollage";
import { ClosingCta } from "@/components/pages/ClosingCta";
import { PageHero } from "@/components/pages/PageHero";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { cx } from "@/components/ui/cx";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = pageMetadata.about;

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function AboutSection({ title, body, onPaper = false }: { title: string; body: string; onPaper?: boolean }) {
  const id = `about-${slug(title)}`;
  return (
    <section aria-labelledby={id} className={cx("border-t pt-8", onPaper ? "border-line-strong" : "border-line")}>
      <h2 id={id} className="font-serif text-display-sm text-balance text-ink">
        {title}
      </h2>
      <p className="mt-5 text-[1.0625rem] leading-[1.75] text-pretty text-ink-2 sm:text-lg sm:leading-[1.75]">
        <PlaceholderText value={body} />
      </p>
    </section>
  );
}

export default function AboutPage() {
  const u = lastUpdated();
  const [lede, ...rest] = aboutSections;
  const split = Math.ceil(rest.length / 2);
  const firstHalf = rest.slice(0, split);
  const secondHalf = rest.slice(split);

  return (
    <>
      <JsonLd data={innerPageLd({ name: "About", description: aboutPage.metaDescription, path: "/about" })} />
      <PageHero kicker={aboutPage.kicker} title={aboutPage.title} intro={aboutPage.intro} motif="eye" seed={42} updated={u}>
        <Button href={aboutClosing.primaryCta.href} size="lg" icon="arrow-right">
          {aboutClosing.primaryCta.label}
        </Button>
        <Button href={aboutClosing.secondaryCta.href} size="lg" variant="secondary">
          {aboutClosing.secondaryCta.label}
        </Button>
      </PageHero>

      <div className="py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:self-start">
            <Reveal>
              <AboutCollage />
            </Reveal>
          </div>
          <div className="grid max-w-[40rem] gap-12 sm:gap-14">
            {lede ? (
              <section aria-labelledby={`about-${slug(lede.title)}`}>
                <h2 id={`about-${slug(lede.title)}`} className="text-kicker font-semibold text-muted uppercase">
                  {lede.title}
                </h2>
                <p className="mt-5 font-serif text-[1.625rem] leading-[1.3] text-pretty text-ink sm:text-[2rem] sm:leading-[1.25]">
                  <PlaceholderText value={lede.body} />
                </p>
              </section>
            ) : null}
            {firstHalf.map((s) => (
              <AboutSection key={s.title} title={s.title} body={s.body} />
            ))}
          </div>
        </Container>
      </div>

      {secondHalf.length > 0 ? (
        <div className="relative">
          <SectionTear color="var(--color-paper)" seed={46} grain />
          <div className="paper-grain bg-paper py-20 sm:py-28">
            <Container>
              <div className="mx-auto grid max-w-5xl gap-12 sm:gap-14 md:grid-cols-2 md:gap-x-12 lg:gap-x-16">
                {secondHalf.map((s, i) => (
                  <Reveal key={s.title} delay={i * 100}>
                    <AboutSection title={s.title} body={s.body} onPaper />
                  </Reveal>
                ))}
              </div>
            </Container>
          </div>
          <SectionTear color="var(--color-paper)" seed={47} flip grain />
        </div>
      ) : null}

      <ClosingCta
        title={aboutClosing.title}
        body={aboutClosing.body}
        primaryCta={aboutClosing.primaryCta}
        secondaryCta={aboutClosing.secondaryCta}
        seed={85}
      />
    </>
  );
}
