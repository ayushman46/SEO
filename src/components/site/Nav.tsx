import Link from "next/link";
import { site } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

const AUDIT_HREF = "/audit";
const CONTACT_HREF = "/contact";

/**
 * Floating pill nav. The header is sticky and transparent (pointer-events pass
 * through the gaps), so the home hero can slide its sky underneath it.
 * No sign-in in v1: the right side is Contact + the Free audit CTA.
 */
export function Nav() {
  const audit = site.nav.find((l) => l.href === AUDIT_HREF) ?? { label: "Free audit", href: AUDIT_HREF };
  const contact = site.nav.find((l) => l.href === CONTACT_HREF);
  const inline = site.nav.filter((l) => l.href !== AUDIT_HREF && l.href !== CONTACT_HREF);

  return (
    <header className="pointer-events-none sticky top-0 z-50 h-(--nav-h)">
      <Container size="wide" className="flex h-full items-center justify-between gap-3">
        <div className="pointer-events-auto flex items-center gap-1 rounded-pill bg-white/95 py-1.5 pr-1.5 pl-3.5 shadow-pill ring-1 ring-ink/[0.06]">
          <Link href="/" aria-label="seenhq home" className="mr-1 rounded-lg py-1 pr-2">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center">
              {inline.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex h-10 items-center rounded-pill px-4 text-[0.9375rem] font-medium text-ink-2 transition-colors hover:bg-paper hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <MobileMenu links={site.nav} cta={audit} className="lg:hidden" />
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {contact ? (
            <Link
              href={contact.href}
              className="hidden h-11 items-center rounded-pill bg-white/95 px-5 text-[0.9375rem] font-medium text-ink shadow-pill ring-1 ring-ink/[0.06] transition-colors hover:bg-white sm:inline-flex"
            >
              {contact.label}
            </Link>
          ) : null}
          <Button href={audit.href} size="md">
            {audit.label}
          </Button>
        </div>
      </Container>
    </header>
  );
}
