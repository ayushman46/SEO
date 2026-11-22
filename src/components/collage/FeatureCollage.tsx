import Image from "next/image";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { Parallax } from "./Parallax";
import { TornFrame } from "./TornFrame";

/**
 * Collage card for the feature tabs: deep cumulus sky on torn paper, a marble
 * youth and a moon pinned on top, and a floating product UI card (`children`).
 * Purely illustrative, so it is hidden from assistive tech; the tab panel
 * carries the real content.
 */
export function FeatureCollage({
  children,
  seed = 9,
  className,
}: {
  children: ReactNode;
  seed?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cx("relative mx-auto w-full max-w-xl", className)}>
      <div className="relative aspect-[1/1] sm:aspect-[6/5] lg:aspect-[1/1.02]">
        <TornFrame seed={seed} amp={1.8} rimWidth={1.4} className="absolute inset-0">
          <Image
            src="/images/sky-cumulus.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 560px, (min-width: 640px) 576px, 92vw"
            className="object-cover object-[50%_60%]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#06142e]/30 via-transparent to-transparent" />
        </TornFrame>

        <Parallax speed={0.06} className="absolute top-[7%] left-[6%] w-[34%]">
          <TornFrame seed={seed + 7} rotate={-6} shadow="float" className="aspect-[760/923]">
            <Image
              src="/images/marble-youth.webp"
              alt=""
              fill
              sizes="(min-width: 640px) 196px, 34vw"
              className="object-cover"
            />
          </TornFrame>
        </Parallax>

        <Parallax speed={0.12} className="absolute top-[9%] right-[11%] w-[15%]">
          <Image
            src="/images/moon.webp"
            alt=""
            width={640}
            height={640}
            sizes="(min-width: 640px) 88px, 15vw"
            className="h-auto w-full drop-shadow-[0_0_24px_rgb(255_255_255/0.35)]"
          />
        </Parallax>

        <div className="absolute right-[4%] bottom-[6%] left-[14%] sm:left-auto sm:w-[min(74%,22.5rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}

/** White floating UI card used on collages. */
export function FloatingCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-card bg-white p-4 text-ink shadow-float ring-1 ring-ink/[0.05] sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <span className="rounded-pill bg-paper px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide text-muted uppercase">
          Illustrative
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
