import { outcome, plural, type Check, type IssueSeed } from "../../context";
import type { PageData } from "../../html";

const def = { id: "seo.indexability", category: "seo", label: "Indexability" } as const;

const NOINDEX = /\b(noindex|none)\b/i;

/** true when the page asks search engines not to index it (meta robots/googlebot or X-Robots-Tag). */
export function isNoindex(p: PageData): boolean {
  const $ = p.$;
  let meta = false;
  $("meta[name][content]").each((_, el) => {
    const name = ($(el).attr("name") ?? "").toLowerCase().trim();
    if ((name === "robots" || name === "googlebot") && NOINDEX.test($(el).attr("content") ?? "")) meta = true;
  });
  if (meta) return true;

  const header = p.headers["x-robots-tag"];
  if (!header) return false;
  // Header forms: "noindex", "googlebot: noindex, nofollow", "otherbot: noindex".
  // Only generic or googlebot-scoped directives count.
  let scope: string | null = null;
  for (const raw of header.split(",")) {
    let token = raw.trim().toLowerCase();
    const m = /^([a-z0-9_-]+)\s*:\s*(.*)$/.exec(token);
    if (m && !/^(max-snippet|max-image-preview|max-video-preview|unavailable_after)$/.test(m[1])) {
      scope = m[1];
      token = m[2];
    }
    if ((token === "noindex" || token === "none") && (scope === null || scope === "googlebot")) return true;
  }
  return false;
}

export function isIndexable(p: PageData): boolean {
  return p.statusCode === 200 && !isNoindex(p);
}

export const indexabilityCheck: Check = (ctx) => {
  const noindex: string[] = [];
  const badStatus: string[] = [];
  const statuses: string[] = [];
  for (const p of ctx.pages) {
    if (p.statusCode !== 200) {
      badStatus.push(p.url);
      statuses.push(String(p.statusCode));
    } else if (isNoindex(p)) {
      noindex.push(p.url);
    }
  }
  const home = ctx.pages[0];
  const homeBlocked = home && (noindex.includes(home.url) || badStatus.includes(home.url));
  const ok = ctx.pages.length - noindex.length - badStatus.length;

  const issues: IssueSeed[] = [];
  if (noindex.length) {
    issues.push({
      key: "seo.indexability:noindex",
      affectedUrls: noindex,
      share: 2,
      ...(home && noindex.includes(home.url) ? { severity: "critical" as const } : {}),
    });
  }
  if (badStatus.length) {
    issues.push({
      key: "seo.indexability:bad-status",
      affectedUrls: badStatus,
      detail: `Status codes returned: ${[...new Set(statuses)].join(", ")}.`,
      share: 1,
      ...(home && badStatus.includes(home.url) ? { severity: "critical" as const } : {}),
    });
  }

  const n = ctx.pages.length;
  // A blocked homepage is the worst case: the whole site is effectively invisible.
  const score = n ? (homeBlocked ? Math.min(0.2, ok / n) : ok / n) : 0;
  return outcome(def, {
    score,
    summary: `${ok} of ${plural(n, "page")} can be indexed by search engines (status 200, no noindex).`,
    issues,
  });
};
