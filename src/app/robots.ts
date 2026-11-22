import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo/metadata";

const DISALLOW = ["/admin", "/api/", "/design-preview"];

/**
 * AI and search crawlers we explicitly welcome. A crawler that matches a named group ignores the "*" group,
 * so each group repeats the same allow/disallow rules.
 */
const NAMED_CRAWLERS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google
  "Googlebot",
  "Google-Extended",
  // Microsoft
  "Bingbot",
  // Apple
  "Applebot",
  "Applebot-Extended",
  // Others
  "Amazonbot",
  "DuckAssistBot",
  "Meta-ExternalAgent",
  "MistralAI-User",
  "CCBot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: NAMED_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
