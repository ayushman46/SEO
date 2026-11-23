import Image from "next/image";
import Link from "next/link";
import { auditPage } from "@/content/audit";
import { sampleReportLinks } from "@/content/sample-report";
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

  return (
    <header aria-labelledby="audit-title" className="relative">
      <div aria-hidden className="relative isolate -mt-(--nav-h) h-[calc(var(--nav-h)+clamp(4.5rem,11vw,10rem))] overflow-clip">
        <div className="absolute inset-0" style={{ clipPath: tear }}>
          <Image
            src="/images/sky-hero.webp"
            alt=""
            fill
            preload
            fetchPriority="high"
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

      <Container size="narrow" className="pt-8 text-center sm:pt-12">
        <p className="inline-flex items-center gap-2.5 text-kicker font-semibold text-muted uppercase">
          <span aria-hidden className="h-px w-6 bg-ink/30" />
          {auditPage.kicker}
          <span aria-hidden className="h-px w-6 bg-ink/30" />
        </p>
        <h1 id="audit-title" className="mx-auto mt-5 max-w-[18ch] font-serif text-display-lg text-balance text-ink">
          {auditPage.title}
        </h1>
      </Container>
    </header>
  );
}

/**
 * The intro, the dateline and the sample-report link, rendered under the form while the
 * page is idle (T026, R4 finding 8: the field comes first, explanations after it).
 */
export function AuditHeroNotes() {
  const u = lastUpdated();
  return (
    <Container size="narrow" className="mt-6 text-center">
      <p className="mx-auto max-w-[60ch] text-[1.0625rem] leading-relaxed text-pretty text-muted">{auditPage.intro}</p>
      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>
          {u.label} <time dateTime={u.iso}>{u.display}</time>
        </span>
        <span aria-hidden className="text-line-strong max-sm:hidden">
          ·
        </span>
        <Link
          href={sampleReportLinks.href}
          className="rounded-sm text-sm font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
        >
          {sampleReportLinks.hero}
        </Link>
      </p>
    </Container>
  );
}
