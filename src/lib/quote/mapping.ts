/**
 * Who can fix each audit finding (T019). Pure and client-safe.
 *
 * Lookup order: exact issue id, then check id (given, or the part of the issue id before ":"),
 * then the fallback ("technical-fixes"). Ids are the engine's public ids from
 * src/lib/audit/issues.ts; tests/quote/mapping.test.ts fails if the engine can emit an id that
 * is not listed here.
 */
import type { CatalogKey } from "./catalog";

/**
 * - diy: the owner can do it in minutes in their CMS or editor; we say so.
 * - none: nothing needs fixing by default (a legitimate choice, e.g. blocking AI training bots).
 * - the rest: the service that fixes it.
 */
export type Fixer =
  | "diy"
  | "technical-fixes"
  | "content-entity"
  | "ai-crawler-unblock"
  | "local-ai-setup"
  | "ai-fact-check"
  | "none";

export type PaidFixer = Exclude<Fixer, "diy" | "none">;

export interface FixRoute {
  fixer: Fixer;
  /**
   * The service that does it when the owner asks us to (a "have us fix this" click on a DIY or
   * "none" item). Equals `fixer` for paid fixers.
   */
  service: PaidFixer;
}

/** Paid fixer → catalog item that sells it. */
export const FIXER_CATALOG_KEY: Record<PaidFixer, CatalogKey> = {
  "technical-fixes": "fix-sprint",
  "content-entity": "content-entity",
  "ai-crawler-unblock": "ai-crawler-unblock",
  "local-ai-setup": "local-ai-setup",
  "ai-fact-check": "ai-fact-check",
};

const paid = (fixer: PaidFixer): FixRoute => ({ fixer, service: fixer });
const diy = (service: PaidFixer = "technical-fixes"): FixRoute => ({ fixer: "diy", service });

/** Default route per check id. */
export const CHECK_ROUTES: Readonly<Record<string, FixRoute>> = {
  // SEO
  "seo.title": diy(), // a field in every CMS
  "seo.meta-description": diy(),
  "seo.headings": diy(), // set the top headline to "Heading 1" in the editor
  "seo.canonical": paid("technical-fixes"),
  "seo.indexability": paid("technical-fixes"),
  "seo.robots-txt": paid("technical-fixes"),
  "seo.sitemap": paid("technical-fixes"),
  "seo.image-alt": diy(), // the owner knows what the pictures show
  "seo.structured-data": paid("technical-fixes"),
  "seo.open-graph": paid("technical-fixes"),
  "seo.https": paid("technical-fixes"),
  "seo.viewport": paid("technical-fixes"),
  "seo.lang": paid("technical-fixes"),
  "seo.bing-indexnow": diy(), // Bing Webmaster Tools verification / sitemap lastmod: a plugin or builder setting
  "seo.soft-404": paid("technical-fixes"),
  // GEO
  "geo.snippet-eligibility": paid("technical-fixes"),
  "geo.review-signals": paid("technical-fixes"),
  "geo.ai-crawlers": paid("ai-crawler-unblock"), // robots.txt level; the sprint can absorb it
  "geo.ai-crawler-probe": paid("ai-crawler-unblock"), // server/CDN/firewall level
  "geo.organization-schema": paid("technical-fixes"),
  "geo.answer-ready": paid("content-entity"),
  "geo.faq": paid("content-entity"),
  "geo.entity-consistency": paid("content-entity"),
  "geo.dates": paid("technical-fixes"),
  "geo.author": diy("content-entity"),
  "geo.llms-txt": paid("technical-fixes"),
  "geo.content-format": paid("content-entity"),
  "geo.fact-consistency": paid("ai-fact-check"),
  "geo.raw-html-facts": paid("technical-fixes"),
  "geo.ai-clarity": paid("content-entity"),
  // Performance
  "performance.cwv": paid("technical-fixes"),
};

/** Per-issue exceptions to the check route. */
export const ISSUE_ROUTES: Readonly<Record<string, FixRoute>> = {
  // A checkbox: "Discourage search engines" (WordPress) / "Show in search results" (Wix, Squarespace).
  "seo.indexability:noindex": diy(),
  // A deliberate choice the issue copy itself says may be fine.
  "geo.ai-crawlers:training-blocked": { fixer: "none", service: "ai-crawler-unblock" },
  "geo.content-format:weak-alt": diy("content-entity"),
  "geo.fact-consistency:struck-price": diy("ai-fact-check"),
  "geo.fact-consistency:stale-year": diy(),
  // Addresses and opening hours only exist for local businesses; the local setup aligns them
  // on the site's LocalBusiness schema and on the profiles AI assistants read.
  "geo.fact-consistency:addresses": paid("local-ai-setup"),
  "geo.fact-consistency:hours": paid("local-ai-setup"),
  "geo.raw-html-facts:jsonld-only": diy(), // type the footer details out as text
  "geo.raw-html-facts:no-contact": diy(),
  "geo.ai-clarity:contact": diy(), // show the phone/email as text in the footer
  // Snippet controls are usually one SEO-plugin or site-builder toggle; data-nosnippet sits in templates.
  "geo.snippet-eligibility:nosnippet": diy(),
  "geo.snippet-eligibility:max-snippet": diy(),
  "geo.snippet-eligibility:noarchive": diy(),
  "geo.snippet-eligibility:data-nosnippet-facts": paid("technical-fixes"),
  "geo.review-signals:no-profiles": paid("local-ai-setup"),
  "geo.review-signals:schema-without-visible": paid("technical-fixes"),
  "geo.review-signals:anonymous-testimonials": diy("content-entity"),
  // The probe's blocked-* variants use the check route (ai-crawler-unblock); a different page
  // served to AI crawlers is a rendering/config fix, not a block.
  "geo.ai-crawler-probe:different-content": paid("technical-fixes"),
};

export const FALLBACK_ROUTE: FixRoute = paid("technical-fixes");

/** "seo.title:missing" → "seo.title"; ids without ":" are returned as-is. */
export function checkIdOf(issueId: string): string {
  const i = issueId.indexOf(":");
  return i === -1 ? issueId : issueId.slice(0, i);
}

const own = (table: Readonly<Record<string, FixRoute>>, key: string): FixRoute | undefined =>
  Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;

/** Route for one finding. Works with the partial report's minimal shape (no checkId). */
export function routeFor(issue: { id: string; checkId?: string }): FixRoute {
  return (
    own(ISSUE_ROUTES, issue.id) ??
    own(CHECK_ROUTES, issue.checkId ?? checkIdOf(issue.id)) ??
    own(CHECK_ROUTES, checkIdOf(issue.id)) ??
    FALLBACK_ROUTE
  );
}

/** True when the id (issue or check) has an explicit route, i.e. does not use the fallback. */
export function hasExplicitRoute(id: string): boolean {
  return own(ISSUE_ROUTES, id) !== undefined || own(CHECK_ROUTES, id) !== undefined || own(CHECK_ROUTES, checkIdOf(id)) !== undefined;
}
