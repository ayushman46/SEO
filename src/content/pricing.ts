import type { FaqItem, PageCopy, PriceExtra, PricingTier } from "./types";

export const pricingPage = {
  metaTitle: "Pricing: free audit, then pay as you go",
  metaDescription:
    "Start with a free SEO and GEO audit. Upgrade to a full audit, a one-time fix sprint or monthly monitoring, priced for startups and local businesses.",
  kicker: "Pricing",
  title: "Simple prices for small teams and local businesses",
  intro:
    "The seenhq audit is free. The Full audit and Monitoring have one fixed price per site. A fix sprint depends on how much needs fixing, so its price is a starting point: you get a fixed quote by email before any work starts, and you pay nothing until you agree to it. Monitoring can be cancelled any month. Prices are per site and exclude applicable taxes. We confirm scope and a fixed quote in writing before any paid work starts.",
} satisfies PageCopy;

export const pricingTiers = [
  {
    name: "Free audit",
    price: "$0",
    cadence: "per audit",
    description: "An automated SEO, GEO and performance check of your homepage and up to five more pages.",
    features: [
      "Overall, SEO, GEO and Performance scores",
      "Top three issues with fixes, shown straight away",
      "Full issue list unlocked with your email",
      "Just your email, no card needed",
    ],
    cta: { label: "Run a free audit", href: "/audit" },
  },
  {
    name: "Full audit",
    price: "$49",
    cadence: "one-time",
    description:
      "Our SEO audit and GEO audit in one review by a person, at one fixed price per site, with a written plan you can act on.",
    features: [
      "Everything in the free audit",
      "Covers up to 50 pages, not just six",
      "A person reads your key pages and checks what a script can't judge",
      "A written plan: what to fix first, what can wait, what to ignore",
      "A written walkthrough of your report, with a short call if you want one",
    ],
    cta: { label: "Request a full audit", href: "/contact?service=seo-audit" },
    highlighted: true,
  },
  {
    name: "Fix sprint",
    price: "From $199",
    cadence: "one-time",
    description: "We implement the highest-impact fixes from your audit for you, at a price agreed before we start.",
    features: [
      "Fixes for your top issues, agreed up front",
      "robots.txt, sitemap and llms.txt set up",
      "Structured data for your business and FAQs",
      "Quick performance wins",
      "Before-and-after re-audit",
    ],
    cta: { label: "Request a fix sprint", href: "/contact?service=technical-fixes" },
  },
  {
    name: "Monitoring",
    price: "$29",
    cadence: "/month",
    description: "Once a month we re-audit your site and email you a short written report on what changed.",
    features: [
      "Monthly re-audit of your key pages, done by us",
      "A short plain-English email on what changed",
      "A clear note in that email if something broke, such as search or AI crawlers being blocked",
      "Cancel any month by email",
    ],
    cta: { label: "Request monitoring", href: "/contact?service=monitoring" },
  },
] satisfies PricingTier[];

