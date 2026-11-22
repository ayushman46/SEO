import Image from "next/image";
import { auditPage } from "@/content/audit";
import { TornFrame } from "@/components/collage/TornFrame";
import { tornRect } from "@/components/collage/torn";
import { Container } from "@/components/ui/Container";
import { lastUpdated } from "@/lib/seo";

/**
 * /audit page header: a slim torn strip of sky that the nav floats over, a
 * small painted eye peering through it (md+), then the editorial heading.
 * Decorative layers are aria-hidden; the heading carries the meaning.
 */
export function AuditHero() {
  const tear = tornRect({ seed: 47, steps: 56, amp: 9, edges: { bottom: true } });
  const u = lastUpdated();

  return (
    <header aria-labelledby="audit-title" className="relative">
      <div aria-hidden className="relative isolate -mt-(--nav-h) h-[calc(var(--nav-h)+clamp(4.5rem,11vw,10rem))] overflow-clip">
        <div className="absolute inset-0" style={{ clipPath: tear }}>
          <Image
            src="/images/sky-hero.webp"
            alt=""
            fill
            preload
            sizes="100vw"
            quality={70}
            className="object-cover object-[50%_40%]"
          />
          <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#0b2a5c]/25 to-transparent" />
        </div>
        <div className="absolute right-[7%] bottom-[16%] hidden w-[clamp(8.5rem,15vw,13.5rem)] md:block lg:right-[11%]">
          <TornFrame seed={12} shape="ellipse" amp={3.4} rimWidth={2.6} shadow="float" rotate={-4} className="aspect-[2.15/1]">
            <Image
              src="/images/eye.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 216px, 15vw"
              className="object-cover object-[50%_45%]"
            />
          </TornFrame>
        </div>
      </div>

      <Container size="narrow" className="pt-10 text-center sm:pt-14">
        <p className="inline-flex items-center gap-2.5 text-kicker font-semibold text-muted uppercase">
          <span aria-hidden className="h-px w-6 bg-ink/30" />
          {auditPage.kicker}
          <span aria-hidden className="h-px w-6 bg-ink/30" />
        </p>
        <h1 id="audit-title" className="mx-auto mt-5 max-w-[18ch] font-serif text-display-lg text-balance text-ink">
          {auditPage.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-pretty text-muted sm:text-lg">{auditPage.intro}</p>
        <p className="mt-4 text-xs text-muted">
          {u.label} <time dateTime={u.iso}>{u.display}</time>
        </p>
      </Container>
    </header>
  );
}
