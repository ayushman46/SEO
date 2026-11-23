import Link from "next/link";
import { Fragment } from "react";
import { home } from "@/content/home";
import { sampleReportLinks } from "@/content/sample-report";
import { HeroCollage } from "@/components/collage/HeroCollage";
import { Container } from "@/components/ui/Container";
import { AuditUrlForm } from "./AuditUrlForm";

/** Sets the first standalone "seen" in italic serif, if present. Copy stays untouched otherwise. */
export function emphasize(text: string, word = "seen") {
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

/**
 * Home hero (T026): collage, H1, one subtitle, the URL field, one help line that
 * also links the sample report. Nothing else competes with the field, so it sits
 * on the first screen. `hero-eye-scope` lets the painted eye blink once when the
 * field takes focus (signature moment 1, CSS only, see globals.css).
 */
export function Hero() {
  const { hero } = home;
  return (
    <section aria-labelledby="hero-title" className="hero-eye-scope relative">
      <HeroCollage />
      <Container className="relative z-10 -mt-2 text-center sm:-mt-4">
        <h1
          id="hero-title"
          className="mx-auto max-w-[14ch] font-serif text-display-xl text-balance text-ink sm:max-w-[16ch] lg:max-w-[18ch]"
        >
          {emphasize(hero.title)}
        </h1>
        <p className="mx-auto mt-5 max-w-[52ch] text-[1.0625rem] leading-relaxed text-pretty text-muted">
          {hero.subtitle}
        </p>
        <div className="mx-auto mt-7 max-w-2xl text-left">
          <AuditUrlForm
            helpAction={
              <Link
                href={sampleReportLinks.href}
                className="rounded-sm font-medium whitespace-nowrap text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
              >
                {sampleReportLinks.hero}
              </Link>
            }
          />
        </div>
      </Container>
    </section>
  );
}
