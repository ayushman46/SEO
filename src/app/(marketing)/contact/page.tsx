import { CONTACT_HONEYPOT_FIELD } from "@/app/actions/contact-schema";
import { contactForm, contactNextSteps, contactPage } from "@/content/contact";
import { site } from "@/content/site";
import { JsonLd, innerPageLd, pageMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHero } from "@/components/pages/PageHero";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { stripPlaceholder } from "@/components/ui/PlaceholderText";
import { Steps } from "@/components/ui/Steps";

export const metadata = pageMetadata.contact;

export default function ContactPage() {
  const email = stripPlaceholder(site.contactEmail).trim();

  return (
    <>
      <JsonLd data={innerPageLd({ name: "Contact", description: contactPage.metaDescription, path: "/contact" })} />
      <PageHero
        kicker={contactPage.kicker}
        title={contactPage.title}
        intro={contactPage.intro}
        motif="hands"
        seed={63}
        compact
      />

      <div className="mt-8 border-t border-line-strong sm:mt-10">
        <div className="paper-grain bg-paper py-10 sm:py-14">
          <Container className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
            <div className="min-w-0">
              <ContactForm honeypotName={CONTACT_HONEYPOT_FIELD} />
            </div>

            <aside aria-labelledby="next-title" className="min-w-0 lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)] lg:self-start">
              <h2 id="next-title" className="font-serif text-display-sm text-balance text-ink">
                {contactNextSteps.title}
              </h2>
              <Steps steps={contactNextSteps.steps} layout="list" className="mt-6" />

              <div className="mt-10 border-t border-ink pt-6">
                <p className="text-sm text-muted">{contactForm.directEmailLabel}</p>
                {email ? (
                  <p className="mt-1.5 text-lg font-medium break-all text-ink">
                    <a
                      href={`mailto:${email}`}
                      className="rounded-sm underline decoration-ink/25 underline-offset-[5px] hover:decoration-ink"
                    >
                      {email}
                    </a>
                  </p>
                ) : null}
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
      </div>
      <div aria-hidden className="h-16 sm:h-24" />
    </>
  );
}
