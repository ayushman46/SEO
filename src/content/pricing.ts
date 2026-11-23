import type { FaqItem, PageCopy, PriceExtra, PricingTier } from "./types";
import { services } from "./services";

/** A service's published price, lower-cased for use mid-sentence ("From $99" → "from $99"). */
function servicePrice(slug: string): string {
  const s = services.find((x) => x.slug === slug);
  if (!s) throw new Error(`Unknown service "${slug}"`);
  return s.priceFrom.replace(/^From /, "from ");
}

export const pricingPage = {
  metaTitle: "Pricing: free audit, then pay as you go",
  metaDescription:
    "Free SEO and GEO audit. Full audit $39, fix sprint $149, monitoring $19 a month. Fixed prices, no contract, no minimum term and no exit fee.",
  kicker: "Pricing",
  title: "Prices for small teams and local businesses",
  intro:
    "The audit is free. Fixed prices. No contract, no minimum term, no exit fee. Before/after proof: we re-run the audit after the work and send you what changed. Our Full audit and Fix sprint are priced below typical freelancer and agency rates for the same scope. We confirm scope and a fixed quote in writing before any paid work starts.",
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
      "No card needed",
    ],
    cta: { label: "Run a free audit", href: "/audit" },
  },
  {
    name: "Full audit",
    price: "$39",
    cadence: "one-time",
    description:
      "A person reviews up to 15 pages for SEO and GEO and emails you a written plan.",
    features: [
      "Everything in the free audit",
      "Covers up to 15 pages, not just six",
      "A person reads your key pages and checks what a script can't judge",
      "A written plan: what to fix first, what can wait, what to ignore",
      "A written walkthrough of your report, by email",
    ],
    cta: { label: "Request a full audit", href: "/contact?service=seo-audit" },
    highlighted: true,
  },
  {
    name: "Fix sprint",
    price: "$149",
    cadence: "one-time",
    description: "Up to 8 fixes from your audit on one site, at a fixed price. Larger jobs get a fixed quote before work starts.",
    features: [
      "Up to 8 fixes from your audit, agreed up front",
      "robots.txt, sitemap and llms.txt set up",
      "Structured data for your business and FAQs",
      "Quick performance wins",
      "Before/after proof for every fix",
    ],
    cta: { label: "Request a fix sprint", href: "/contact?service=technical-fixes" },
  },
  {
    name: "Monitoring",
    price: "$19",
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
    a: "Yes. Scores and your top three issues show straight away. The full list of issues and fixes needs your email. No card.",
  },
  {
    q: "What does the Full audit add to the free audit?",
    a: "A person. The free audit runs fixed checks on six pages. In the Full audit someone reads up to 15 pages, judges what a script can't, such as whether a page really answers a customer's question, and emails you a plan: what to fix first, what can wait and what to ignore.",
  },
  {
    q: "What is the difference between the Full audit and the fix sprint?",
    a: "The Full audit tells you what to fix and in what order. The fix sprint is us making up to 8 of those fixes. You can buy the audit, fix the quick wins yourself and hand the rest to us.",
  },
  {
    q: "What does monitoring actually involve?",
    a: "Once a month we re-audit your key pages and email you what changed and what to fix. It is a monthly check, not real-time tracking. There is no minimum term: it is billed monthly in advance, and if you cancel by email it stops at the end of the month you have paid for.",
  },
  {
    q: "Can you fix what AI assistants say about my business?",
    a: `We can fix the sources they read, not the answers. Three services do this: AI fact-check & fix (${servicePrice("ai-fact-check")}), local AI visibility setup (${servicePrice("local-ai-setup")}) and AI crawler unblock (${servicePrice("ai-crawler-unblock")}). Content and entity work (${servicePrice("content-entity")}) rewrites your key pages so they answer questions directly. None of these can promise what an AI will say.`,
  },
  {
    q: "Do you work with website builders like Wix, Squarespace, Shopify or WordPress?",
    a: "Yes. The audit works on any public website. For fix sprints we work within what your platform allows and tell you up front if something can't be changed there.",
  },
  {
    q: "How do I pay?",
    a: "Pay by bank transfer, UPI or card. Once we have agreed the scope by email, we send an invoice before work starts. Payment is due before work starts for one-time services; monitoring is billed monthly in advance.",
  },
  {
    q: "Do you offer pricing in rupees?",
    a: "Yes. Switch the prices on this page to India ₹. Every service has a rupee price.",
  },
] satisfies FaqItem[];

/** Label on the highlighted tier card. Factual, not a "most popular" claim (added by frontend-designer for T006). */
export const pricingHighlightLabel = "Reviewed by a person";

/** Short note under the tier grid (added by frontend-designer for T006; content-seo may refine). */
export const pricingNote =
  "Prices are in US dollars. A job larger than 8 fixes gets a fixed quote from $249 before work starts. The AI fact-check, local AI setup, AI crawler unblock and content work are priced on the services page.";

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
  title: "Start with the audit",
  body: "It takes about a minute. If you want a person to look deeper or do the fixing, tell us about your site and we reply with a fixed quote.",
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
  "Full audit": "₹2,999",
  "Fix sprint": "₹9,999",
  Monitoring: "₹999",
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
    "The same plans and the same work, priced in rupees for businesses in India. Prices are per site and exclude applicable taxes. We show the total including tax in writing before you pay.",
} as const;

/** "India extras": rupee prices for the services that are not pricing tiers. */
export const pricingIndiaExtras = [
  {
    name: "AI fact-check & fix",
    price: "₹3,999",
    description: "We compare what AI assistants say about you with your real facts and correct the sources behind wrong answers.",
    href: "/services#ai-fact-check",
  },
  {
    name: "Local AI visibility setup",
    price: "₹3,999 per location",
    description: "We complete and align your business profiles, such as Google, Bing Places and the directories your customers use.",
    href: "/services#local-ai-setup",
  },
  {
    name: "AI crawler unblock",
    price: "₹2,999",
    description: "We find out why AI crawlers are turned away from your site and fix what is in your control.",
    href: "/services#ai-crawler-unblock",
  },
  {
    name: "Content & entity",
    price: "From ₹6,999",
    description: "We rewrite the openings of your key pages so they answer questions directly and make your business details match everywhere.",
    href: "/services#content-entity",
  },
] satisfies PriceExtra[];

/** Short notes under the rupee prices. Keep these honest; see docs/MARKET_RESEARCH.md. */
export const pricingIndiaNotes = [
  "UPI, bank transfer or card, against an invoice we send before work starts",
  "No retainer and no minimum term",
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
  "Rupee prices are for businesses based in India; elsewhere the US dollar prices apply. A job larger than 8 fixes gets a fixed quote from ₹17,999 before work starts.";

/* ------------------------------------------------------------------ */
/* Pricing page repairs (T022, research change 11). Additive.          */
/* ------------------------------------------------------------------ */

/** Taxes line under the USD tier grid (the INR view says it once in pricingIndiaHeading.intro). */
export const pricingTaxNote = "Prices are per site and exclude applicable taxes. We show the total including tax in writing before you pay.";

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
