import Image from "next/image";
import type { Cta } from "@/content/types";
import { TornFrame } from "@/components/collage/TornFrame";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/** Closing card for inner pages: the eye peeks over a paper card, title, body, two next steps. */
export function ClosingCta({
  id = "closing-title",
  title,
  body,
  primaryCta,
  secondaryCta,
  seed = 81,
}: {
  id?: string;
  title: string;
  body: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
  seed?: number;
}) {
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
            <p className="mx-auto mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-pretty text-muted">{body}</p>
            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button href={primaryCta.href} size="lg" icon="arrow-right">
                {primaryCta.label}
              </Button>
              {secondaryCta ? (
                <Button href={secondaryCta.href} size="lg" variant="secondary">
                  {secondaryCta.label}
                </Button>
              ) : null}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
