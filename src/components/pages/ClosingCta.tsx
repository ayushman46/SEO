import Image from "next/image";
import type { Cta } from "@/content/types";
import { TornFrame } from "@/components/collage/TornFrame";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Closing call to action for inner pages. Default (T026): a plain band, a
 * hairline in ink, heading and body left, actions right, no image and no card.
 * `variant="eye"` keeps the paper card with the eye peeking over it; it is
 * reserved for /about (home has its own FinalCta).
 */
export function ClosingCta({
  id = "closing-title",
  title,
  body,
  primaryCta,
  secondaryCta,
  seed = 81,
  variant = "band",
}: {
  id?: string;
  title: string;
  body: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
  seed?: number;
  variant?: "band" | "eye";
}) {
  const actions = (
    <>
      <Button href={primaryCta.href} size="lg" icon="arrow-right">
        {primaryCta.label}
      </Button>
      {secondaryCta ? (
        <Button href={secondaryCta.href} size="lg" variant="secondary">
          {secondaryCta.label}
        </Button>
      ) : null}
    </>
  );

  if (variant === "band") {
    return (
      <section aria-labelledby={id} className="pt-16 pb-20 sm:pt-20 sm:pb-28">
        <Container>
          <div className="flex flex-col gap-8 border-t border-ink pt-10 md:flex-row md:items-end md:justify-between md:gap-12">
            <div className="max-w-2xl">
              <h2 id={id} className="font-serif text-display-md text-balance text-ink">
                {title}
              </h2>
              <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-relaxed text-pretty text-muted">{body}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">{actions}</div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section aria-labelledby={id} className="relative overflow-clip pt-20 pb-24 sm:pb-32">
      <Container>
        <Reveal>
          <div className="paper-grain relative mx-auto max-w-4xl rounded-panel bg-paper px-5 pt-24 pb-10 text-center shadow-[inset_0_0_0_1px_var(--color-line)] sm:px-12 sm:pt-28 sm:pb-14">
            <div aria-hidden className="absolute -top-10 left-1/2 w-[min(70%,17rem)] -translate-x-1/2 sm:-top-12">
              <TornFrame seed={seed} shape="ellipse" amp={3.4} rimWidth={2.6} shadow="float" className="aspect-[2.15/1]">
                <Image src="/images/eye.webp" alt="" fill sizes="272px" className="scale-[1.08] object-cover object-[50%_42%]" />
              </TornFrame>
            </div>
            <h2 id={id} className="mx-auto max-w-2xl font-serif text-display-md text-balance text-ink">
              {title}
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-[1.0625rem] leading-relaxed text-pretty text-muted">{body}</p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">{actions}</div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
