import type { SiteConfig } from "./types";

/**
 * Sitewide config. Anything containing "[PLACEHOLDER" must be replaced by the founder before launch.
 */
export const site = {
  name: "seenhq",
  tagline: "Be seen by people and by the machines they ask.",
  description:
    "seenhq audits your website for Google and AI answer engines like ChatGPT and Perplexity, then fixes what stops you from being found, cited and chosen.",
  contactEmail: "hello@seenhq.example [PLACEHOLDER]",
  location: "[PLACEHOLDER: City, Country]",
  nav: [
    { label: "Free audit", href: "/audit" },
    { label: "Services", href: "/services" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  footerGroups: [
    {
      title: "Product",
      links: [
        { label: "Free audit", href: "/audit" },
        { label: "Services", href: "/services" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Services",
      links: [
        { label: "SEO audit", href: "/services#seo-audit" },
        { label: "GEO audit", href: "/services#geo-audit" },
        { label: "Technical fixes", href: "/services#technical-fixes" },
        { label: "Content & entity", href: "/services#content-entity" },
        { label: "Monitoring", href: "/services#monitoring" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "llms.txt", href: "/llms.txt" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ],
  enginesTracked: [
    "ChatGPT",
    "Perplexity",
    "Claude",
    "Gemini",
    "Google AI Overviews",
    "Microsoft Copilot",
    "Google Search",
    "Bing",
  ],
} satisfies SiteConfig;

/** Last time the marketing copy was reviewed (ISO date). Used for sitemap lastModified and visible "updated" dates. */
export const contentUpdated = "2026-11-22";
