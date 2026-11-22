import type { PageCopy, Service } from "./types";

export const servicesPage = {
  metaTitle: "SEO and GEO services for small teams",
  metaDescription:
    "Five fixed-scope services from seenhq: SEO audit, GEO audit, technical fixes, content and entity work, and monthly monitoring. Plain pricing, no lock-in.",
  kicker: "Services",
  title: "Get found on Google and cited by AI, without hiring an agency",
  intro:
    "seenhq offers five focused services for startups, SaaS teams and local businesses. Each one has a fixed scope and a clear deliverable, so you know exactly what you are paying for before we start.",
} satisfies PageCopy;

export const services = [
  {
    slug: "seo-audit",
    name: "SEO audit",
    tagline: "A human review of what's holding your rankings back.",
    description:
      "An SEO audit is a structured check of how well search engines can crawl, index and understand your website. We start from the automated seenhq report, then review your key pages by hand and turn the findings into a short, prioritised plan.",
    deliverables: [
      "Full automated report across your key pages",
      "Manual review of titles, headings, internal links and indexing",
      "Structured data and Open Graph check",
      "Core Web Vitals summary with the likely causes",
      "A prioritised fix list, ranked by impact and effort",
    ],
    forWho:
      "Founders and owners who want to know exactly what to fix, and in what order, before spending on content or ads.",
    priceFrom: "From $49 [PLACEHOLDER]",
  },
  {
    slug: "geo-audit",
    name: "GEO audit",
    tagline: "See whether AI answer engines can read, trust and cite you.",
    description:
      "A GEO audit checks how ready your website is to be used as a source by AI answer engines such as ChatGPT, Perplexity, Claude, Gemini and Google AI Overviews. We review crawler access, answer-ready content and entity signals, and ask the engines a set of questions your customers would ask to see who they mention today.",
    deliverables: [
      "AI crawler access review (robots.txt and common firewall blocks)",
      "llms.txt check, or a ready-to-publish draft",
      "Answer-readiness review of your key pages",
      "Organization or LocalBusiness schema and entity consistency check",
      "Snapshot of answers to a set of customer-style questions, with sources noted",
    ],
    forWho:
      "SaaS teams and local businesses that rank on Google but rarely appear when people ask an AI assistant.",
    priceFrom: "From $49 [PLACEHOLDER]",
  },
  {
    slug: "technical-fixes",
    name: "Technical fixes",
    tagline: "A one-time sprint where we fix the issues for you.",
    description:
      "A technical fix sprint is a fixed-scope block of work where we implement the highest-impact fixes from your audit. That usually means meta tags, canonicals, robots.txt, sitemaps, structured data, llms.txt and the quick performance wins.",
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
      "Content and entity work makes your key pages easy to quote and makes your business easy to identify. We rewrite page openings into clear, answer-ready statements, add FAQs where they help, and align your name, description and details everywhere they appear.",
    deliverables: [
      "Answer-ready rewrites of up to five key page sections",
      "An FAQ block written from real customer questions",
      "A clear About page and consistent business description",
      "Entity checklist for your name, address and profiles across the web",
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
      "Monitoring is a monthly re-audit of your website with a short written summary. It catches the regressions that quietly undo good work, such as a redesign that drops your titles or a new firewall rule that blocks AI crawlers.",
    deliverables: [
      "Monthly re-audit of your key pages",
      "Short summary of what changed and what to fix",
      "Alerts when AI crawlers or search engines get blocked",
      "Cancel any month",
    ],
    forWho: "Anyone who has fixed their site once and wants to keep it that way.",
    priceFrom: "From $29/month [PLACEHOLDER]",
  },
] satisfies Service[];
