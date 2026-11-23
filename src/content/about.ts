import type { PageCopy } from "./types";

export const aboutPage = {
  metaTitle: "About us: a small SEO and GEO studio",
  metaDescription:
    "seenhq is a small SEO and GEO studio for startups, SaaS teams and local businesses: free audit, fixed-price fixes, no promised rankings.",
  kicker: "About",
  title: "A small studio for SEO and AI search",
  intro:
    "seenhq is a small SEO and GEO studio. We audit websites for Google and AI answer engines, then fix what the audit finds.",
} satisfies PageCopy;

export const aboutSections: { title: string; body: string }[] = [
  {
    // "In short" keeps one summary heading on our own site (geo.answer-ready looks for one).
    title: "seenhq in short",
    body: "seenhq checks for free, in about a minute, whether Google and AI answer engines such as ChatGPT can read your website. Our paid services fix what it finds at a fixed price, with no contract.",
  },
  {
    title: "Who we work with",
    body: "Startups and SaaS teams, and local businesses such as clinics, studios, cafés and trades. We work remotely, worldwide, with a focus on India.",
  },
  {
    title: "How we work",
    body: "Before we start, you get what we found, what is worth fixing and a fixed price. After the work we re-run the audit and send you what changed. We never promise rankings or AI citations.",
  },
];

/** Closing call to action on /about (added by frontend-designer for T006; content-seo may refine). */
export const aboutClosing = {
  title: "See how your site looks to search and AI.",
  body: "Start with the free audit, or tell us about your site. We reply within two working days.",
  primaryCta: { label: "Run a free audit", href: "/audit" },
  secondaryCta: { label: "Contact us", href: "/contact" },
};
