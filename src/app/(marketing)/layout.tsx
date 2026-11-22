import type { ReactNode } from "react";
import { SiteChrome } from "@/components/site/SiteChrome";

/** Every public marketing page gets the skip link, Nav, <main> and Footer. /admin does not. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
