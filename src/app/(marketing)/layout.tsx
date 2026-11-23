import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";
import { SiteChrome } from "@/components/site/SiteChrome";

/**
 * Every public marketing page gets the skip link, Nav, <main> and Footer, plus
 * the lazy smooth-scroll island (T025). /admin gets neither.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteChrome>{children}</SiteChrome>
      <SmoothScroll />
    </>
  );
}
