import Link from "next/link";
import { contentUpdated, site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { PlaceholderText, hasPlaceholder } from "@/components/ui/PlaceholderText";
import { tornBand } from "@/components/collage/torn";
import { Logo } from "./Logo";

const year = contentUpdated.slice(0, 4);

export function Footer() {
  const emailIsReal = !hasPlaceholder(site.contactEmail);
  return (
    <footer className="relative mt-auto">
      {/* torn paper edge into the footer */}
      <div aria-hidden className="paper-grain h-10 bg-paper sm:h-14" style={{ clipPath: tornBand({ seed: 11, amp: 28, base: 55 }) }} />
      <div className="paper-grain bg-paper">
        <Container className="pt-8 pb-10 sm:pt-10">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
            <div className="max-w-sm">
              <Link href="/" aria-label="seenhq home" className="inline-block rounded-lg">
                <Logo size="lg" />
              </Link>
              <p className="mt-5 font-serif text-[1.625rem] leading-tight text-ink-2">{site.tagline}</p>
              <p className="mt-5 text-sm text-muted">
                {emailIsReal ? (
                  <a href={`mailto:${site.contactEmail}`} className="underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                    {site.contactEmail}
                  </a>
                ) : (
                  <PlaceholderText value={site.contactEmail} />
                )}
              </p>
            </div>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
              {site.footerGroups.map((group) => (
                <div key={group.title}>
                  <h2 className="text-kicker font-semibold text-muted uppercase">{group.title}</h2>
                  <ul className="mt-4 space-y-1">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="inline-flex min-h-8 items-center rounded-sm text-[0.9375rem] text-ink-2 transition-colors hover:text-accent-ink"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-16 flex flex-col gap-3 border-t border-line-strong/70 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} seenhq · <PlaceholderText value={site.location} />
            </p>
            <p>Imagery: public-domain works by Leonardo da Vinci and Michelangelo, The Met (CC0), NASA, and CC0 sky photography.</p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
