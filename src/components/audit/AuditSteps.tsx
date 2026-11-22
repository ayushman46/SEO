import { home } from "@/content/home";
import { Container } from "@/components/ui/Container";

/** Compact "how it works" under the idle form, reusing the home page copy. */
export function AuditSteps() {
  const { howItWorks } = home;
  return (
    <section aria-labelledby="audit-steps-title" className="pt-20 pb-24 sm:pt-28 sm:pb-32">
      <Container>
        <h2 id="audit-steps-title" className="text-center text-kicker font-semibold text-muted uppercase">
          {howItWorks.kicker}
        </h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {howItWorks.steps.map((step, i) => (
            <li key={step.title} className="border-t border-ink pt-6">
              <span aria-hidden className="font-serif text-[2.75rem] leading-none text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-serif text-[1.625rem] leading-[1.1] text-balance text-ink">{step.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-pretty text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
