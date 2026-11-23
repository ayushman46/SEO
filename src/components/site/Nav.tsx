import Link from "next/link";
import { sampleReportLinks } from "@/content/sample-report";
import { site } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";

const AUDIT_HREF = "/audit";
const CONTACT_HREF = "/contact";

/**
 * Floating pill nav. The header is sticky and transparent (pointer-events pass
 * through the gaps), so the home hero can slide its sky underneath it.
 * No sign-in in v1: the right side is Contact + the Free audit CTA.
 * After the hero it settles (rises a few px, the pill paper tightens, its shadow
 * deepens): CSS scroll-driven, compositor-only, off under reduced motion.
 */
export function Nav() {
  const audit = site.nav.find((l) => l.href === AUDIT_HREF) ?? { label: "Free audit", href: AUDIT_HREF };
  const contact = site.nav.find((l) => l.href === CONTACT_HREF);
  const inline = site.nav.filter((l) => l.href !== AUDIT_HREF && l.href !== CONTACT_HREF);
  // The sheet lists every page except the audit (it is the button under the list), plus the
  // two reading pages that are otherwise only in the footer.
  const methodology = site.footerGroups.flatMap((g) => g.links).find((l) => l.href === "/methodology");
  const menuLinks = [
    ...site.nav.filter((l) => l.href !== AUDIT_HREF),
    { label: "Sample report", href: sampleReportLinks.href },
    ...(methodology ? [methodology] : []),
  ];

  return (
    <header className="pointer-events-none sticky top-0 z-50 h-(--nav-h)">
      <Container size="wide" className="nav-settle flex h-full items-center justify-between gap-3">
        <div className="pointer-events-auto relative isolate flex items-center gap-1 rounded-pill py-1.5 pr-1.5 pl-3.5">
          {/* The pill paper is its own layer, so scroll can tighten it (scale) without resampling text (T025). */}
          <span
            aria-hidden
            className="nav-pill-bg absolute inset-0 -z-10 rounded-pill bg-white/95 shadow-pill ring-1 ring-ink/[0.06] after:absolute after:inset-0 after:rounded-pill after:opacity-0 after:shadow-float"
          />
          <Link href="/" aria-label="seenhq home" className="mr-1 rounded-lg py-1 pr-2">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center">
              {inline.map((link) => (
                <li key={link.href}>
                  <NavLink
                    href={link.href}
                    className="inline-flex h-10 items-center rounded-pill px-4 text-[0.9375rem] font-medium text-ink-2 decoration-accent decoration-2 underline-offset-[6px] transition-colors hover:bg-paper hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline"
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
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
          {/* the menu trigger sits where the sheet's close button appears (top right) */}
          <MobileMenu links={menuLinks} cta={audit} className="lg:hidden" />
        </div>
      </Container>
    </header>
  );
}
