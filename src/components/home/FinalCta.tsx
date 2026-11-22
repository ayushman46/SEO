import Image from "next/image";
import { home } from "@/content/home";
import { TornFrame } from "@/components/collage/TornFrame";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { AuditUrlForm } from "./AuditUrlForm";

export function FinalCta() {
  const { finalCta } = home;
  return (
    <section aria-labelledby="final-title" className="relative overflow-clip pt-20 pb-24 sm:pb-32">
      <Container>
        <Reveal>
          <div className="relative mx-auto max-w-4xl rounded-panel bg-paper px-5 pt-24 pb-10 text-center shadow-[inset_0_0_0_1px_var(--color-line)] paper-grain sm:px-12 sm:pt-28 sm:pb-14">
            {/* the eye again, small, peeking over the card edge */}
            <div aria-hidden className="absolute -top-10 left-1/2 w-[min(70%,17rem)] -translate-x-1/2 sm:-top-12">
              <TornFrame seed={73} shape="ellipse" amp={3.4} rimWidth={2.6} shadow="float" className="aspect-[2.15/1]">
                <Image src="/images/eye.webp" alt="" fill sizes="272px" className="scale-[1.08] object-cover object-[50%_42%]" />
              </TornFrame>
            </div>
            <h2 id="final-title" className="mx-auto max-w-2xl font-serif text-display-md text-balance text-ink">
              {finalCta.title}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-pretty text-muted">{finalCta.body}</p>
            <div className="mx-auto mt-9 max-w-xl text-left">
              <AuditUrlForm showHelp={false} />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
