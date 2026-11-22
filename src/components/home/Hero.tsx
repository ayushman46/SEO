import { Fragment } from "react";
import { home } from "@/content/home";
import { sampleReportLinks } from "@/content/sample-report";
import { HeroCollage } from "@/components/collage/HeroCollage";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { AuditUrlForm } from "./AuditUrlForm";

/** Sets the first standalone "seen" in italic serif, if present. Copy stays untouched otherwise. */
function emphasize(text: string, word = "seen") {
  const re = new RegExp(`\\b(${word})\\b`, "i");
  const m = re.exec(text);
  if (!m) return text;
  return (
    <Fragment>
      {text.slice(0, m.index)}
      <em className="pr-[0.04em] italic">{m[1]}</em>
      {text.slice(m.index + m[1].length)}
    </Fragment>
  );
}

export function Hero() {
  const { hero } = home;
  return (
    <section aria-labelledby="hero-title" className="relative">
      <HeroCollage />
      <Container className="relative z-10 -mt-4 text-center sm:-mt-6">
        <p className="inline-flex max-w-full items-center gap-2 rounded-pill bg-white px-4 py-2 text-[0.8125rem] leading-snug font-medium text-ink-2 shadow-pill ring-1 ring-ink/[0.06]">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
          <span className="text-balance">{hero.eyebrow}</span>
        </p>
        <h1
          id="hero-title"
          className="mx-auto mt-8 max-w-[14ch] font-serif text-display-xl text-balance text-ink sm:max-w-[16ch] lg:max-w-[18ch]"
        >
          {emphasize(hero.title)}
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-[1.0625rem] leading-relaxed text-pretty text-muted sm:text-lg">
          {hero.subtitle}
        </p>
        <div className="mx-auto mt-10 max-w-2xl text-left">
          <AuditUrlForm />
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-x-8 gap-y-3 sm:flex-row">
          <Button href={hero.secondaryCta.href} variant="link" icon="arrow-right">
            {hero.secondaryCta.label}
          </Button>
          <Button href={sampleReportLinks.href} variant="link" icon="arrow-right">
            {sampleReportLinks.hero}
          </Button>
        </div>
      </Container>
    </section>
  );
}