export const pricingFaq = [
  {
    q: "Is the seenhq audit really free?",
    a: "Yes. The automated audit is free and shows your scores and top three issues straight away. To see the full list of issues and fixes, you enter your email. No card is needed.",
  },
  {
    q: "What does the Full audit add to the free audit?",
    a: "The free audit is automated: it runs a fixed set of checks on your homepage and up to five more pages. In the Full audit a person reviews a much larger part of your site and judges what a script can't, such as whether a page really answers the question a customer would ask. You get a written plan that says what to fix first, what can wait and what to ignore, plus a written walkthrough of your report, with a short call if you want one.",
  },
  {
    q: "Is seenhq affordable for a local business?",
    a: "Yes. Our prices are set for small teams and local businesses such as clinics, cafés, studios and trades, not for enterprise budgets. A sensible path for a local site is a Full audit, a fix sprint if you would rather not make the changes yourself, and monitoring if you want someone to check each month that nothing has broken.",
  },
  {
    q: "What is the difference between the Full audit and the fix sprint?",
    a: "The Full audit tells you what to fix and in what order; the fix sprint is us doing the fixing. You can buy the audit, fix the quick wins yourself, and hand the rest to us.",
  },
  {
    q: "What does monitoring actually involve?",
    a: "Once a month we re-audit your key pages and email you a short written report on what changed since last month and what to fix. If something has broken, such as a new firewall rule blocking AI crawlers or a redesign dropping your page titles, the report says so clearly. It is a monthly check, not real-time tracking, and you can cancel any month by email.",
  },
  {
    q: "Do you offer anything beyond the audit, fix sprint and monitoring?",
    a: "Yes. Content and entity work, where we rewrite key page sections so they answer questions clearly, add an FAQ block and make your business details consistent everywhere, is a separate fixed-scope service. It is described on the services page, and we confirm the price by email before any work starts.",
  },
  {
    q: "Can you fix what AI assistants say about my business?",
    a: "We can fix the sources they read, not the answers themselves. Three services on the services page cover this: an AI fact-check & fix that compares what assistants say with your real facts and corrects the sources behind wrong answers, a local AI visibility setup for profiles such as Bing Places, Apple Business and Yelp, and an AI crawler unblock for sites that turn AI crawlers away without meaning to. Each has its own fixed price, and none of them can promise what an AI will say.",
  },
  {
    q: "Do you work with website builders like Wix, Squarespace, Shopify or WordPress?",
    a: "Yes. The audit works on any public website. For fix sprints we work within what your platform allows and tell you up front if something can't be changed there.",
  },
  {
    q: "Is there a minimum term for monitoring?",
    a: "No. There is no minimum term. Monitoring is billed monthly in advance, and it can be cancelled any time by email and stops at the end of the month you have paid for.",
  },
  {
    q: "How do I pay?",
    a: "Pay by bank transfer, UPI or card. Once we have agreed the scope by email, we send an invoice before work starts. Payment is due before work starts for one-time services; monitoring is billed monthly in advance.",
  },
  {
    q: "Do you offer pricing in rupees?",
    a: "Yes. Every plan has a price in Indian rupees for businesses in India: switch the prices on this page to India ₹ to see them. The free audit costs nothing, the Full audit and monitoring each have one fixed price, and a fix sprint is quoted in rupees by email before any work starts. There is no retainer and no minimum term.",
  },
] satisfies FaqItem[];

/** Label on the highlighted tier card. Factual, not a "most popular" claim (added by frontend-designer for T006). */
export const pricingHighlightLabel = "Reviewed by a person";

/** Short note under the tier grid (added by frontend-designer for T006; content-seo may refine). */
export const pricingNote =
  "Prices are in US dollars. Fix sprints and content work are quoted by email before any work starts, and you pay nothing until you agree to the quote. The AI fact-check, local AI setup and AI crawler unblock are priced on the services page.";

/** Heading above the pricing FAQ list. */
export const pricingFaqHeading = {
  kicker: "FAQ",
  title: "Questions about pricing",
  cta: { label: "Ask us anything else", href: "/contact" },
} as const;

/** Link from /pricing to the full service descriptions, including services that are not pricing tiers. */
export const pricingServicesLink = { label: "See every service in detail", href: "/services" } as const;

/** Closing call to action on /pricing (added by frontend-designer for T006; content-seo may refine). */
export const pricingClosing = {
  title: "Start free, then decide",
  body: "The free audit shows your scores and top issues in about a minute. If you want a person to look deeper, or want us to do the fixing, tell us about your site and we will reply with a fixed quote.",
  primaryCta: { label: "Tell us about your site", href: "/contact" },
  secondaryCta: { label: "Run a free audit", href: "/audit" },
};

/* ------------------------------------------------------------------ */
/* India pricing in rupees (T010). Additive: the USD exports above are */
/* unchanged. INR prices are display-only and never published as JSON-LD. */
/* ------------------------------------------------------------------ */

