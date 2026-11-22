import { outcome, plural, type AuditContext, type Check, type IssueSeed } from "../../context";
import { metaContents, type PageData } from "../../html";
import { isBlocked, parseRobots } from "../../robots";
import { EMAIL_RE, phonesInText, PRICE_RE, scanPage, STREET_RE, timeRangesInText } from "./page-scan";

const def = { id: "geo.snippet-eligibility", category: "geo", label: "Eligible for AI answers (snippet controls)" } as const;

/** max-snippet values below this many characters leave almost nothing to quote. */
export const LOW_MAX_SNIPPET = 50;

export interface RobotsDirectives {
  nosnippet: boolean;
  /** smallest max-snippet seen (null = not set or -1/unlimited) */
  maxSnippet: number | null;
  noarchive: boolean;
  nocache: boolean;
}

/** Tokens from meta robots/googlebot/bingbot and X-Robots-Tag (generic, googlebot or bingbot scope). */
export function robotsDirectives(p: PageData): RobotsDirectives {
  const out: RobotsDirectives = { nosnippet: false, maxSnippet: null, noarchive: false, nocache: false };
  const take = (token: string) => {
    const t = token.trim().toLowerCase();
    if (!t) return;
    const m = /^max-snippet\s*:\s*(-?\d+)$/.exec(t);
    if (m) {
      const v = Number(m[1]);
      if (v >= 0 && (out.maxSnippet === null || v < out.maxSnippet)) out.maxSnippet = v;
      return;
    }
    for (const w of t.split(/\s+/)) {
      if (w === "nosnippet") out.nosnippet = true;
      else if (w === "noarchive") out.noarchive = true;
      else if (w === "nocache") out.nocache = true;
    }
  };
  for (const key of ["robots", "googlebot", "bingbot"]) for (const c of metaContents(p.$, key)) c.split(",").forEach(take);
  const header = p.headers["x-robots-tag"];
  if (header) {
    for (const line of header.split("\n")) {
      let scope: string | null = null;
      for (const raw of line.split(",")) {
        let token = raw.trim().toLowerCase();
        const m = /^([a-z0-9_-]+)\s*:\s*(.*)$/.exec(token);
        if (m && !/^(max-snippet|max-image-preview|max-video-preview|unavailable_after)$/.test(m[1])) {
          scope = m[1];
          token = m[2];
        }
        if (scope === null || scope === "googlebot" || scope === "bingbot") take(token);
      }
    }
  }
  return out;
}

const has = (re: RegExp, s: string) => {
  re.lastIndex = 0;
  const r = re.test(s);
  re.lastIndex = 0;
  return r;
};

/** Which core facts sit inside data-nosnippet on this page. */
export function nosnippetFacts(p: PageData): string[] {
  const s = scanPage(p);
  if (!s.nosnippetTexts.length) return [];
  const joined = s.nosnippetTexts.join(" \n ");
  const facts: string[] = [];
  if (has(PRICE_RE, joined)) facts.push("prices");
  if (phonesInText(joined).length) facts.push("phone number");
  if (has(EMAIL_RE, joined)) facts.push("email");
  if (has(STREET_RE, joined)) facts.push("address");
  if (timeRangesInText(joined).length) facts.push("opening hours");
  const h1 = p.headings.find((h) => h.level === 1)?.text ?? "";
  const mainHidden = (p.wordCount >= 30 && s.nosnippetWords >= 0.5 * p.wordCount) || (h1.length >= 3 && joined.includes(h1));
  if (mainHidden) facts.push("main description");
  return facts;
}

/** robots.txt opt-outs from AI training/grounding products (reported, not penalised). */
export function aiOptOuts(ctx: AuditContext): string[] {
  const robots = parseRobots(ctx.robots);
  const home = `${ctx.origin}/`;
  return ["Google-Extended", "Applebot-Extended"].filter((ua) => isBlocked(robots, home, ua));
}

/**
 * geo.snippet-eligibility: Google's documentation says a page must be indexed and eligible to be
 * shown with a snippet to appear as a supporting link in AI Overviews / AI Mode, with nosnippet,
 * data-nosnippet, max-snippet and noindex as the controls (noindex is seo.indexability's job).
 * Bing documents NOARCHIVE as excluding content from its chat answers (now Copilot).
 * Honest limit: eligible doesn't mean shown; Search Console settings aren't visible to us.
 */
export const snippetEligibilityCheck: Check = (ctx) => {
  const nosnippet: string[] = [];
  const lowMax: string[] = [];
  const lowValues = new Set<number>();
  const noarchive: string[] = [];
  const factPages: string[] = [];
  const factKinds = new Set<string>();
  for (const p of ctx.pages) {
    const d = robotsDirectives(p);
    if (d.nosnippet || d.maxSnippet === 0) nosnippet.push(p.url);
    else if (d.maxSnippet !== null && d.maxSnippet < LOW_MAX_SNIPPET) {
      lowMax.push(p.url);
      lowValues.add(d.maxSnippet);
    }
    // NOCACHE alongside NOARCHIVE is treated as NOCACHE by Bing (URL/title/snippet still usable).
    if (d.noarchive && !d.nocache) noarchive.push(p.url);
    const f = nosnippetFacts(p);
    if (f.length) {
      factPages.push(p.url);
      f.forEach((k) => factKinds.add(k));
    }
  }

  const home = ctx.pages[0]?.url;
  const issues: IssueSeed[] = [];
  let score = 1;
  if (nosnippet.length) {
    const onHome = home !== undefined && nosnippet.includes(home);
    score -= onHome ? 0.7 : 0.4;
    issues.push({ key: "geo.snippet-eligibility:nosnippet", affectedUrls: nosnippet, severity: onHome ? "critical" : "high", share: 4 });
  }
  if (lowMax.length) {
    score -= 0.3;
    issues.push({
      key: "geo.snippet-eligibility:max-snippet",
      affectedUrls: lowMax,
      detail: `max-snippet is set to ${[...lowValues].sort((a, b) => a - b).join(", ")} characters.`,
      share: 2,
    });
  }
  if (factPages.length) {
    score -= 0.25;
    issues.push({
      key: "geo.snippet-eligibility:data-nosnippet-facts",
      affectedUrls: factPages,
      detail: `Excluded from snippets: ${[...factKinds].join(", ")}.`,
      share: 2,
    });
  }
  if (noarchive.length) {
    score -= 0.1;
    issues.push({ key: "geo.snippet-eligibility:noarchive", affectedUrls: noarchive, share: 1 });
  }

  const optOuts = aiOptOuts(ctx);
  const optNote = optOuts.length
    ? ` robots.txt opts out of ${optOuts.join(" and ")} (AI training/grounding in some of Google's and Apple's other systems); that's a deliberate choice and doesn't affect Search or AI Overviews eligibility.`
    : "";
  if (issues.length === 0) {
    return outcome(def, {
      score: 1,
      summary: `No snippet restrictions found on ${plural(ctx.pages.length, "page")} we read, so they stay eligible to be quoted.${optNote}`,
      issues,
    });
  }
  return outcome(def, {
    score: Math.max(0, score),
    summary: `Some pages limit what search engines may quote from them, which also limits AI answers.${optNote}`,
    issues,
  });
};
