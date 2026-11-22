import type { FaqItem, PageCopy, PricingTier } from "./types";

export const pricingPage = {
  metaTitle: "Pricing: free audit, then pay as you go",
  metaDescription:
    "Start with a free SEO and GEO audit. Upgrade to a full audit, a one-time fix sprint or monthly monitoring, priced for startups and local businesses.",
  kicker: "Pricing",
  title: "Simple prices for small teams and local businesses",
  intro:
    "The seenhq audit is free. If you want a deeper review, hands-on fixes or ongoing monitoring, pick the option that fits. One-time prices are paid once, and monitoring can be cancelled any month.",
} satisfies PageCopy;

export const pricingTiers = [
  {
    name: "Free audit",
    price: "$0",
    cadence: "per audit",
    description: "An automated SEO, GEO and performance check of your homepage and up to five pages.",
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
    price: "$49 [PLACEHOLDER]",
    cadence: "one-time",
    description: "A human-reviewed SEO and GEO audit with a prioritised plan you can act on.",
    features: [
      "Everything in the free audit",
      "Manual review of your key pages",
      "AI answer snapshot for customer-style questions",
      "Prioritised fix list ranked by impact and effort",
      "A short call or written walkthrough [PLACEHOLDER]",
    ],
    cta: { label: "Request a full audit", href: "/contact?service=seo-audit" },
    highlighted: true,
  },
  {
    name: "Fix sprint",
    price: "$199 [PLACEHOLDER]",
    cadence: "one-time",
    description: "We implement the highest-impact fixes from your audit for you.",
    features: [
      "Fixes for your top issues, agreed up front",
      "robots.txt, sitemap and llms.txt set up",
      "Structured data for your business and FAQs",
      "Quick performance wins",
      "Before-and-after re-audit",
    ],
    cta: { label: "Book a fix sprint", href: "/contact?service=technical-fixes" },
  },
  {
    name: "Monitoring",
    price: "$29 [PLACEHOLDER]",
    cadence: "/month",
    description: "A monthly re-audit and summary so your site stays visible.",
    features: [
      "Monthly re-audit of your key pages",
      "Plain-English summary of changes",
      "Alerts when search or AI crawlers get blocked",
      "Cancel any month",
    ],
    cta: { label: "Start monitoring", href: "/contact?service=monitoring" },
  },
] satisfies PricingTier[];

export const pricingFaq = [
  {
    q: "Is the seenhq audit really free?",
    a: "Yes. The automated audit is free and shows your scores and top three issues straight away. To see the full list of issues and fixes, you enter your email. No card is needed.",
  },
  {
    q: "Is seenhq affordable for a local business?",
    a: "Yes. Our prices are set for small teams and local businesses such as clinics, cafés, studios and trades, not for enterprise budgets. Most local sites need a full audit and one fix sprint, then only occasional checks.",
  },
  {
    q: "What is the difference between the full audit and the fix sprint?",
    a: "The full audit tells you what to fix and in what order; the fix sprint is us doing the fixing. Many people buy the audit, fix the quick wins themselves, and hand the rest to us.",
  },
  {
    q: "Can I cancel monitoring?",
    a: "Yes. Monitoring is billed monthly and you can cancel any month by emailing us. There is no minimum term [PLACEHOLDER].",
  },
  {
    q: "Do you work with website builders like Wix, Squarespace, Shopify or WordPress?",
    a: "Yes. The audit works on any public website. For fix sprints we work within what your platform allows and tell you up front if something can't be changed there.",
  },
  {
    q: "How do I pay?",
    a: "After we agree the scope by email, we send an invoice [PLACEHOLDER: payment method]. Work starts once it is paid.",
  },
] satisfies FaqItem[];
