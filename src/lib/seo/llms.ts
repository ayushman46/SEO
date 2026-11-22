import { site, contentUpdated } from "@/content/site";
import { home } from "@/content/home";
import { services, servicesPage } from "@/content/services";
import { pricingPage } from "@/content/pricing";
import { aboutPage } from "@/content/about";
import { contactPage } from "@/content/contact";
import { auditPage } from "@/content/audit";
import { privacyMeta, termsMeta } from "@/content/legal";
import { absoluteUrl } from "./metadata";

/** Builds /llms.txt following the llmstxt.org format: H1, blockquote summary, details, then H2 link lists. */
export function buildLlmsTxt(): string {
  const link = (title: string, path: string, desc: string) => `- [${title}](${absoluteUrl(path)}): ${desc}`;
  const definitions = home.faq.filter((f) => /^What (is|are) /.test(f.q));

  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} (always written in lowercase) offers a free automated website audit that scores a site on SEO, GEO (Generative Engine Optimization) and mobile performance, plus fixed-scope services for startups, SaaS teams and local businesses. The audit reads a site's homepage and up to five internal pages, robots.txt, sitemap and llms.txt, and runs Google PageSpeed Insights. The full report is unlocked by entering an email address; nothing else is required.`,
    "",
    `Engines checked against: ${site.enginesTracked.join(", ")}. ${site.name} is not affiliated with any of them.`,
    "",
    `Last updated: ${contentUpdated}`,
    "",
    "## Key pages",
    "",
    link("Home", "/", "What seenhq is, how the audit works, and answers to common questions about SEO and GEO."),
    link("Free audit", "/audit", auditPage.metaDescription),
    link("Services", "/services", servicesPage.metaDescription),
    link("Pricing", "/pricing", pricingPage.metaDescription),
    link("About", "/about", aboutPage.metaDescription),
    link("Contact", "/contact", contactPage.metaDescription),
    "",
    "## Services",
    "",
    ...services.map((s) => link(s.name, `/services#${s.slug}`, s.tagline)),
    "",
    "## Definitions",
    "",
    ...definitions.map((f) => `- ${f.q} ${f.a}`),
    "",
    "## Optional",
    "",
    link("Privacy policy", "/privacy", privacyMeta.metaDescription),
    link("Terms of service", "/terms", termsMeta.metaDescription),
    link("Sitemap", "/sitemap.xml", "XML sitemap of all public pages."),
    "",
  ];
  return lines.join("\n");
}
