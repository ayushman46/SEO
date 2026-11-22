import { outcome, type AuditContext, type Check, type IssueSeed } from "../../context";
import { metaContent } from "../../html";

const def = { id: "seo.bing-indexnow", category: "seo", label: "Bing & IndexNow readiness" } as const;

/** A sitemap whose newest <lastmod> is older than this is "stale". */
export const STALE_LASTMOD_DAYS = 180;
const LASTMOD_RE = /<(?:\w{1,20}:)?lastmod>\s{0,16}(\d{4}-\d{2}-\d{2}(?:T[\d:.]{1,20}(?:Z|[+-]\d{2}:?\d{2})?)?)/gi;

/** Newest <lastmod> in the sitemap, or null if there are none. */
export function newestLastmod(xml: string | null): Date | null {
  if (!xml) return null;
  let best: number | null = null;
  let n = 0;
  for (const m of xml.matchAll(LASTMOD_RE)) {
    const t = Date.parse(m[1]);
    if (Number.isFinite(t) && (best === null || t > best)) best = t;
    if (++n > 50_000) break;
  }
  return best === null ? null : new Date(best);
}

/** The site mentions IndexNow somewhere we can see (we never guess key file names). */
export function indexNowReferenced(ctx: AuditContext): boolean {
  if (ctx.robots.text && /indexnow/i.test(ctx.robots.text.slice(0, 100_000))) return true;
  const home = ctx.pages[0];
  if (!home) return false;
  if (metaContent(home.$, "indexnow-key")) return true;
  return home.links.some((l) => /indexnow/i.test(l.href));
}

/**
 * seo.bing-indexnow (low weight, never "fail"): Bing Webmaster verification meta tag, sitemap
 * lastmod freshness, and any visible IndexNow reference. Honest limits: Bing can be verified by
 * DNS or an XML file we can't see; IndexNow keys are meant to stay private, so "not found" is weak;
 * Bing's index is confirmed to feed Microsoft Copilot, not confirmed for other assistants.
 */
export const bingIndexNowCheck: Check = (ctx) => {
  const home = ctx.pages[0];
  const verified = home ? Boolean(metaContent(home.$, "msvalidate.01")) : false;
  const indexNow = indexNowReferenced(ctx);
  const hasSitemap = ctx.sitemap.status === "ok" && Boolean(ctx.sitemap.text);
  const newest = hasSitemap ? newestLastmod(ctx.sitemap.text) : null;
  const now = ctx.now ?? new Date();
  const ageDays = newest ? Math.floor((now.getTime() - newest.getTime()) / 86_400_000) : null;

  const issues: IssueSeed[] = [];
  let score = 1;
  if (!verified) {
    score -= 0.4;
    issues.push({ key: "seo.bing-indexnow:not-verified", share: 2 });
  }
  if (hasSitemap && newest === null) {
    score -= 0.2;
    issues.push({ key: "seo.bing-indexnow:no-lastmod", affectedUrls: [ctx.sitemap.url], share: 1 });
  } else if (ageDays !== null && ageDays > STALE_LASTMOD_DAYS) {
    score -= 0.2;
    issues.push({
      key: "seo.bing-indexnow:stale-lastmod",
      affectedUrls: [ctx.sitemap.url],
      detail: `The newest <lastmod> in your sitemap is ${newest!.toISOString().slice(0, 10)} (${ageDays} days ago).`,
      share: 1,
    });
  }

  const parts = [
    verified ? "Bing Webmaster Tools verification tag found" : "no Bing verification tag (msvalidate.01) on the homepage",
    !hasSitemap ? "no sitemap to check" : newest ? `newest sitemap lastmod ${newest.toISOString().slice(0, 10)}` : "sitemap has no lastmod dates",
    indexNow ? "IndexNow is referenced" : "no visible IndexNow reference (keys are usually private, so this is weak)",
  ];
  const summary = `${parts.join("; ")}.`;
  if (issues.length === 0) return outcome(def, { score: 1, summary: summary[0].toUpperCase() + summary.slice(1), issues });
  // Low-confidence signals: at most a warning.
  return outcome(def, { score: Math.max(0.5, score), status: "warn", summary: summary[0].toUpperCase() + summary.slice(1), issues });
};
