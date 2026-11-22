import { outcome, type Check, type IssueSeed } from "../../context";
import { isBlocked, parseRobots } from "../../robots";

const def = { id: "geo.ai-crawlers", category: "geo", label: "AI crawler access" } as const;

/**
 * "search" bots fetch pages live to answer a user's question (blocking them removes you
 * from AI answers today). "training" bots collect data for future models (a legitimate
 * opt-out, so it costs less).
 */
export const AI_BOTS: { name: string; product: string; kind: "search" | "training" }[] = [
  { name: "OAI-SearchBot", product: "ChatGPT search", kind: "search" },
  { name: "ChatGPT-User", product: "ChatGPT (live browsing)", kind: "search" },
  { name: "Claude-SearchBot", product: "Claude search", kind: "search" },
  { name: "PerplexityBot", product: "Perplexity", kind: "search" },
  { name: "GPTBot", product: "OpenAI training", kind: "training" },
  { name: "ClaudeBot", product: "Anthropic training", kind: "training" },
  { name: "Google-Extended", product: "Google Gemini training", kind: "training" },
  { name: "Applebot-Extended", product: "Apple Intelligence training", kind: "training" },
  { name: "CCBot", product: "Common Crawl", kind: "training" },
  { name: "Bytespider", product: "ByteDance", kind: "training" },
];

const WEIGHT = { search: 3, training: 1 } as const;

export const aiCrawlersCheck: Check = (ctx) => {
  const robots = parseRobots(ctx.robots);
  const home = `${ctx.origin}/`;
  // Check every crawled page, not just "/": "Disallow: / + Allow: /$" or "Disallow: /blog/"
  // leaves the homepage open while hiding the content.
  const urls = [...new Set([home, ...ctx.pages.map((p) => p.url)])];
  // A generic deep path tells "blocks the site except a few pages" apart from "blocks one section".
  const probe = `${ctx.origin}/seenhq-robots-probe/page`;

  const blocked: typeof AI_BOTS = [];
  const partial: { bot: (typeof AI_BOTS)[number]; disallowed: string[] }[] = [];
  for (const b of AI_BOTS) {
    const disallowed = urls.filter((u) => isBlocked(robots, u, b.name));
    if (disallowed.length === 0) continue;
    const full =
      disallowed.includes(home) ||
      disallowed.length * 2 > urls.length ||
      (disallowed.length * 2 >= urls.length && isBlocked(robots, probe, b.name));
    if (full) blocked.push(b);
    else partial.push({ bot: b, disallowed });
  }

  const total = AI_BOTS.reduce((s, b) => s + WEIGHT[b.kind], 0);
  let lost = blocked.reduce((s, b) => s + WEIGHT[b.kind], 0);
  for (const p of partial) lost += (WEIGHT[p.bot.kind] * p.disallowed.length) / urls.length;
  const searchBlocked = blocked.filter((b) => b.kind === "search");
  const trainingBlocked = blocked.filter((b) => b.kind === "training");

  const issues: IssueSeed[] = [];
  if (partial.length) {
    issues.push({
      key: "geo.ai-crawlers:partially-blocked",
      affectedUrls: [...new Set(partial.flatMap((p) => p.disallowed))],
      detail: `Some pages are blocked for: ${partial.map((p) => `${p.bot.name} (${p.bot.product})`).join(", ")}.`,
      ...(partial.some((p) => p.bot.kind === "search") ? { severity: "high" as const } : {}),
      share: 1,
    });
  }
  if (searchBlocked.length) {
    issues.push({
      key: "geo.ai-crawlers:search-blocked",
      detail: `Blocked: ${searchBlocked.map((b) => `${b.name} (${b.product})`).join(", ")}.`,
      severity: searchBlocked.length === AI_BOTS.filter((b) => b.kind === "search").length ? "critical" : "high",
      share: 3,
    });
  }
  if (trainingBlocked.length) {
    issues.push({
      key: "geo.ai-crawlers:training-blocked",
      detail: `Blocked: ${trainingBlocked.map((b) => `${b.name} (${b.product})`).join(", ")}.`,
      share: 1,
    });
  }

  const allowed = AI_BOTS.length - blocked.length - partial.length;
  const partialNote = partial.length
    ? ` ${partial.length} ${partial.length === 1 ? "is" : "are"} blocked from some pages (${partial.map((p) => p.bot.name).join(", ")}).`
    : "";
  let summary: string;
  if (partial.length && blocked.length === 0) {
    summary = `${allowed} of ${AI_BOTS.length} major AI crawlers can read your whole site;${partialNote}`;
  } else if (partial.length) {
    summary = `${allowed} of ${AI_BOTS.length} major AI crawlers can read your whole site; ${blocked.length} blocked (${blocked
      .map((b) => b.name)
      .join(", ")}).${partialNote}`;
  } else if (blocked.length === 0) {
    summary =
      ctx.robots.status === "ok"
        ? `All ${AI_BOTS.length} major AI crawlers are allowed to read your site.`
        : `No robots.txt rules block AI crawlers (all ${AI_BOTS.length} are allowed).`;
  } else {
    summary = `${allowed} of ${AI_BOTS.length} major AI crawlers are allowed; ${blocked.length} blocked (${blocked
      .map((b) => b.name)
      .join(", ")}).`;
  }
  return outcome(def, { score: 1 - lost / total, summary, issues });
};
