import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

/**
 * Marketing chrome: skip link, floating Nav, the single <main id="main"> landmark
 * and the Footer. Used by src/app/(marketing)/layout.tsx and the root not-found page.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
