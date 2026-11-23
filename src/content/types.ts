/**
 * CONTRACT — owned by Fable. content-seo fills these; frontend-designer renders them.
 * Rule: no invented customers, logos, testimonials, stats-about-us or "used by N teams".
 * Anything the founder must replace is wrapped as { placeholder: true } or contains "[PLACEHOLDER".
 */

export interface Cta {
  label: string;
  href: string;
}

export interface FeatureItem {
  /** lucide-style icon key the UI maps to an inline SVG: "search" | "sparkles" | "gauge" | "file" | "bot" | "link" | "list" | "shield" | "clock" | "chart" | "eye" | "map-pin" */
  icon: string;
  title: string;
  body: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Service {
  slug: string; // anchor id on /services
  name: string;
  tagline: string;
  description: string;
  deliverables: string[];
  forWho: string;
  priceFrom: string; // e.g. "From $49 [PLACEHOLDER]"
}

export interface PricingTier {
  name: string;
  price: string; // display string, placeholder-marked
  cadence: string; // "one-time" | "/month"
  description: string;
  features: string[];
  cta: Cta;
  highlighted?: boolean;
}

export interface SiteConfig {
  name: "seenhq";
  tagline: string;
  description: string; // ~155 chars, used as default meta description
  contactEmail: string; // placeholder-marked
  location: string; // placeholder-marked
  nav: Cta[];
  footerGroups: { title: string; links: Cta[] }[];
  /** AI engines we check against — text wordmarks only, no logos, no endorsement */
  enginesTracked: string[];
}

export interface HomeContent {
  // hero.eyebrow, hero.secondaryCta, proofLine, problem.kicker, tabs[].body, howItWorks.title and
  // pricingTeaser were removed in T031 and restored in T033 with the v1.1 home layout.
  hero: { eyebrow: string; title: string; subtitle: string; primaryCta: Cta; secondaryCta: Cta };
  proofLine: string; // one honest positioning line between hairlines, above the engine strip
  problem: { kicker: string; title: string; body: string; points: FeatureItem[] };
  tabs: { id: string; label: string; title: string; body: string; bullets: FeatureItem[] }[]; // 4 tabs: SEO, GEO, Performance, Fixes
  /** `kicker` is also the heading of AuditSteps on /audit. */
  howItWorks: { kicker: string; title: string; steps: { title: string; body: string }[] };
  sampleReport: { kicker: string; title: string; body: string; note: string }; // note: "Illustrative sample report"
  servicesTeaser: { kicker: string; title: string; body: string };
  pricingTeaser: { kicker: string; title: string; body: string; cta: Cta };
  nightSky: { kicker: string; title: string; body: string; cta: Cta }; // dark section
  faq: FaqItem[];
  finalCta: { title: string; body: string; cta: Cta };
}

export interface PageCopy {
  /** <title> without brand suffix */
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  title: string;
  intro: string;
}

export interface LegalDoc {
  title: string;
  updated: string; // ISO date
  sections: { heading: string; body: string[] }[];
}

/** A priced add-on listed under a pricing ladder (added for T010, India pricing). */
export interface PriceExtra {
  name: string;
  price: string; // display string, placeholder-marked
  description: string;
  href: string;
}
