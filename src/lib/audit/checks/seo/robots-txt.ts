import { outcome, type Check } from "../../context";
import { isBlocked, parseRobots } from "../../robots";

const def = { id: "seo.robots-txt", category: "seo", label: "robots.txt" } as const;

export const robotsTxtCheck: Check = (ctx) => {
  const r = ctx.robots;
  if (r.status === "missing") {
    return outcome(def, {
      score: 0.6,
      status: "warn",
      summary: "No robots.txt file was found (crawlers are allowed everywhere by default).",
      issues: [{ key: "seo.robots-txt:missing" }],
    });
  }
  if (r.status !== "ok") {
    return outcome(def, {
      score: 0.4,
      summary: `robots.txt couldn't be read${r.statusCode ? ` (status ${r.statusCode})` : ""}.`,
      issues: [{ key: "seo.robots-txt:unreadable" }],
    });
  }
  const robots = parseRobots(r);
  const home = `${ctx.origin}/`;
  const blocksGoogle = isBlocked(robots, home, "Googlebot");
  const blocksBing = isBlocked(robots, home, "Bingbot");
  if (blocksGoogle || blocksBing) {
    return outcome(def, {
      score: 0,
      summary: blocksGoogle
        ? "robots.txt blocks Google from crawling your homepage."
        : "robots.txt blocks Bing from crawling your homepage.",
      issues: [{ key: "seo.robots-txt:blocks-all", severity: blocksGoogle ? "critical" : "high" }],
    });
  }
  // Google and Bing have their own allow groups, but every other crawler is shut out.
  if (isBlocked(robots, home, "*")) {
    return outcome(def, {
      score: 0.8,
      status: "warn",
      summary: "robots.txt only lets listed crawlers in; Google and Bing are allowed.",
      issues: [{ key: "seo.robots-txt:blocks-unlisted" }],
    });
  }
  return outcome(def, {
    score: 1,
    summary: "robots.txt exists and lets search engines crawl your site.",
    issues: [],
  });
};
