import { outcome, plural, type Check, type IssueSeed } from "../../context";
import { isSameSite, pageKey } from "../../url";

const def = { id: "seo.canonical", category: "seo", label: "Canonical URLs" } as const;

export const canonicalCheck: Check = (ctx) => {
  const missing: string[] = [];
  const relative: string[] = [];
  const otherHost: string[] = [];
  const multiple: string[] = [];
  const pointsHome: string[] = [];
  const homeKey = pageKey(ctx.finalUrl);
  let total = 0;
  let good = 0;

  for (const p of ctx.pages) {
    const $ = p.$;
    const raws: string[] = [];
    $('link[rel~="canonical" i][href]').each((_, el) => {
      const h = ($(el).attr("href") ?? "").trim();
      if (h) raws.push(h);
    });
    // HTTP Link header canonical counts too. Bounded, "<"-free capture: linear on hostile headers.
    const linkHeader = p.headers["link"] ?? "";
    const headerCanon = /<([^<>]{1,2048})>\s*;\s*rel="?canonical"?/i.exec(linkHeader)?.[1]?.trim();
    if (headerCanon) raws.push(headerCanon);
    // The same URL declared twice (tag + header, "/" vs absolute) is not a conflict.
    const hrefs = new Set<string>();
    for (const h of raws) {
      try {
        hrefs.add(new URL(h, p.url).href);
      } catch {
        hrefs.add(h);
      }
    }

    if (hrefs.size === 0) {
      missing.push(p.url);
      continue;
    }
    let s = 1;
    if (hrefs.size > 1) {
      multiple.push(p.url);
      s -= 0.5;
    }
    const first = raws[0];
    if (!/^https?:\/\//i.test(first)) {
      relative.push(p.url);
      s -= 0.2;
    }
    try {
      const target = new URL(first, p.url);
      if (!isSameSite(target.hostname, new URL(p.url).hostname)) {
        otherHost.push(p.url);
        s = 0;
      } else if (!p.isHome && pageKey(target.href) === homeKey && pageKey(p.url) !== homeKey) {
        // Inner page canonicalised to the homepage: Google drops it from results.
        pointsHome.push(p.url);
        s = 0;
      }
    } catch {
      relative.push(p.url);
      s -= 0.3;
    }
    if (s === 1) good++;
    total += Math.max(0, s);
  }

  const issues: IssueSeed[] = [];
  if (otherHost.length) issues.push({ key: "seo.canonical:other-host", affectedUrls: otherHost, share: 3 });
  if (pointsHome.length) issues.push({ key: "seo.canonical:points-to-home", affectedUrls: pointsHome, share: 3 });
  if (missing.length) issues.push({ key: "seo.canonical:missing", affectedUrls: missing, share: 2 });
  if (multiple.length) issues.push({ key: "seo.canonical:multiple", affectedUrls: multiple, share: 1 });
  if (relative.length) issues.push({ key: "seo.canonical:relative", affectedUrls: [...new Set(relative)], share: 1 });

  const n = ctx.pages.length;
  return outcome(def, {
    score: n ? total / n : 0,
    summary: `${good} of ${plural(n, "page")} ${good === 1 ? "has" : "have"} a single, absolute canonical URL on your own domain.`,
    issues,
  });
};
