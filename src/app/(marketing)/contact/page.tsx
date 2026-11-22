import { CONTACT_HONEYPOT_FIELD } from "@/app/actions/contact-schema";
import { contactForm, contactNextSteps, contactPage } from "@/content/contact";
import { site } from "@/content/site";
import { JsonLd, innerPageLd, lastUpdated, pageMetadata } from "@/lib/seo";
import { SectionTear } from "@/components/collage/SectionTear";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHero } from "@/components/pages/PageHero";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PlaceholderText, stripPlaceholder } from "@/components/ui/PlaceholderText";

export const metadata = pageMetadata.contact;

export default function ContactPage() {
  const u = lastUpdated();
  const email = stripPlaceholder(site.contactEmail);

  return (
    <>
      <JsonLd data={innerPageLd({ name: "Contact", description: contactPage.metaDescription, path: "/contact" })} />
      <PageHero
        kicker={contactPage.kicker}
        title={contactPage.title}
        intro={contactPage.intro}
        motif="eye"
        seed={63}
        updated={u}
      />

      <div className="relative mt-14 sm:mt-20">
        <SectionTear color="var(--color-paper)" seed={64} grain />
        <div className="paper-grain bg-paper py-14 sm:py-20">
          <Container className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
            <div className="min-w-0">
              <ContactForm honeypotName={CONTACT_HONEYPOT_FIELD} />
            </div>

            <aside aria-labelledby="next-title" className="min-w-0 lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)] lg:self-start">
              <h2 id="next-title" className="font-serif text-display-sm text-ink">
                {contactNextSteps.title}
              </h2>
              <ol className="mt-8 grid gap-7">
                {contactNextSteps.steps.map((step, i) => (
                  <li key={step.title} className="relative border-t border-line-strong pt-5">
                    <span aria-hidden className="absolute -top-[5px] left-0 size-2.5 rounded-full bg-accent" />
                    <h3 className="flex items-baseline gap-3 text-lg font-semibold tracking-[-0.01em] text-ink">
                      <span aria-hidden className="font-serif text-xl font-normal text-muted tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <span className="sr-only">Step {i + 1}: </span>
                        {step.title}
                      </span>
                    </h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-muted">
                      <PlaceholderText value={step.body} />
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-10 rounded-card bg-white p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
                <p className="text-sm text-muted">{contactForm.directEmailLabel}</p>
                <p className="mt-1.5 text-lg font-medium break-all text-ink">
                  <a
                    href={`mailto:${email}`}
                    className="rounded-sm underline decoration-ink/25 underline-offset-[5px] hover:decoration-ink"
                  >
                    <PlaceholderText value={site.contactEmail} />
                  </a>
                </p>
                <div className="mt-6 border-t border-line pt-5">
                  <p className="text-[0.9375rem] leading-relaxed text-pretty text-muted">{contactNextSteps.auditPrompt.body}</p>
                  <Button href={contactNextSteps.auditPrompt.cta.href} variant="link" icon="arrow-right" className="mt-3">
                    {contactNextSteps.auditPrompt.cta.label}
                  </Button>
                </div>
              </div>
            </aside>
          </Container>
        </div>
        <SectionTear color="var(--color-paper)" seed={65} flip grain />
      </div>
      <div aria-hidden className="h-16 sm:h-24" />
    </>
  );
}
