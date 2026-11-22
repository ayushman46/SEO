import { outcome, plural, type Check, type IssueSeed } from "../../context";
import { isSameSite } from "../../url";

const def = { id: "seo.canonical", category: "seo", label: "Canonical URLs" } as const;

export const canonicalCheck: Check = (ctx) => {
  const missing: string[] = [];
  const relative: string[] = [];
  const otherHost: string[] = [];
  const multiple: string[] = [];
  let total = 0;
  let good = 0;

  for (const p of ctx.pages) {
    const $ = p.$;
    const hrefs = new Set<string>();
    $('link[rel~="canonical" i][href]').each((_, el) => {
      const h = ($(el).attr("href") ?? "").trim();
      if (h) hrefs.add(h);
    });
    // HTTP Link header canonical counts too.
    const linkHeader = p.headers["link"] ?? "";
    const headerCanon = /<([^>]+)>\s*;\s*rel="?canonical"?/i.exec(linkHeader)?.[1];
    if (headerCanon) hrefs.add(headerCanon.trim());

    if (hrefs.size === 0) {
      missing.push(p.url);
      continue;
    }
    let s = 1;
    if (hrefs.size > 1) {
      multiple.push(p.url);
      s -= 0.5;
    }
    const first = [...hrefs][0];
    if (!/^https?:\/\//i.test(first)) {
      relative.push(p.url);
      s -= 0.2;
    }
    try {
      const target = new URL(first, p.url);
      if (!isSameSite(target.hostname, new URL(p.url).hostname)) {
        otherHost.push(p.url);
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
