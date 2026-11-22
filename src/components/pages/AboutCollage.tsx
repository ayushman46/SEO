import Image from "next/image";
import { Parallax } from "@/components/collage/Parallax";
import { TornFrame } from "@/components/collage/TornFrame";
import { cx } from "@/components/ui/cx";

/**
 * Portrait collage for /about: a torn sheet of cumulus sky, a marble youth
 * pinned over it, Michelangelo's hands on a scrap and a small daytime moon.
 * Decorative only.
 */
export function AboutCollage({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cx("relative mx-auto w-full max-w-md", className)}>
      <div className="relative aspect-[4/5]">
        <TornFrame seed={52} amp={2} rimWidth={1.5} className="absolute inset-[0_6%_8%_0]">
          <Image
            src="/images/sky-cumulus.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, 80vw"
            className="object-cover object-[40%_55%]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#06142e]/25 via-transparent to-transparent" />
        </TornFrame>

        <Parallax speed={0.05} className="absolute top-[14%] right-0 w-[46%]">
          <TornFrame seed={58} rotate={5} shadow="float" className="aspect-[760/923]">
            <Image src="/images/marble-youth.webp" alt="" fill sizes="(min-width: 1024px) 200px, 40vw" className="object-cover" />
          </TornFrame>
        </Parallax>

        <Parallax speed={-0.06} className="absolute bottom-0 left-[6%] w-[58%]">
          <TornFrame seed={61} rotate={-4} shadow="float" className="aspect-[720/460]">
            <Image src="/images/hands.webp" alt="" fill sizes="(min-width: 1024px) 240px, 50vw" className="object-cover" />
          </TornFrame>
        </Parallax>

        <div className="absolute top-[7%] left-[9%] w-[16%]">
          <Image
            src="/images/moon.webp"
            alt=""
            width={640}
            height={640}
            sizes="(min-width: 1024px) 72px, 14vw"
            className="h-auto w-full drop-shadow-[0_0_24px_rgb(255_255_255/0.35)]"
          />
        </div>
      </div>
    </div>
  );
}
