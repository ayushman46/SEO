import type { PageCopy, Service } from "./types";
import { offerLines } from "./site";
import { catalogItem, formatPrice, largerJobPriceIn } from "@/lib/quote/catalog";

export const servicesPage = {
  metaTitle: "Fixed-price SEO and GEO services, no contract",
  metaDescription:
    "Fixed-price SEO and GEO services done by a person: Full audit $39, Fix sprint $149 for up to 8 code fixes, monitoring $19 a month. No contract.",
  kicker: "Services",
  title: "Eight services at published prices, no contract",
  // The page-level limit (Fable's ruling 4): stated once here; cards keep only limits unique to them.
  intro: `Each has a fixed scope and is done by a person. ${offerLines.proof} We cannot control what Google or an AI shows, so no service promises a ranking or a citation.`,
} satisfies PageCopy;

/** Label of the one action on each service card; it links to /contact?service=<slug> (Fable's ruling 4). */
export const serviceCardCta = {
  label: "Order this",
  /** screen-reader suffix after the label: "Order this: Fix sprint" */
  srSuffix: (name: string) => `: ${name}`,
} as const;

/** Larger-job starting price of the Fix sprint, from the catalog (one source; tests/quote/catalog.test.ts). */
const fixSprintLargerJob = (() => {
  const p = largerJobPriceIn(catalogItem("fix-sprint"), "USD");
  if (!p) throw new Error("The Fix sprint has no larger-job price in the catalog");
  return formatPrice(p.amount, "USD");
})();

/** The SEO and GEO audits are one product (the Full audit): both cards say so, and show one price for both. */
const fullAuditNote = (other: "SEO" | "GEO") => `It comes with the ${other} audit as one Full audit.`;
const FULL_AUDIT_PRICE = "Included in the Full audit · $39";

