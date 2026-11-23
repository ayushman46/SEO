import { home } from "@/content/home";
import { Container } from "@/components/ui/Container";
import { Steps } from "@/components/ui/Steps";

/** Compact "how it works" under the idle form, reusing the home page copy and the shared Steps look. */
export function AuditSteps() {
  const { howItWorks } = home;
  return (
    <section aria-labelledby="audit-steps-title" className="pt-16 pb-20 sm:pt-24 sm:pb-28">
      <Container>
        <h2 id="audit-steps-title" className="text-kicker font-semibold text-muted uppercase">
          {howItWorks.kicker}
        </h2>
        <Steps steps={howItWorks.steps} className="mt-6" />
      </Container>
    </section>
  );
}
