import type { PageCopy, Service } from "./types";

export const servicesPage = {
  metaTitle: "SEO and GEO services for small teams",
  metaDescription:
    "Five fixed-scope services from seenhq: SEO audit, GEO audit, technical fixes, content and entity work, and monthly monitoring. Plain pricing, no lock-in.",
  kicker: "Services",
  title: "Get found on Google and cited by AI, without hiring an agency",
  intro:
    "seenhq offers five focused services for startups, SaaS teams and local businesses. Each one has a fixed scope and a clear deliverable, so you know exactly what you are paying for before we start. The SEO audit and GEO audit are delivered together as one Full audit, at one price.",
} satisfies PageCopy;

const FULL_AUDIT_NOTE =
  "The SEO audit and GEO audit are delivered together as the Full audit: one review by a person, one fixed price per site.";

export const services = [
  {
    slug: "seo-audit",
    name: "SEO audit",
    tagline: "A person reviews what's holding your rankings back.",
    description: `An SEO audit is a structured check of how well search engines can crawl, index and understand your website. We go well beyond the free tool's six pages, review your key pages by hand and turn the findings into a short, written, prioritised plan. ${FULL_AUDIT_NOTE}`,
    deliverables: [
      "Review of up to 50 pages [PLACEHOLDER], not just the six the free audit reads",
      "Manual check of titles, headings, internal links and indexing",
      "Structured data and social sharing (Open Graph) check",
      "Core Web Vitals summary with the likely causes",
      "A written plan: what to fix first, what can wait and what to ignore",
      "A short call or written walkthrough [PLACEHOLDER]",
    ],
    forWho:
      "Founders and owners who want to know exactly what to fix, and in what order, before spending on content or ads.",
    priceFrom: "$49 [PLACEHOLDER] as part of the Full audit",
  },
  {
    slug: "geo-audit",
    name: "GEO audit",
    tagline: "Check whether AI answer engines can read, understand and quote your site.",
    description: `A GEO audit checks how ready your website is to be used as a source by AI answer engines such as ChatGPT, Perplexity, Claude, Gemini and Google AI Overviews. We review whether their crawlers can get in, whether your pages answer questions clearly enough to be quoted, and whether your site states plainly who you are. ${FULL_AUDIT_NOTE}`,
    deliverables: [
      "AI crawler access review (robots.txt and common firewall blocks)",
      "llms.txt check, or a ready-to-publish draft",
      "Answer-readiness review of your key pages, judged by a person",
      "Organization or LocalBusiness schema check, and whether your business name is consistent across your site",
      "Written recommendations in the same plan as your SEO audit",
    ],
    forWho:
      "SaaS teams and local businesses that rank on Google but want their site to be easy for AI assistants to read and quote.",
    priceFrom: "$49 [PLACEHOLDER] as part of the Full audit",
  },
  {
    slug: "technical-fixes",
    name: "Technical fixes",
    tagline: "A one-time sprint where we fix the issues for you.",
    description:
      "A technical fix sprint is a fixed-scope block of work where we implement the highest-impact fixes from your audit. That usually means meta tags, canonicals, robots.txt, sitemaps, structured data, llms.txt and the quick performance wins. The price depends on how much needs fixing, and you get a fixed quote before we start.",
    deliverables: [
      "Fixes for the top issues in your report, agreed up front",
      "robots.txt, sitemap and llms.txt set up correctly",
      "Organization or LocalBusiness and FAQ structured data",
      "Quick performance wins such as image sizing and render-blocking scripts",
      "A before-and-after re-audit so you can see what changed",
    ],
    forWho:
      "Teams without a developer to spare, and businesses on website builders who would rather not touch the code.",
    priceFrom: "From $199 [PLACEHOLDER]",
  },
  {
    slug: "content-entity",
    name: "Content & entity",
    tagline: "Pages that answer the question and make clear who you are.",
    description:
      "Content and entity work makes your key pages easy to quote and makes your business easy to identify. An entity is your business as search and AI engines understand it: one name, one clear description and one set of details they can match across the web. We rewrite page openings into clear, answer-ready statements, add FAQs where they help, and align your name, description and details everywhere they appear. The price depends on how many pages are involved, and you get a fixed quote before we start.",
    deliverables: [
      "Answer-ready rewrites of up to five key page sections",
      "An FAQ block written from real customer questions",
      "A clear About page and consistent business description",
      "A checklist for keeping your name, address and profiles consistent across the web",
    ],
    forWho:
      "Businesses whose pages look good but don't say plainly what they do, for whom, and where.",
    priceFrom: "From $149 [PLACEHOLDER]",
  },
  {
    slug: "monitoring",
    name: "Monitoring",
    tagline: "A monthly check so problems don't creep back in.",
    description:
      "Monitoring is a monthly re-audit of your website, done by us, with a short written report by email. It catches the regressions that quietly undo good work, such as a redesign that drops your titles or a new firewall rule that blocks AI crawlers. It is a monthly check, not real-time tracking.",
    deliverables: [
      "Monthly re-audit of your key pages",
      "A short email on what changed since last month and what to fix",
      "A clear note in that email if something broke, such as search engines or AI crawlers being blocked",
      "Cancel any month by email",
    ],
    forWho: "Anyone who has fixed their site once and wants to keep it that way.",
    priceFrom: "$29/month [PLACEHOLDER]",
  },
] satisfies Service[];

/** Closing call to action on /services (added by frontend-designer for T006; content-seo may refine). */
export const servicesClosing = {
  title: "Not sure which service you need?",
  body: "Run the free audit first. It shows what is holding your site back, and we can tell you which service fits from there. Or just tell us about your site.",
  primaryCta: { label: "Tell us about your site", href: "/contact" },
  secondaryCta: { label: "Run a free audit", href: "/audit" },
};