export const services = [
  {
    slug: "seo-audit",
    name: "SEO audit",
    tagline: "A person reviews what's holding your rankings back.",
    description: `A person reviews up to 15 pages of your site, not the six the free audit reads, and emails you a short plan: what to fix first, what can wait and what to ignore. ${fullAuditNote("GEO")}`,
    deliverables: [
      "Review of up to 15 pages, not just the six the free audit reads",
      "Manual check of titles, headings, internal links and indexing",
      "Structured data and social sharing (Open Graph) check",
      "Core Web Vitals summary with the likely causes",
      "A written plan: what to fix first, what can wait and what to ignore",
    ],
    forWho:
      "Founders and owners who want to know exactly what to fix, and in what order, before spending on content or ads.",
    priceFrom: FULL_AUDIT_PRICE,
  },
  {
    slug: "geo-audit",
    name: "GEO audit",
    tagline: "A person checks whether AI answer engines can read and quote your site.",
    description: `A person checks whether AI answer engines such as ChatGPT, Perplexity and Google AI Overviews can use your site as a source: whether their crawlers get in, whether your pages answer questions clearly enough to quote, and whether the site says plainly who you are. ${fullAuditNote("SEO")}`,
    deliverables: [
      "AI crawler access review (robots.txt and common firewall blocks)",
      "llms.txt check, or a ready-to-publish draft",
      "Answer-readiness review of your key pages, judged by a person",
      "Organization or LocalBusiness schema check, and whether your business name is consistent across your site",
      "Written recommendations in the same plan as your SEO audit",
    ],
    forWho:
      "SaaS teams and local businesses that rank on Google but want their site to be easy for AI assistants to read and quote.",
    priceFrom: FULL_AUDIT_PRICE,
  },
  {
    slug: "technical-fixes",
    name: "Fix sprint",
    tagline: "A one-time sprint where we fix the issues for you.",
    description: `We make up to 8 of the highest-impact code fixes from your audit, on one site and a platform we can access. Larger jobs get a fixed quote from ${fixSprintLargerJob} before work starts.`,
    deliverables: [
      "Up to 8 code fixes from your report, agreed up front",
      "Typical fixes: page titles and descriptions, robots.txt, sitemap, structured data, llms.txt and image sizes",
      "Before/after proof for every fix",
    ],
    forWho:
      "Teams without a developer to spare, and businesses on website builders who would rather not touch the code.",
    priceFrom: "$149",
  },
  {
    slug: "content-entity",
    name: "Content & entity",
    tagline: "Pages that answer the question and make clear who you are.",
    description:
      "We rewrite the openings of your key pages so they answer the question directly, add FAQs where they help, and make your business name, description and contact details the same everywhere they appear. The price depends on how many pages we rewrite.",
    deliverables: [
      "Answer-ready rewrites of up to five key page sections",
      "An FAQ block written from real customer questions",
      "A clear About page and consistent business description",
      "A checklist for keeping your name, address and profiles consistent across the web",
    ],
    forWho:
      "Businesses whose pages look good but don't say plainly what they do, for whom, and where.",
    priceFrom: "From $99",
  },
  {
    slug: "monitoring",
    name: "Monitoring",
    tagline: "A monthly check so problems don't creep back in.",
    description:
      "Once a month we re-audit your site and email you what changed and what to fix, such as a redesign that dropped your titles or a firewall rule that now blocks AI crawlers. It is a monthly check, not real-time tracking.",
    deliverables: [
      "Monthly re-audit of your key pages",
      "A short email on what changed since last month and what to fix",
      "A clear note in that email if something broke, such as search engines or AI crawlers being blocked",
      "Cancel any month by email",
    ],
    forWho: "Anyone who has fixed their site once and wants to keep it that way.",
    priceFrom: "$19/month",
  },
  {
    slug: "ai-fact-check",
    name: "AI fact-check & fix",
    tagline: "We check what AI assistants tell customers about you, and fix the sources behind wrong answers.",
    description:
      "A person asks 4 AI assistants, such as ChatGPT, Gemini and Google AI Overviews, up to 10 questions about your business and compares every answer with the facts you give us: hours, phone and address for a local business, or pricing, plans and features for a product. We trace each wrong fact to its likely source, fix the sources you control, request corrections on the rest and re-test after 30 days.",
    deliverables: [
      "A one-page truth sheet we fill in with you: name, address, phone, hours and open status for a local business, or plans, prices, limits and key features for a SaaS product",
      "Up to 10 fixed customer questions typed by a person into 4 AI assistants, twice each, with dated screenshots",
      "A scoring sheet marking every fact right, wrong, missing or confused with another business, with the source the assistant cited where it shows one",
      "Fixes to the sources you control: your website's facts or pricing page, structured data, Google Business Profile, Bing Places, Apple Business and up to 5 directories or listings (you complete any verification steps)",
      "Up to 5 correction requests to third-party pages that carry a wrong fact, plus feedback filed inside each assistant",
      "A re-test after 30 days with a before-and-after sheet",
      "Not promised: answers vary between runs and by location, third-party sites may ignore requests, and an assistant may repeat an old fact for a while",
      "One price for the check, the fixes and the 30-day re-test, for one location or product",
    ],
    forWho:
      "Any business whose hours, contact details, prices or features AI assistants get wrong, and any business that has never looked.",
    priceFrom: "$59",
  },
  {
    slug: "local-ai-setup",
    name: "Local AI visibility setup",
    tagline: "Get your details right on the profiles AI assistants read beyond Google.",
    description:
      "We correct your business facts on the profiles AI assistants read beyond Google: Bing Places, Apple Business, Yelp or a local equivalent, and the ChatGPT business profile where you are eligible. We write one fact sheet and make every profile match it. OpenAI currently lets local stores and restaurants claim a ChatGPT business profile only for an existing US listing; elsewhere we prepare it for when that opens. Each platform publishes profiles on its own schedule.",
    deliverables: [
      "Before and after: 10-12 local questions typed by a person into ChatGPT, Gemini and Google AI Mode, with dated screenshots",
      "One master fact sheet: name, address, phone, hours, categories, description and services",
      "Matching details on Google Business Profile, Bing Places, Apple Business, Yelp or your local equivalent, and 1-2 directories for your trade",
      "One screen-share call to walk you through each claim and verification step; you stay the admin, and we never handle your ID documents, codes or passwords",
      "Website checks: LocalBusiness structured data, a clear services, location and FAQ section, and AI crawlers not blocked",
      "A review plan: your reviews against 3 competitors, the review sites that matter for your trade and city, and wording for asking customers. No incentives, no filtering out unhappy customers, and no asking on Yelp, which forbids it",
      "Help claiming your ChatGPT business profile, only where OpenAI allows it",
    ],
    forWho:
      "Clinics, salons, restaurants, studios and trades with one or a few locations and nothing set up beyond a Google Business Profile.",
    priceFrom: "$99 per location",
  },
  {
    slug: "ai-crawler-unblock",
    name: "AI crawler unblock",
    tagline: "Find out what AI crawlers really get from your server, and fix what blocks them.",
    description:
      "We test what AI crawlers such as GPTBot, ClaudeBot and PerplexityBot actually receive from your server, which is often not what your robots.txt says: the block can sit in a CDN, firewall, security plugin or host setting. We name the layer, change the settings you control or chase your host with a support ticket, then retest. Our requests are simulated from our own servers, so the real crawler may be treated differently.",
    deliverables: [
      "A status check of your key pages as each major AI crawler, compared with what your robots.txt declares",
      "The blocking layer named (CDN such as Cloudflare, firewall, security plugin, host or robots.txt), from response headers and screenshots of your settings",
      "The fix on a screen-share where the setting is yours to change, or a written support ticket to your host that we follow up",
      "One access policy that separates AI training crawlers from AI search and user-requested fetchers, based on a short questionnaire",
      "A retest after the fix and again two weeks later, because some blocks come and go, plus a check in Google Search Console that Google itself is not blocked",
      "Not promised: a host can refuse to lift a block, and crawlers can ignore robots.txt",
      "If the block is only in robots.txt, a Fix sprint fixes it at no extra cost",
      "Changes to how a custom JavaScript app renders its pages are quoted separately",
    ],
    forWho:
      "Startup and SaaS founders and small businesses on Cloudflare or a managed host who never chose to block AI crawlers and cannot tell which layer is doing it.",
    priceFrom: "$49",
  },
] satisfies Service[];

/** Closing call to action on /services (added by frontend-designer for T006; content-seo may refine). */
export const servicesClosing = {
  title: "Start with the free audit",
  body: "It shows what is wrong, and we can tell you which service fits. Or tell us about your site.",
  primaryCta: { label: "Tell us about your site", href: "/contact" },
  secondaryCta: { label: "Run a free audit", href: "/audit" },
};