/** Labels for the currency switch on /pricing. */
export const currencyLabels = {
  /** Accessible name of the switch. */
  switchLabel: "Currency",
  /** Visible text before the switch. */
  intro: "Show prices in",
  usd: "USD $",
  inr: "India ₹",
} as const;

const inrPrices: Record<string, string> = {
  "Free audit": "₹0",
  "Full audit": "₹3,999",
  "Fix sprint": "From ₹14,999",
  Monitoring: "₹1,999",
};

/** The same tiers as `pricingTiers`, in the same order, priced in Indian rupees. Only the price differs. */
export const pricingTiersInr = pricingTiers.map((tier) => {
  const price = inrPrices[tier.name];
  if (!price) throw new Error(`Missing INR price for tier "${tier.name}"`);
  return { ...tier, price };
}) satisfies PricingTier[];

/** Heading and intro for the rupee price set (the #india-pricing section). */
export const pricingIndiaHeading = {
  kicker: "India",
  title: "India pricing in rupees",
  intro:
    "The same plans for businesses in India, priced in rupees. You get the same work and the same written plan as on the US dollar prices. Prices are per site and exclude applicable taxes. We confirm scope and a fixed quote in writing before any paid work starts.",
} as const;

/** "India extras": rupee prices for the AI-facing services. */
export const pricingIndiaExtras = [
  {
    name: "AI fact-check & fix",
    price: "From ₹4,999",
    description: "We compare what AI assistants say about you with your real facts and correct the sources behind wrong answers.",
    href: "/services#ai-fact-check",
  },
  {
    name: "Local AI visibility setup",
    price: "₹9,999 per location",
    description: "We complete and align your business profiles, such as Google, Bing Places and the directories your customers use.",
    href: "/services#local-ai-setup",
  },
  {
    name: "AI crawler unblock",
    price: "₹9,999",
    description: "We find out why AI crawlers are turned away from your site and fix what is in your control.",
    href: "/services#ai-crawler-unblock",
  },
] satisfies PriceExtra[];

/** Short notes under the rupee prices. Keep these honest; see docs/MARKET_RESEARCH.md. */
export const pricingIndiaNotes = [
  "Pay by bank transfer, UPI or card. We send an invoice before work starts.",
  "No retainer and no minimum term",
  "Prices are per site and exclude applicable taxes",
] as const;

/**
 * One verified market figure, with its source named in the sentence.
 * Source: docs/MARKET_RESEARCH.md, Local AI Starter (India), evidence list.
 */
export const pricingIndiaComparison = {
  text: "For comparison, OneCity in Bangalore lists its local-business GEO Starter plan at ₹25,000 to ₹45,000 a month.",
  source: { label: "OneCity pricing page", href: "https://onecity.co.in/generative-engine-optimization-services-bangalore" },
} as const;

/** Short note under the rupee tier grid. */
export const pricingNoteInr =
  "Prices are in Indian rupees for businesses in India. Fix sprints are quoted in rupees by email before any work starts, and you pay nothing until you agree to the quote.";

/* ------------------------------------------------------------------ */
/* Pricing page repairs (T022, research change 11). Additive.          */
/* ------------------------------------------------------------------ */

/** Taxes line shown next to the tier grids. */
export const pricingTaxNote = "Prices exclude applicable taxes. We show the total including tax in writing before you pay.";

/** "What happens after you order": three short steps under the tiers. */
export const pricingOrderSteps = {
  title: "What happens after you order",
  steps: [
    {
      title: "You get a quote",
      body: "Instantly from your free audit report, or by email after you tell us about your site.",
    },
    {
      title: "A person confirms it",
      body: "Fixed prices stay fixed. Where a price is a starting price, we confirm the final number within 1 business day.",
    },
    {
      title: "Work starts when you agree",
      body: "You pay nothing until you accept the quote in writing.",
    },
  ],
} as const;
