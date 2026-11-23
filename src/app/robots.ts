import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/metadata";

// /design-preview is not disallowed: its page sets noindex, nofollow, and crawlers must be able to fetch it to see that (R7 #19).
const DISALLOW = ["/admin", "/api/"];

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
  };
}
