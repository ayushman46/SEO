import Image from "next/image";
import type { ReactNode } from "react";
import { Parallax } from "@/components/collage/Parallax";
import { TornFrame } from "@/components/collage/TornFrame";
import { tornRect } from "@/components/collage/torn";
import { Container } from "@/components/ui/Container";
import { cx } from "@/components/ui/cx";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Which classical fragment is pinned to the sky strip. */
export type HeroMotif = "eye" | "marble" | "hands";

const MOTIFS: Record<HeroMotif, { src: string; aspect: string; shape: "rect" | "ellipse"; position?: string; scale?: string }> = {
  eye: { src: "/images/eye.webp", aspect: "aspect-[2.15/1]", shape: "ellipse", position: "object-[50%_42%]", scale: "scale-[1.08]" },
  marble: { src: "/images/marble-youth.webp", aspect: "aspect-[760/923]", shape: "rect" },
  hands: { src: "/images/hands.webp", aspect: "aspect-[720/460]", shape: "rect" },
};

/**
 * Inner-page hero: a short full-bleed strip of sky with a torn bottom edge
 * (sliding under the floating nav, like the home hero), one classical scrap
 * pinned to it, then the kicker, serif title, intro, optional actions and the
 * visible "Last updated" line. All imagery is decorative.
 */
export function PageHero({
  id = "page-title",
  kicker,
  title,
  intro,
  motif = "eye",
  seed = 11,
  compact = false,
  updated,
  children,
}: {
  id?: string;
  kicker: string;
  title: ReactNode;
  intro?: string;
  motif?: HeroMotif;
  seed?: number;
  /** shorter strip, for legal pages */
  compact?: boolean;
  /** from lastUpdated(): rendered as "<label> <time>" */
  updated?: { label: string; iso: string; display: string };
  children?: ReactNode;
}) {
  const bottomTear = tornRect({ seed: seed + 100, steps: 54, amp: 7, edges: { bottom: true } });
  const m = MOTIFS[motif];

  return (
    <section aria-labelledby={id} className="relative">
      <div
        className={cx(
          "relative isolate -mt-(--nav-h) overflow-clip",
          compact ? "h-[clamp(9.5rem,20svh,12rem)]" : "h-[clamp(12.5rem,30svh,18rem)]",
        )}
      >
        <div aria-hidden className="absolute inset-0" style={{ clipPath: bottomTear }}>
          <Parallax speed={-0.06} className="absolute inset-x-0 -top-[12%] -bottom-[12%]">
            <Image
              src="/images/sky-hero.webp"
              alt=""
              fill
              preload
              sizes="100vw"
              quality={70}
              className="object-cover object-[50%_30%]"
            />
          </Parallax>
          <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-[#0b2a5c]/25 to-transparent" />
        </div>

        {/* daytime moon, small, on the left */}
        <div aria-hidden className="absolute top-[38%] left-[5%] w-[clamp(2.25rem,4.5vw,4rem)] sm:left-[8%]">
          <Image
            src="/images/moon.webp"
            alt=""
            width={640}
            height={640}
            sizes="64px"
            className="h-auto w-full opacity-90 drop-shadow-[0_6px_14px_rgb(10_30_70/0.25)]"
          />
        </div>

        {!compact ? (
          <Parallax
            speed={0.08}
            className={cx(
              "absolute right-[5%] bottom-[16%] sm:right-[8%] lg:right-[10%]",
              m.shape === "ellipse"
                ? "w-[clamp(8.5rem,26vw,19rem)]"
                : motif === "marble"
                  ? "w-[clamp(4.75rem,10vw,8.5rem)]"
                  : "w-[clamp(7.5rem,20vw,15rem)]",
            )}
          >
            <div aria-hidden>
              <TornFrame
                seed={seed + 3}
                shape={m.shape}
                amp={m.shape === "ellipse" ? 3.4 : undefined}
                rimWidth={m.shape === "ellipse" ? 2.6 : undefined}
                rotate={m.shape === "ellipse" ? 0 : motif === "marble" ? -5 : 4}
                shadow="float"
                className={m.aspect}
              >
                <Image
                  src={m.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 304px, 26vw"
                  className={cx("object-cover", m.position, m.scale)}
                />
              </TornFrame>
            </div>
          </Parallax>
        ) : null}
      </div>

      <Container className={cx("relative z-10", compact ? "pt-10 sm:pt-12" : "pt-10 sm:pt-14")}>
        <SectionHeading as="h1" id={id} kicker={kicker} title={title} size="lg" className="max-w-4xl">
          {intro ? (
            <p className="mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-pretty text-muted sm:text-lg">
              <PlaceholderText value={intro} />
            </p>
          ) : null}
          {children ? <div className="mt-9 flex flex-wrap items-center gap-3">{children}</div> : null}
          {updated ? (
            <p className="mt-8 text-sm text-muted">
              {updated.label} <time dateTime={updated.iso}>{updated.display}</time>
            </p>
          ) : null}
        </SectionHeading>
      </Container>
    </section>
  );
}
