import Image from "next/image";
import { home } from "@/content/home";
import { Parallax } from "@/components/collage/Parallax";
import { SectionTear } from "@/components/collage/SectionTear";
import { TornFrame } from "@/components/collage/TornFrame";
import { mulberry32 } from "@/components/collage/torn";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/** Deterministic starfield (server-rendered SVG, ~140 stars, no image request). */
function Stars() {
  const rand = mulberry32(2026);
  const stars = Array.from({ length: 140 }, (_, i) => {
    const x = rand() * 1000;
    const y = rand() * 640;
    const big = rand() < 0.08;
    const r = big ? 1.3 + rand() * 0.9 : 0.35 + rand() * 0.75;
    const twinkle = rand() < 0.28;
    const delay = (rand() * 4.5).toFixed(2);
    return { i, x, y, r, twinkle, delay, o: 0.35 + rand() * 0.6 };
  });
  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1000 640"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      {stars.map((s) => (
        <circle
          key={s.i}
          cx={s.x.toFixed(1)}
          cy={s.y.toFixed(1)}
          r={s.r.toFixed(2)}
          fill="#fff"
          opacity={s.twinkle ? undefined : s.o.toFixed(2)}
          className={s.twinkle ? "star-twinkle" : undefined}
          style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
        />
      ))}
    </svg>
  );
}

export function NightSky() {
  const { nightSky } = home;
  return (
    <section aria-labelledby="night-title" className="relative">
      <SectionTear color="var(--color-night)" seed={27} />
      <div className="relative isolate overflow-clip bg-night text-night-ink">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 80% at 80% 0%, var(--color-night-3) 0%, transparent 55%), radial-gradient(90% 70% at 0% 100%, #101c3f 0%, transparent 60%), linear-gradient(180deg, var(--color-night) 0%, var(--color-night-2) 100%)",
          }}
        />
        <Stars />

        {/* moon and a marble witness, pinned to the night */}
        <Parallax speed={0.1} className="absolute top-[9%] right-[6%] w-[clamp(6.5rem,18vw,15rem)] sm:right-[9%]">
          <Image
            src="/images/moon.webp"
            alt=""
            width={640}
            height={640}
            sizes="(min-width: 1024px) 240px, 18vw"
            className="h-auto w-full drop-shadow-[0_0_60px_rgb(200_215_255/0.35)]"
          />
        </Parallax>
        <Parallax speed={-0.06} className="absolute right-[5%] bottom-[10%] hidden w-[clamp(8rem,13vw,12rem)] lg:block xl:right-[12%]">
          <TornFrame seed={61} rotate={5} rimColor="#e9e6dc" shadow="float" className="aspect-[760/923]">
            <Image src="/images/marble-youth.webp" alt="" fill sizes="192px" className="object-cover brightness-[0.8] contrast-[1.05]" />
            <div className="absolute inset-0 bg-[#0d1630]/35 mix-blend-multiply" />
          </TornFrame>
        </Parallax>

        <Container className="relative py-28 sm:py-40">
          <Reveal className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2.5 text-kicker font-semibold text-night-muted uppercase">
              <span aria-hidden className="h-px w-6 bg-night-muted/60" />
              {nightSky.kicker}
            </p>
            <h2 id="night-title" className="font-serif text-display-lg text-balance text-night-ink">
              {nightSky.title}
            </h2>
            <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-pretty text-night-muted sm:text-lg">{nightSky.body}</p>
            <div className="mt-10">
              <Button href={nightSky.cta.href} size="lg" icon="arrow-right">
                {nightSky.cta.label}
              </Button>
            </div>
          </Reveal>
        </Container>
      </div>
      <SectionTear color="var(--color-night)" seed={31} flip />
    </section>
  );
}
