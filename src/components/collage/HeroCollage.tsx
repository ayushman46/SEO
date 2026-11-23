import Image, { getImageProps } from "next/image";
import { preload } from "react-dom";
import { Parallax } from "./Parallax";
import { TornFrame } from "./TornFrame";
import { tornRect } from "./torn";

/**
 * Art-directed sky: phones in portrait get a portrait crop of the same photo
 * (the slice they would see anyway), so they download and decode ~1 Mpx instead
 * of the 2880 px landscape. Both variants are preloaded at high priority, each
 * only for its own media query.
 */
const PORTRAIT_MEDIA = "(max-width: 640px) and (orientation: portrait)";
const LANDSCAPE_MEDIA = "(min-width: 641px), (orientation: landscape)";

function skyProps() {
  const portrait = getImageProps({
    src: "/images/sky-hero-portrait.webp",
    alt: "",
    fill: true,
    sizes: "100vw",
    quality: 75,
  }).props;
  const landscape = getImageProps({
    src: "/images/sky-hero.webp",
    alt: "",
    fill: true,
    // The box is full-bleed and 120% of the hero height (parallax), so with
    // object-cover it is height-bound below ~1500 px: about 1060-1240 CSS px wide.
    sizes: "(min-width: 1280px) 100vw, (orientation: portrait) 1240px, 1080px",
    quality: 75,
    loading: "eager",
    fetchPriority: "high",
  }).props;
  preload(portrait.src, {
    as: "image",
    imageSrcSet: portrait.srcSet,
    imageSizes: portrait.sizes,
    fetchPriority: "high",
    media: PORTRAIT_MEDIA,
  });
  preload(landscape.src, {
    as: "image",
    imageSrcSet: landscape.srcSet,
    imageSizes: landscape.sizes,
    fetchPriority: "high",
    media: LANDSCAPE_MEDIA,
  });
  return { portrait, landscape };
}

/**
 * Full-bleed hero collage: a CC0 sky photo as the paper, a hole torn in its
 * middle through which Leonardo's painted eyes look back, Michelangelo's
 * near-touching hands on a torn scrap, a marble youth and a daytime moon.
 * Bottom edge is torn so the white page shows beneath. All decorative layers
 * are aria-hidden; the eye carries the alt text.
 */
export function HeroCollage() {
  const bottomTear = tornRect({ seed: 21, steps: 60, amp: 4.2, edges: { bottom: true } });
  const sky = skyProps();

  return (
    <div className="hero-depth-scope relative isolate -mt-(--nav-h) h-[clamp(20rem,46svh,34rem)] overflow-clip">
      {/* Sky paper with torn bottom edge */}
      <div className="absolute inset-0" style={{ clipPath: bottomTear }}>
        <Parallax speed={-0.07} className="absolute inset-x-0 -top-[10%] -bottom-[10%]">
          <picture>
            <source
              media={PORTRAIT_MEDIA}
              srcSet={sky.portrait.srcSet}
              sizes={sky.portrait.sizes}
            />
            <img {...sky.landscape} alt="" className="object-cover object-[50%_35%]" />
          </picture>
        </Parallax>
        {/* gentle top shade so the white nav pills always separate from bright cloud */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#0b2a5c]/25 to-transparent"
        />
      </div>

      {/* Daytime moon */}
      <Parallax
        speed={0.14}
        className="absolute top-[24%] left-[7%] w-[clamp(3.25rem,6.5vw,6.25rem)] sm:top-[22%] sm:left-[9%]"
      >
        <Image
          src="/images/moon.webp"
          alt=""
          width={640}
          height={640}
          sizes="(min-width: 1024px) 100px, 64px"
          className="h-auto w-full opacity-90 drop-shadow-[0_6px_14px_rgb(10_30_70/0.25)]"
        />
      </Parallax>

      {/* Marble youth on a torn scrap (md+) */}
      <Parallax
        speed={0.1}
        className="absolute bottom-[16%] left-[5%] hidden w-[clamp(7rem,12vw,11.5rem)] md:block lg:left-[9%]"
      >
        <TornFrame seed={33} rotate={-5} shadow="float" className="aspect-[760/923]">
          <Image
            src="/images/marble-youth.webp"
            alt=""
            fill
            sizes="190px"
            className="object-cover"
          />
        </TornFrame>
      </Parallax>

      {/* The torn hole and the eye. As the hero scrolls away the hole pushes in
          toward the reader (T025: CSS scroll-driven `transform`, composes with
          the centring `translate`; static under reduced motion). */}
      <div className="hero-depth absolute top-[58%] left-1/2 w-[min(88vw,46rem,calc(clamp(20rem,46svh,34rem)*1.5))] -translate-x-1/2 -translate-y-1/2">
        <TornFrame
          seed={5}
          shape="ellipse"
          amp={3.6}
          rimWidth={2.4}
          shadow="float"
          className="aspect-[2.15/1]"
        >
          <Image
            src="/images/eye.webp"
            alt="The painted eyes of Leonardo da Vinci's Mona Lisa, looking out through a hole torn in a blue sky"
            fill
            loading="eager"
            sizes="(min-width: 840px) 736px, 88vw"
            className="scale-[1.06] object-cover object-[50%_42%]"
          />
          {/* Signature moment 1 (T026): paper eyelids, parked outside the torn clip.
              They close once when the URL field takes focus (CSS :has(), transform only). */}
          <div aria-hidden className="eye-lid eye-lid-top paper-grain" />
          <div aria-hidden className="eye-lid eye-lid-bottom paper-grain" />
          {/* depth: the sky casts a shadow into the hole */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 62% 70% at 50% 46%, transparent 55%, rgb(28 18 4 / 0.38) 100%), linear-gradient(to bottom, rgb(20 14 4 / 0.28), transparent 26%)",
            }}
          />
        </TornFrame>
      </div>

      {/* Hands reaching across a scrap, overlapping the hole */}
      <Parallax
        speed={-0.12}
        className="absolute right-[3%] bottom-[11%] w-[clamp(8.5rem,24vw,18rem)] sm:right-[6%] sm:bottom-[13%] lg:right-[11%]"
      >
        <TornFrame seed={44} rotate={4} shadow="float" className="aspect-[720/460]">
          <Image
            src="/images/hands.webp"
            alt=""
            fill
            sizes="(min-width: 1200px) 288px, (max-width: 566px) 136px, 24vw"
            className="object-cover"
          />
        </TornFrame>
      </Parallax>
    </div>
  );
}
