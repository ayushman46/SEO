import type { FaqItem, PageCopy } from "./types";
import type { DocSection } from "./methodology";

/**
 * /bot: "About seenhqbot". The engine's user agent links here (src/lib/audit/net/fetch.ts),
 * so site owners who find seenhqbot in their logs land on this page.
 */

/** The user-agent token site owners match in robots.txt. */
export const botToken = "seenhqbot";

/**
 * The exact user-agent string the audit crawler sends. Mirrors userAgent() in
 * src/lib/audit/net/fetch.ts (a test keeps them in sync). Render with the site origin.
 */
export function botUserAgent(origin: string): string {
  return `Mozilla/5.0 (compatible; seenhqbot/1.0; +${origin.replace(/\/+$/, "")}/bot)`;
}

/**
 * Product tokens used in the labelled simulated AI-crawler requests. Mirrors SIMULATED_BOT_TOKENS
 * in src/lib/audit/net/fetch.ts (a test keeps them in sync).
 */
export const botSimulatedTokens = [
  "GPTBot/1.3",
  "OAI-SearchBot/1.3",
  "ChatGPT-User/1.0",
  "ClaudeBot/1.0",
  "PerplexityBot/1.0",
  "bingbot/2.0",
] as const;

/** The exact labelled user agent of a simulated request. Mirrors simulatedUserAgent() in fetch.ts. */
export function botSimulatedUserAgent(token: (typeof botSimulatedTokens)[number], origin: string): string {
  return `Mozilla/5.0 (compatible; ${token}; simulated-by seenhqbot/1.0; +${origin.replace(/\/+$/, "")}/bot)`;
}

/** robots.txt rule that stops seenhqbot fetching internal pages. Render in a code block. */
export const botRobotsRule = "User-agent: seenhqbot\nDisallow: /";

export const botPage = {
  metaTitle: "About our crawler: what it fetches, how to block it",
  metaDescription:
    "Who runs seenhqbot, what it fetches when someone audits a site, its user agents and request limits, and how to block it in robots.txt or contact us.",
  kicker: "Crawler",
  title: "About seenhqbot",
  intro:
    "seenhqbot is the web crawler behind the free seenhq website audit. It fetches a handful of public pages from a site only when someone asks us to audit that site, and it never crawls the web on its own.",
} satisfies PageCopy;

export const botSections: DocSection[] = [
  {
    id: "who-we-are",
    title: "Who runs seenhqbot",
    body: [
      "seenhq is a small SEO and GEO studio. Our free audit checks a website for Google and for AI answer engines, and seenhqbot is the part that fetches the pages. It is not a search engine, it does not build an index, and we do not use the pages it fetches to train AI models.",
      "If you saw seenhqbot in your logs, someone entered your website address on our audit page. That is usually the site owner, an agency or a developer working on the site.",
    ],
    cta: { label: "How the audit works", href: "/methodology" },
  },
  {
    id: "what-it-requests",
    title: "What it requests",
    body: ["seenhqbot only requests public pages and files. It never submits forms, never enters password-protected areas and does not run JavaScript."],
    items: [
      { label: "Pages", body: "The page that was entered (normally the homepage) and up to five internal pages linked from it or listed in the sitemap: at most six pages are analysed per audit. If one fails or redirects to another site, a replacement link may be tried." },
      { label: "Site files", body: "robots.txt, sitemap.xml (or up to two sitemaps named in robots.txt), llms.txt, the http:// address of the homepage to check the redirect to https, and one made-up address to check that missing pages return 404." },
      { label: "robots.txt", body: "Internal pages that your robots.txt disallows for seenhqbot are skipped. The single page someone entered is always fetched, because a person asked for it, much like opening it in a browser." },
      { label: "Simulated AI-crawler requests", body: "Short requests to your homepage, up to two other pages we already fetched, robots.txt and llms.txt, once per simulated crawler, with a labelled test user agent. They show whether a firewall, CDN or host refuses that crawler. They come from our servers, not from the AI company, and skip anything your robots.txt disallows for seenhqbot." },
    ],
  },
  {
    id: "user-agents",
    title: "User agents",
    body: [
      "Normal requests identify as seenhqbot, with a link back to this page. The exact string is shown below.",
      "Simulated AI-crawler requests carry the product token of the crawler being simulated (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot or bingbot) followed by \"simulated-by seenhqbot/1.0\" and a link to this page, so you can tell them apart from the real crawler in your logs. We never send a crawler's official user agent unchanged.",
      "These requests do not come from OpenAI, Anthropic, Perplexity, Microsoft or any other AI company's IP addresses, so sites that verify crawler IP addresses may answer them differently from the real bot, in either direction.",
    ],
  },
  {
    id: "rate",
    title: "How often and how fast",
    body: [
      "One audit makes a small, bounded number of requests: up to six pages, a few site files, and the simulated requests. At most three pages are fetched at the same time and each request gives up after 8 seconds. The simulated requests mostly ask for headers only (HEAD requests), run at most four at a time with a 2.5-second timeout, and stop after 6 seconds in total. The whole audit stops after 55 seconds.",
      "seenhqbot does not come back on a schedule. It only returns if someone audits the site again, and we limit how many audits one visitor can start per hour.",
    ],
  },
  {
    id: "block",
    title: "How to block seenhqbot",
    body: [
      "Add this rule to your robots.txt to stop seenhqbot from fetching your internal pages. Rules under \"User-agent: *\" also apply to seenhqbot unless you add a group just for it.",
      "robots.txt does not stop the single page a person enters, for the reason above. To refuse that request too, block the seenhqbot user agent in your server or firewall settings.",
    ],
  },
  {
    id: "contact",
    title: "Contact us",
    body: [
      "Questions about seenhqbot, a problem it caused, or a request to delete an audit of your site: send us a message through the contact form and we will reply by email.",
    ],
    cta: { label: "Contact us", href: "/contact" },
  },
];

export const botFaq: FaqItem[] = [
  {
    q: "What is seenhqbot?",
    a: "seenhqbot is the crawler behind the free seenhq website audit. It fetches up to six public pages, plus robots.txt, the sitemap and llms.txt, from a site only when someone asks us to audit it. It does not crawl the web on its own or build a search index.",
  },
  {
    q: "Does seenhqbot respect robots.txt?",
    a: "Yes, for internal pages. seenhqbot skips any internal page your robots.txt disallows for it. The one page a person enters on our audit page is always fetched, because a person asked for it, much like opening it in a browser.",
  },
  {
    q: "How do I block seenhqbot?",
    a: "Add \"User-agent: seenhqbot\" followed by \"Disallow: /\" to your robots.txt to stop it fetching your internal pages. To refuse every request, including the page someone enters, block the seenhqbot user agent in your server or firewall settings.",
  },
];
