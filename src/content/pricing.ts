import type { FaqItem, PageCopy, PriceExtra, PricingTier } from "./types";
import { services } from "./services";
import { offerLines } from "./site";
import { catalogItem, formatPrice, largerJobPriceIn, type QuoteCurrency } from "@/lib/quote/catalog";

/** A service's published price, lower-cased for use mid-sentence ("From $99" → "from $99"). */
function servicePrice(slug: string): string {
  const s = services.find((x) => x.slug === slug);
  if (!s) throw new Error(`Unknown service "${slug}"`);
  return s.priceFrom.replace(/^From /, "from ");
}

/** The Fix sprint's larger-job starting price, read from the catalog (one source): "$249", "₹17,999". */
export function largerJobPriceText(currency: QuoteCurrency): string {
  const p = largerJobPriceIn(catalogItem("fix-sprint"), currency);
  if (!p) throw new Error(`No larger-job price for the Fix sprint in ${currency}`);
  return formatPrice(p.amount, currency);
}

export const pricingPage = {
  metaTitle: "Pricing: free audit, fixed prices, no contract",
  metaDescription:
    "Free SEO and GEO audit. Full audit $39, Fix sprint $149, monitoring $19 a month. Fixed prices, no contract, no minimum term and no exit fee.",
  kicker: "Pricing",
  // $19 (Monitoring, a month) is the lowest paid price, so "from $19" is the true floor.
  title: "Fixed prices from $19. No contract.",
  intro: "The audit is free. A Full audit reviewed by a person is $39, and a Fix sprint of up to 8 fixes is $149.",
} satisfies PageCopy;

/**
 * Header strip of the rate card on /pricing (R5, Fable's ruling 2): render `label`, then both
 * `lines`. Replaces the FIXED_LINE regex the page used to cut out of the intro.
 */
export const pricingRateCardHeader = {
  label: "Rates",
  lines: [offerLines.noContract, offerLines.proof],
} as const;

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
      "Typical fixes: robots.txt, sitemap, llms.txt, structured data, image sizes",
      "On one site, on a platform we can access",
      "Before/after proof for every fix",
    ],
    cta: { label: "Request a Fix sprint", href: "/contact?service=technical-fixes" },
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
    q: "What is the difference between the Full audit and the Fix sprint?",
    a: "The Full audit tells you what to fix and in what order. The Fix sprint is us making up to 8 of those fixes. You can buy the audit, fix the quick wins yourself and hand the rest to us.",
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
    a: "Yes. The audit works on any public website. For a Fix sprint we work within what your platform allows and tell you up front if something can't be changed there.",
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

/**
 * Short note under the USD tier grid. Carries the site's one market comparison, for the Full audit
 * and Fix sprint only (sources: docs/research/PRICING_RECOMMENDATION.md, appendix).
 */
export const pricingNote = `Prices are in US dollars. Our Full audit and Fix sprint are priced below typical freelancer and agency rates for the same scope. A job larger than 8 fixes gets a fixed quote from ${largerJobPriceText("USD")} before work starts.`;

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
/* Services that are not pricing tiers, in both currencies (R5 B12).   */
/* ------------------------------------------------------------------ */

/** One description per extra, shared by the dollar and rupee lists. */
const EXTRAS = [
  {
    slug: "ai-fact-check",
    description: "We compare what AI assistants say about you with your real facts and correct the sources behind wrong answers.",
  },
  {
    slug: "local-ai-setup",
    description: "We complete and align your business profiles, such as Google, Bing Places and the directories your customers use.",
  },
  {
    slug: "ai-crawler-unblock",
    description: "We find out why AI crawlers are turned away from your site and fix what is in your control.",
  },
  {
    slug: "content-entity",
    description: "We rewrite the openings of your key pages so they answer questions directly and make your business details match everywhere.",
  },
] as const;

function extra(slug: (typeof EXTRAS)[number]["slug"], price: string): PriceExtra {
  const s = services.find((x) => x.slug === slug);
  const e = EXTRAS.find((x) => x.slug === slug);
  if (!s || !e) throw new Error(`Unknown extra "${slug}"`);
  return { name: s.name, price, description: e.description, href: `/services#${slug}` };
}

/** Heading above the extras list in the USD view. The INR view keeps its own "India extras" heading. */
export const pricingExtrasHeading = "Other services";

/** "Other services" in US dollars: the same four rows as pricingIndiaExtras. Prices are the services page prices. */
export const pricingExtrasUsd = EXTRAS.map((e) => {
  const s = services.find((x) => x.slug === e.slug);
  if (!s) throw new Error(`Unknown extra "${e.slug}"`);
  return extra(e.slug, s.priceFrom);
}) satisfies PriceExtra[];

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
    "The same plans and the same work, priced in rupees for businesses in India. Prices exclude applicable taxes. We show the total including tax in writing before you pay.",
} as const;

/** "India extras": rupee prices for the services that are not pricing tiers. */
export const pricingIndiaExtras = [
  extra("ai-fact-check", "₹3,999"),
  extra("local-ai-setup", "₹3,999 per location"),
  extra("ai-crawler-unblock", "₹2,999"),
  extra("content-entity", "From ₹6,999"),
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
export const pricingNoteInr = `Rupee prices are for businesses based in India; elsewhere the US dollar prices apply. A job larger than 8 fixes gets a fixed quote from ${largerJobPriceText("INR")} before work starts.`;

/* ------------------------------------------------------------------ */
/* Pricing page repairs (T022, research change 11). Additive.          */
/* ------------------------------------------------------------------ */

/**
 * Taxes line under the USD tier grid (the INR view says it once in pricingIndiaHeading.intro).
 * Not "per site": Local AI setup is priced per location (R5 B11).
 */
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
      body: "A job within its published scope keeps its published price. A larger or more involved job gets a fixed quote in writing within two working days, before work starts.",
    },
    {
      title: "Work starts when you agree",
      body: "You pay nothing until you accept the quote in writing.",
    },
  ],
} as const;
