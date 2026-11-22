import { outcome, type AuditContext, type Check, type IssueSeed } from "../../context";
import { allJsonLdNodes, nodeTypes } from "../../html";
import { scanPage } from "./page-scan";
import { ORG_TYPES } from "./org-types";

/** Organization types that are not local businesses. */
const NON_LOCAL_ORGS = new Set([
  "organization", "corporation", "ngo", "governmentorganization", "educationalorganization", "newsmediaorganization",
  "onlinebusiness", "researchorganization", "politicalparty", "consortium", "fundingscheme",
  "collegeoruniversity", "workersunion", "project", "researchproject", "fundingagency", "sportsorganization",
  "performinggroup", "searchrescueorganization",
]);
const COMMERCIAL_TYPES = new Set(["product", "offer", "aggregateoffer", "productgroup", "localbusiness"]);

/**
 * Review profiles are expected from local or commercial sites only (R3 L3): schema with a
 * LocalBusiness-type node or Product/Offer markup. Elsewhere "no profiles" is a note, not an issue.
 */
export function looksLocalOrCommercial(ctx: AuditContext): boolean {
  for (const { node } of allJsonLdNodes(ctx.pages)) {
    for (const t of nodeTypes(node)) {
      const k = t.toLowerCase();
      if (COMMERCIAL_TYPES.has(k)) return true;
      if (ORG_TYPES.has(k) && !NON_LOCAL_ORGS.has(k)) return true;
    }
  }
  return false;
}

const def = { id: "geo.review-signals", category: "geo", label: "Review signals" } as const;

/** Review / listing platforms, matched on the link's hostname (and path for Google). */
export const REVIEW_PLATFORMS: { name: string; test: (u: URL) => boolean }[] = [
  {
    name: "Google Business Profile",
    test: (u) =>
      /(^|\.)g\.page$|^maps\.app\.goo\.gl$|^goo\.gl$|^business\.google\.com$|^g\.co$/.test(u.hostname) ||
      (/(^|\.)google\.[a-z.]+$/.test(u.hostname) && /^\/maps|^\/search/.test(u.pathname) && /maps|cid=|ludocid|place/i.test(u.href)) ||
      /^maps\.google\.[a-z.]+$/.test(u.hostname),
  },
  { name: "Trustpilot", test: (u) => /(^|\.)trustpilot\.com$/.test(u.hostname) },
  { name: "G2", test: (u) => /(^|\.)g2\.com$/.test(u.hostname) },
  { name: "Capterra", test: (u) => /(^|\.)capterra\.[a-z.]+$/.test(u.hostname) },
  { name: "Yelp", test: (u) => /(^|\.)yelp\.[a-z.]+$/.test(u.hostname) },
  { name: "Tripadvisor", test: (u) => /(^|\.)tripadvisor\.[a-z.]+$/.test(u.hostname) },
  { name: "Justdial", test: (u) => /(^|\.)justdial\.com$/.test(u.hostname) },
  { name: "Practo", test: (u) => /(^|\.)practo\.com$/.test(u.hostname) },
  { name: "BBB", test: (u) => /(^|\.)bbb\.org$/.test(u.hostname) },
  { name: "Clutch", test: (u) => /(^|\.)clutch\.co$/.test(u.hostname) },
  { name: "Zomato", test: (u) => /(^|\.)zomato\.com$/.test(u.hostname) },
  { name: "Houzz", test: (u) => /(^|\.)houzz\.[a-z.]+$/.test(u.hostname) },
  { name: "Product Hunt", test: (u) => /(^|\.)producthunt\.com$/.test(u.hostname) },
];

export function reviewProfiles(ctx: AuditContext): string[] {
  const found = new Set<string>();
  const consider = (href: string) => {
    let u: URL;
    try {
      u = new URL(href);
    } catch {
      return;
    }
    for (const p of REVIEW_PLATFORMS) if (p.test(u)) found.add(p.name);
  };
  for (const p of ctx.pages) for (const l of p.links.slice(0, 2_000)) consider(l.href);
  for (const { node } of allJsonLdNodes(ctx.pages)) {
    const same = node.sameAs;
    for (const s of Array.isArray(same) ? same : [same]) if (typeof s === "string") consider(s);
  }
  return [...found];
}

export const VISIBLE_REVIEWS = /\b(reviews?|testimonials?|rated|ratings?|stars?)\b|★|⭐|\b[1-5](?:\.\d)?\s?\/\s?5\b|\b[1-5](?:\.\d)? out of 5\b/i;

/**
 * geo.review-signals (low weight): links to review profiles, AggregateRating/Review schema vs
 * visible review text, and testimonials without a named source. Honest limit: evidence that
 * reviews drive AI recommendations is mostly vendor-run and correlational; we don't read the
 * review platforms themselves.
 */
export const reviewSignalsCheck: Check = (ctx) => {
  const profiles = reviewProfiles(ctx);
  const ratingPages = new Set<string>();
  for (const { node, url } of allJsonLdNodes(ctx.pages)) {
    const types = nodeTypes(node);
    if (types.includes("AggregateRating") || types.includes("Review") || node.aggregateRating || node.review) ratingPages.add(url);
  }
  const mismatch: string[] = [];
  for (const p of ctx.pages) {
    if (!ratingPages.has(p.url)) continue;
    const s = scanPage(p);
    if (!VISIBLE_REVIEWS.test(s.visibleText) && s.testimonials.length === 0) mismatch.push(p.url);
  }
  const anonPages = new Set<string>();
  let quotes = 0;
  let anonymous = 0;
  for (const p of ctx.pages) {
    for (const t of scanPage(p).testimonials) {
      quotes++;
      if (!t.attributed) {
        anonymous++;
        anonPages.add(p.url);
      }
    }
  }

  const issues: IssueSeed[] = [];
  let score = 1;
  if (mismatch.length) {
    score -= 0.4;
    issues.push({ key: "geo.review-signals:schema-without-visible", affectedUrls: mismatch, share: 2 });
  }
  if (quotes > 0 && anonymous * 2 > quotes) {
    score -= 0.2;
    issues.push({ key: "geo.review-signals:anonymous-testimonials", affectedUrls: [...anonPages], share: 1 });
  }
  const expectsProfiles = looksLocalOrCommercial(ctx);
  if (profiles.length === 0 && expectsProfiles) {
    score -= 0.3;
    issues.push({ key: "geo.review-signals:no-profiles", share: 1 });
  }
  const profileText = profiles.length ? `Links to review profiles: ${profiles.join(", ")}.` : "No links to review profiles found.";
  if (issues.length === 0) {
    return outcome(def, { score: 1, summary: `${profileText} Review markup matches visible reviews.`, issues });
  }
  return outcome(def, {
    score: Math.max(0, score),
    summary: `${profileText}${mismatch.length ? " Rating schema appears without visible reviews." : ""}${issues.some((i) => i.key === "geo.review-signals:anonymous-testimonials") ? " Most testimonials don't name who said them." : ""}`,
    issues,
  });
};
