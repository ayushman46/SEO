import type { SiteConfig } from "./types";

/**
 * Sitewide config. contactEmail is intentionally empty: visitors reach us through the /contact form.
 * UI and JSON-LD must treat an empty contactEmail as "no public email".
 */
export const site = {
  name: "seenhq",
  tagline: "Be seen by people and by the machines they ask.",
  description:
    "seenhq audits your website for Google and AI answer engines like ChatGPT and Perplexity, then fixes what stops them reading and quoting it.",
  contactEmail: "",
  location: "Remote, worldwide",
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
        { label: "Fix sprint", href: "/services#technical-fixes" },
        { label: "Content & entity", href: "/services#content-entity" },
        { label: "Monitoring", href: "/services#monitoring" },
        { label: "AI fact-check & fix", href: "/services#ai-fact-check" },
        { label: "Local AI visibility setup", href: "/services#local-ai-setup" },
        { label: "AI crawler unblock", href: "/services#ai-crawler-unblock" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "How the audit works", href: "/methodology" },
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
export const contentUpdated = "2026-11-23";

/**
 * Label above the home engine strip (replaces the hard-coded "Checks how you show up in", which
 * overclaimed: the audit checks readiness, it does not report how you appear in these engines).
 */
export const enginesHeading = "We check your site against what these engines need";

/**
 * The two positioning lines (R5, Fable's ruling 2). One source: home renders them above the
 * services index (via home.servicesTeaser.body), /pricing in the rate-card header
 * (pricingRateCardHeader), /services in its intro.
 */
export const offerLines = {
  noContract: "Fixed prices. No contract, no minimum term, no exit fee.",
  proof: "Before/after proof: we re-run the audit after the work and send you what changed.",
} as const;

/** Small line under the engine strip. */
export const enginesDisclaimer =
  "Logos are trademarks of their respective owners. seenhq is not affiliated with or endorsed by them.";

/** Visible label for the "Last updated" line pages render next to contentUpdated. */
export const lastUpdatedLabel = "Last updated";

/** Copy for the sitewide 404 page (src/app/not-found.tsx). */
export const notFoundCopy = {
  kicker: "404",
  title: "Nothing to see here. Not even by us.",
  body: "The page you were looking for has moved or never existed.",
  primary: { label: "Back to home", href: "/" },
  secondary: { label: "Run a free audit", href: "/audit" },
} as const;
