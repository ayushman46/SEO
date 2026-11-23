import { aboutClosing, aboutPage, aboutSections } from "@/content/about";
import { JsonLd, innerPageLd, lastUpdated, pageMetadata } from "@/lib/seo";
import { AboutCollage } from "@/components/pages/AboutCollage";
import { ClosingCta } from "@/components/pages/ClosingCta";
import { PageHero } from "@/components/pages/PageHero";
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
      <p className="mt-5 max-w-[66ch] text-[1.0625rem] leading-[1.75] text-pretty text-ink-2">
        <PlaceholderText value={body} />
      </p>
    </section>
  );
}

export default function AboutPage() {
  const u = lastUpdated();
  const [lede, ...rest] = aboutSections;

  return (
    <>
      <JsonLd data={innerPageLd({ name: "About", description: aboutPage.metaDescription, path: "/about" })} />
      {/* typographic header: the eye closes this page (ClosingCta variant="eye"), the collage sits beside the text */}
      <PageHero kicker={aboutPage.kicker} title={aboutPage.title} intro={aboutPage.intro} seed={42} updated={u} />

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
                <p className="mt-5 font-serif text-display-sm text-pretty text-ink">
                  <PlaceholderText value={lede.body} />
                </p>
              </section>
            ) : null}
            {rest.map((s) => (
              <AboutSection key={s.title} title={s.title} body={s.body} />
            ))}
          </div>
        </Container>
      </div>

      <ClosingCta
        title={aboutClosing.title}
        body={aboutClosing.body}
        primaryCta={aboutClosing.primaryCta}
        secondaryCta={aboutClosing.secondaryCta}
        seed={85}
        variant="eye"
      />
    </>
  );
}
