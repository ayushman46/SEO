import type { PageCopy, Service } from "./types";

export const servicesPage = {
  metaTitle: "SEO and GEO services for small teams",
  metaDescription:
    "Eight fixed-scope services from seenhq: SEO and GEO audits, fixes, content, monitoring, AI fact-checks, local AI setup and AI crawler unblocking.",
  kicker: "Services",
  title: "Get found on Google and cited by AI, without hiring an agency",
  intro:
    "seenhq offers eight focused services for startups, SaaS teams and local businesses. Each one has a fixed scope and a clear deliverable, so you know exactly what you are paying for before we start. The SEO audit and GEO audit are delivered together as one Full audit, at one price. Three services look beyond your own website: an AI fact-check that corrects the sources behind wrong AI answers, a local AI visibility setup for the profiles AI assistants read, and an AI crawler unblock for sites that turn AI crawlers away without meaning to. Every service is done by a person, and none of them can promise what an AI will say.",
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
  {
    slug: "ai-fact-check",
    name: "AI fact-check & fix",
    tagline: "We check what AI assistants tell customers about you, and fix the sources behind wrong answers.",
    description:
      "An AI fact-check is a manual test of what AI assistants such as ChatGPT, Gemini, Perplexity, Microsoft Copilot and Google AI Overviews tell people about your business, compared line by line with the real facts you give us. For a local business that means hours, phone number, address and whether you are open; for a SaaS product or startup it means pricing, plans and features. We trace each wrong fact to the pages it most likely comes from, fix the sources you control, send correction requests for the rest and re-test after 30 days. In a Small Business Expo survey of 3,608 small business owners, 14.8% said AI search had shown wrong information about their business and a further 34.4% were not sure. We cannot control what an AI says or promise that an answer changes, or when: answers vary from one run to the next, so our screenshots are a dated sample, not a permanent record.",
    deliverables: [
      "A one-page truth sheet we fill in with you: name, address, phone, hours and open status for a local business, or plans, prices, limits and key features for a SaaS product",
      "10-12 fixed customer questions typed by a person into 4-5 AI assistants, twice each, with dated screenshots",
      "A scoring sheet marking every fact right, wrong, missing or confused with another business, with the source the assistant cited where it shows one",
      "Fixes to the sources you control: your website's facts or pricing page, structured data, Google Business Profile, Bing Places, Apple Business and up to 5 directories or listings (you complete any verification steps)",
      "Up to 5 correction requests to third-party pages that carry a wrong fact, plus feedback filed inside each assistant",
      "A re-test after 30 days with a before-and-after sheet",
      "What we don't promise: third-party sites may ignore correction requests, an assistant may keep repeating an old fact for a while, and we ask from our own location with your city named in the question, so your customers may see different answers",
      "The check alone is $69 [PLACEHOLDER]; fixing plus the 30-day re-test is from $199 [PLACEHOLDER] per location or product, confirmed before we start",
    ],
    forWho:
      "Local businesses whose hours, phone number, address or open status are stated wrongly by AI assistants, SaaS and startup founders whose pricing, plans or features are, and anyone who has never checked.",
    priceFrom: "From $69 [PLACEHOLDER]",
  },
  {
    slug: "local-ai-setup",
    name: "Local AI visibility setup",
    tagline: "Get your details right on the profiles AI assistants read beyond Google.",
    description:
      "Local AI visibility setup is a one-time, done-with-you project that puts your business facts right on the profiles AI assistants draw on beyond Google: Bing Places, Apple Business, Yelp or your country's equivalent, and the ChatGPT business profile where you are eligible. We write one master fact sheet, make every profile match it, build a review plan and check a set of local questions before and after. A BrightLocal survey of 1,002 US local business owners, published in October 2026, found 46% had not checked or did not know whether they appear in AI results. OpenAI currently lets local stores and restaurants claim a ChatGPT business profile only for an existing US listing, so elsewhere we prepare everything for when that opens up. A complete profile does not mean any AI assistant will recommend you, and we cannot promise the date a platform publishes a profile.",
    deliverables: [
      "Before and after: 10-12 local questions typed by a person into ChatGPT, Gemini and Google AI Mode, with dated screenshots",
      "One master fact sheet: name, address, phone, hours, categories, description and services",
      "Matching details on Google Business Profile, Bing Places, Apple Business, Yelp or your local equivalent, and 1-2 directories for your trade",
      "One screen-share call to walk you through each claim and verification step; you stay the admin, and we never handle your ID documents, codes or passwords",
      "Website checks: LocalBusiness structured data, a clear services, location and FAQ section, and AI crawlers not blocked",
      "A review plan: your review count and recency against 3 competitors, which review sites show up for your trade and city, and ready-to-use wording for asking customers, with no incentives and no filtering out of unhappy customers (Yelp does not allow asking for reviews, so the plan leaves it out)",
      "Help claiming your ChatGPT business profile, only where OpenAI allows it",
      "$149 [PLACEHOLDER] for one location; each extra location is priced the same",
    ],
    forWho:
      "Clinics, salons, restaurants, studios and trades with one or a few locations that have only ever set up a Google Business Profile and hear that customers now ask AI assistants for the best option nearby.",
    priceFrom: "$149 [PLACEHOLDER] per location",
  },
  {
    slug: "ai-crawler-unblock",
    name: "AI crawler unblock",
    tagline: "Find out what AI crawlers really get from your server, and fix what blocks them.",
    description:
      "AI crawler unblock is a fixed-scope job that tests what AI crawlers such as GPTBot, ClaudeBot and PerplexityBot actually receive from your server, not just what your robots.txt says. Blocks often sit in a CDN, firewall, security plugin or host setting that robots.txt never mentions: in one founder's scan of 591 websites, published on HackerNoon in November 2026, 100 refused GPTBot or ClaudeBot and only 4 said so in robots.txt. We find the layer doing the blocking, change the settings you control or write and follow up the support ticket to your host, set one consistent access policy and retest. A block set by your host is the host's decision. Our test requests do not come from the AI companies' own network addresses, so they can be wrong in either direction, and being reachable does not mean being cited.",
    deliverables: [
      "A status check of your key pages as each major AI crawler, compared with what your robots.txt declares",
      "The blocking layer named (CDN such as Cloudflare, firewall, security plugin, host or robots.txt), from response headers and screenshots of your settings",
      "The fix on a screen-share where the setting is yours to change, or a written support ticket to your host that we follow up",
      "One access policy that separates AI training crawlers from AI search and user-requested fetchers, based on a short questionnaire",
      "A retest after the fix and again two weeks later, because some blocks come and go, plus a check in Google Search Console that Google itself is not blocked",
      "What we don't promise: a host can refuse to lift a block, robots.txt is a request that crawlers may ignore, and allowing crawlers does not protect your content from AI training",
      "$149 [PLACEHOLDER]; changes to how a custom JavaScript app renders its pages are quoted separately",
    ],
    forWho:
      "Startup and SaaS founders and small businesses on Cloudflare or a managed host who never chose to block AI crawlers and cannot tell which layer is doing it.",
    priceFrom: "$149 [PLACEHOLDER]",
  },
] satisfies Service[];

/** Closing call to action on /services (added by frontend-designer for T006; content-seo may refine). */
export const servicesClosing = {
  title: "Not sure which service you need?",
  body: "Run the free audit first. It shows what is holding your site back, and we can tell you which service fits from there. Or just tell us about your site.",
  primaryCta: { label: "Tell us about your site", href: "/contact" },
  secondaryCta: { label: "Run a free audit", href: "/audit" },
};
