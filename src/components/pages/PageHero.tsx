import Image from "next/image";
import type { ReactNode } from "react";
import { Parallax } from "@/components/collage/Parallax";
import { TornFrame } from "@/components/collage/TornFrame";
import { tornRect } from "@/components/collage/torn";
import { Container } from "@/components/ui/Container";
import { cx } from "@/components/ui/cx";
import { PlaceholderText } from "@/components/ui/PlaceholderText";

/**
 * Which classical fragment is pinned to the sky strip, chosen per page family
 * (T026: no more wallpaper). Every motif is a different crop of the same six
 * files, so nothing new is downloaded. "none" is a quiet typographic header
 * with no sky at all (methodology, /bot, legal).
 */
export type HeroMotif = "eye" | "eye-single" | "marble" | "hands" | "hands-gap" | "none";

type Motif = {
  src: string;
  aspect: string;
  shape: "rect" | "ellipse";
  position?: string;
  scale?: string;
  /** width / height of the frame, used to cap the width so the frame fits the strip below the nav */
  ratio: number;
  side: "left" | "right";
  /** CSS width expression */
  width: string;
  rotate: number;
};

const MOTIFS: Record<Exclude<HeroMotif, "none">, Motif> = {
  // about: the painted eyes in a torn hole
  eye: {
    src: "/images/eye.webp",
    aspect: "aspect-[2.15/1]",
    ratio: 2.15,
    shape: "ellipse",
    position: "object-[50%_42%]",
    scale: "scale-[1.08]",
    side: "right",
    width: "clamp(8.5rem,26vw,19rem)",
    rotate: 0,
  },
  // sample report: one eye, close, on a rectangular scrap
  "eye-single": {
    src: "/images/eye.webp",
    aspect: "aspect-[4/3]",
    ratio: 4 / 3,
    shape: "rect",
    // cover crop from the left edge, then scale about the left eye (about 44% / 43% of the box),
    // so the scrap shows the whole eye and lid, not the bare cheek and nose bridge
    position: "object-[0%_42%]",
    scale: "origin-[44%_43%] scale-[2.2]",
    side: "right",
    width: "clamp(5.5rem,13vw,10rem)",
    rotate: -3,
  },
  // services: the marble youth
  marble: {
    src: "/images/marble-youth.webp",
    aspect: "aspect-[760/923]",
    ratio: 760 / 923,
    shape: "rect",
    side: "right",
    width: "clamp(4.75rem,10vw,8.5rem)",
    rotate: -5,
  },
  // contact: Michelangelo's near-touching hands
  hands: {
    src: "/images/hands.webp",
    aspect: "aspect-[720/460]",
    ratio: 720 / 460,
    shape: "rect",
    side: "left",
    width: "clamp(7.5rem,20vw,15rem)",
    rotate: 4,
  },
  // pricing: only the gap between the fingers
  "hands-gap": {
    src: "/images/hands.webp",
    aspect: "aspect-[3/2]",
    ratio: 3 / 2,
    shape: "rect",
    position: "object-[50%_50%]",
    scale: "origin-[52%_52%] scale-[1.8]",
    side: "left",
    width: "clamp(6rem,15vw,11rem)",
    rotate: -3,
  },
};

/**
 * Inner-page hero. With a motif: a short full-bleed sky strip with a torn bottom
 * edge (sliding under the floating nav), one fragment pinned to it. With
 * `motif="none"`: no image, a typographic header closed by a hairline. Then the
 * kicker row (kicker left, "Last updated" dateline right), the serif title, the
 * intro, and actions only if the page passes them.
 */
export function PageHero({
  id = "page-title",
  kicker,
  title,
  intro,
  motif = "none",
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
  /** shorter strip and tighter spacing (contact, pricing, sample report) */
  compact?: boolean;
  /** from lastUpdated(): rendered as a dateline in the kicker row */
  updated?: { label: string; iso: string; display: string };
  children?: ReactNode;
}) {
  const m = motif === "none" ? null : MOTIFS[motif];
  const bottomTear = tornRect({ seed: seed + 100, steps: 54, amp: 7, edges: { bottom: true } });

  return (
    <section aria-labelledby={id} className="relative">
      {m ? (
        <div
          className={cx(
            "relative isolate -mt-(--nav-h) overflow-clip",
            compact ? "h-[calc(var(--nav-h)+clamp(5rem,12svh,7.5rem))]" : "h-[calc(var(--nav-h)+clamp(7.5rem,20svh,12rem))]",
          )}
        >
          <div aria-hidden className="absolute inset-0" style={{ clipPath: bottomTear }}>
            <Parallax speed={-0.06} className="absolute inset-x-0 -top-[12%] -bottom-[12%]">
              <Image
                src="/images/sky-hero.webp"
                alt=""
                fill
                preload
                fetchPriority="high"
                sizes="100vw"
                quality={70}
                className={cx("object-cover", m.side === "left" ? "object-[30%_30%]" : "object-[50%_30%]")}
              />
            </Parallax>
            <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-[#0b2a5c]/25 to-transparent" />
          </div>

          {/* The fragment lives in the band below the floating nav (R5 #5): its width is capped by
              the band height (container query units) so a tall motif never reaches up into the
              pills, and its parallax is 0 at the top of the page so it rests where it is placed. */}
          <div className="absolute inset-x-0 top-[calc(var(--nav-h)+0.25rem)] bottom-4 [container-type:size]">
            <Parallax
              speed={0.08}
              fromTop
              className={cx(
                "absolute top-0",
                m.side === "right" ? "right-[5%] sm:right-[8%] lg:right-[10%]" : "left-[5%] sm:left-[8%] lg:left-[10%]",
              )}
              style={{ width: `min(${compact ? "clamp(4.5rem,10vw,8rem)" : m.width}, calc(100cqh * ${m.ratio} * 0.88))` }}
            >
              <div aria-hidden>
                <TornFrame
                  seed={seed + 3}
                  shape={m.shape}
                  amp={m.shape === "ellipse" ? 3.4 : undefined}
                  rimWidth={m.shape === "ellipse" ? 2.6 : undefined}
                  rotate={m.rotate}
                  shadow="float"
                  className={m.aspect}
                >
                  <Image src={m.src} alt="" fill sizes="(min-width: 1024px) 304px, 26vw" className={cx("object-cover", m.position, m.scale)} />
                </TornFrame>
              </div>
            </Parallax>
          </div>
        </div>
      ) : null}

      <Container
        className={cx(
          "relative z-10",
          m ? (compact ? "pt-8 sm:pt-10" : "pt-10 sm:pt-14") : "pt-10 sm:pt-16",
        )}
      >
        <div className={cx(!m && "border-b border-line pb-10 sm:pb-14")}>
          <p className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-kicker font-semibold text-muted uppercase">
            <span className="inline-flex items-center gap-2.5">
              <span aria-hidden className="h-px w-6 bg-ink/30" />
              {kicker}
            </span>
            {updated ? (
              <span className="font-medium">
                {updated.label} <time dateTime={updated.iso}>{updated.display}</time>
              </span>
            ) : null}
          </p>
          <h1 id={id} className="max-w-4xl font-serif text-display-lg text-balance text-ink">
            {title}
          </h1>
          {intro ? (
            <p className="mt-6 max-w-[60ch] text-[1.0625rem] leading-relaxed text-pretty text-muted">
              <PlaceholderText value={intro} />
            </p>
          ) : null}
          {children ? <div className="mt-8 flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}
