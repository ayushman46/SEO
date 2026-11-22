/**
 * Platform detection (T024). Pure: reads only what the crawl already has (homepage HTML,
 * response headers, cookie names, robots.txt text). Never guesses: every rule below was checked
 * against real sites on 2026-11-23 (see docs/DECISIONS.md ADR-019), and anything else is null.
 *
 * "high"   = a marker the platform itself writes (generator tag, its own server header, its
 *            bootstrapping script, its hosting domain).
 * "medium" = the platform's asset CDN in <script>/<link> tags, or one weaker marker on its own.
 * Plain <a href> links, page text and <img> hotlinks never count: any site can link to a
 * Shopify product or embed a wixstatic image.
 */
import type { CheerioAPI } from "cheerio";
import type { AuditContext } from "./context";
import { metaContents, type PageData } from "./html";

export type PlatformId =
  | "wordpress"
  | "wix"
  | "squarespace"
  | "shopify"
  | "webflow"
  | "framer"
  | "nextjs-app"
  | "nextjs-pages"
  | "lovable"
  | "google-sites"
  | "godaddy"
  | "blogger";

export type SeoPluginId = "yoast" | "rank-math" | "aioseo";

export type Confidence = "high" | "medium";

export interface PlatformDetection {
  id: PlatformId;
  name: string;
  confidence: Confidence;
  /** plain-English reason, e.g. "generator meta tag" */
  evidence: string;
  /** WordPress only: SEO plugin whose own markup is on the page */
  plugin?: { id: SeoPluginId; name: string };
}

export interface CloudflareDetection {
  /** Cloudflare serves the site (server/cf-ray header) */
  edge: boolean;
  /** robots.txt contains Cloudflare's managed AI-crawler block */
  managedRobots: boolean;
  evidence: string;
}

export const PLATFORM_NAMES: Record<PlatformId, string> = {
  wordpress: "WordPress",
  wix: "Wix",
  squarespace: "Squarespace",
  shopify: "Shopify",
  webflow: "Webflow",
  framer: "Framer",
  "nextjs-app": "Next.js (App Router, custom code)",
  "nextjs-pages": "Next.js (Pages Router, custom code)",
  lovable: "Lovable",
  "google-sites": "Google Sites",
  godaddy: "GoDaddy Website Builder",
  blogger: "Blogger",
};

export const PLUGIN_NAMES: Record<SeoPluginId, string> = {
  yoast: "Yoast SEO",
  "rank-math": "Rank Math",
  aioseo: "All in One SEO",
};

/* All regexes are anchored or literal and run on short, capped strings (meta content ≤ 200 chars). */
export const PLATFORM_REGEXES = {
  GEN_WORDPRESS: /^wordpress(?:\s|$)/i,
  GEN_WIX: /^wix\.com\b/i,
  GEN_WEBFLOW: /^webflow(?:\s|$)/i,
  GEN_FRAMER: /^framer(?:\s|$)/i,
  GEN_BLOGGER: /^blogger$/i,
  GEN_GODADDY: /go ?daddy website builder/i,
  GEN_AIOSEO: /^all in one seo\b/i,
  SERVER_FRAMER: /^framer\//i,
  COOKIE_SPLIT: /,\s*/,
} as const;

const R = PLATFORM_REGEXES;

/** Caps keep detection linear and cheap on hostile pages. */
const MAX_ASSET_TAGS = 600;
const MAX_INLINE_SCRIPTS = 200;
const MAX_INLINE_CHARS = 200_000;
const MAX_META_CHARS = 200;

interface Signals {
  host: string;
  path: string;
  origin: string;
  generators: string[];
  headers: Record<string, string>;
  cookieNames: Set<string>;
  /** hostnames of <script src> and <link href> (not <a>, not <img>) */
  assetHosts: string[];
  /** same-origin pathnames of <script src>/<link href> */
  assetPaths: string[];
  inline: { shopifyTheme: boolean; nextFlight: boolean; squarespaceContext: boolean };
  $: CheerioAPI;
}

function cookieNames(setCookie: string | undefined): Set<string> {
  const out = new Set<string>();
  if (!setCookie) return out;
  // Joined with ", " by the fetcher; names are the token before "=" at the start of each cookie.
  for (const part of setCookie.slice(0, 20_000).split(R.COOKIE_SPLIT)) {
    const eq = part.indexOf("=");
    if (eq > 0 && eq < 80 && !part.slice(0, eq).includes(";")) out.add(part.slice(0, eq).trim().toLowerCase());
  }
  return out;
}

function collectSignals(home: PageData): Signals {
  const $ = home.$;
  let base: URL;
  try {
    base = new URL(home.url);
  } catch {
    base = new URL("https://invalid.example/");
  }
  const assetHosts: string[] = [];
  const assetPaths: string[] = [];
  $("script[src], link[href]")
    .slice(0, MAX_ASSET_TAGS)
    .each((_, el) => {
      const raw = (el as unknown as { attribs: Record<string, string> }).attribs;
      const ref = raw.src ?? raw.href;
      if (!ref) return;
      try {
        const u = new URL(ref.trim().slice(0, 2_048), base);
        if (u.protocol !== "http:" && u.protocol !== "https:") return;
        assetHosts.push(u.hostname.toLowerCase());
        if (u.origin === base.origin) assetPaths.push(u.pathname);
        else assetPaths.push(`//${u.hostname.toLowerCase()}${u.pathname}`);
      } catch {
        /* ignore unparsable URLs */
      }
    });

  const inline = { shopifyTheme: false, nextFlight: false, squarespaceContext: false };
  let budget = MAX_INLINE_CHARS;
  $("script:not([src])")
    .slice(0, MAX_INLINE_SCRIPTS)
    .each((_, el) => {
      if (budget <= 0) return false;
      const text = $(el).text().slice(0, Math.min(budget, 50_000));
      budget -= text.length;
      if (!inline.shopifyTheme && text.includes("Shopify.theme")) inline.shopifyTheme = true;
      if (!inline.nextFlight && text.includes("self.__next_f")) inline.nextFlight = true;
      if (!inline.squarespaceContext && text.includes("Static.SQUARESPACE_CONTEXT")) inline.squarespaceContext = true;
      return undefined;
    });

  return {
    host: base.hostname.toLowerCase(),
    path: base.pathname,
    origin: base.origin,
    generators: metaContents($, "generator").map((g) => g.trim().slice(0, MAX_META_CHARS)),
    headers: home.headers ?? {},
    cookieNames: cookieNames(home.headers?.["set-cookie"]),
    assetHosts,
    assetPaths,
    inline,
    $,
  };
}

const hostIs = (h: string, domain: string) => h === domain || h.endsWith(`.${domain}`);
const countHosts = (s: Signals, test: (h: string) => boolean) => s.assetHosts.filter(test).length;
const header = (s: Signals, name: string) => (s.headers[name] ?? "").slice(0, 500);
const genMatches = (s: Signals, re: RegExp) => s.generators.some((g) => re.test(g));

type Hit = { confidence: Confidence; evidence: string } | null;
const high = (evidence: string): Hit => ({ confidence: "high", evidence });
const medium = (evidence: string): Hit => ({ confidence: "medium", evidence });

const RULES: { id: PlatformId; detect: (s: Signals) => Hit }[] = [
  {
    id: "wix",
    detect: (s) => {
      if (genMatches(s, R.GEN_WIX)) return high("generator meta tag");
      if (header(s, "x-wix-request-id")) return high("x-wix-request-id response header");
      if (countHosts(s, (h) => hostIs(h, "parastorage.com")) >= 2) return medium("scripts served from Wix's CDN (parastorage.com)");
      return null;
    },
  },
  {
    id: "squarespace",
    detect: (s) => {
      if (header(s, "server").toLowerCase() === "squarespace") return high("'Server: Squarespace' response header");
      if (s.inline.squarespaceContext) return high("Squarespace page context script");
      if (countHosts(s, (h) => hostIs(h, "sqspcdn.com") || hostIs(h, "squarespace-cdn.com")) >= 2) {
        return medium("scripts and styles served from Squarespace's CDN");
      }
      return null;
    },
  },
  {
    id: "shopify",
    detect: (s) => {
      const poweredBy = header(s, "powered-by").toLowerCase();
      const parts = poweredBy.split(",").map((p) => p.trim());
      // Hydrogen/Oxygen storefronts are custom code: the Online Store admin steps don't apply.
      if (parts.includes("hydrogen") || parts.includes("oxygen")) return null;
      const headerSaysShopify = parts.includes("shopify");
      if (s.inline.shopifyTheme && headerSaysShopify) return high("Shopify theme script and 'powered-by: Shopify' header");
      if (s.inline.shopifyTheme) return high("Shopify theme script");
      if (headerSaysShopify) return medium("'powered-by: Shopify' response header");
      if ([...s.cookieNames].some((c) => c.startsWith("_shopify_"))) return medium("Shopify storefront cookies");
      return null;
    },
  },
  {
    id: "webflow",
    detect: (s) => {
      if (genMatches(s, R.GEN_WEBFLOW)) return high("generator meta tag");
      if (s.$("html[data-wf-site]").length > 0) return high("Webflow site attribute on <html>");
      if (countHosts(s, (h) => h === "cdn.prod.website-files.com") >= 2) return medium("scripts and styles served from Webflow's CDN");
      return null;
    },
  },
  {
    id: "framer",
    detect: (s) => {
      if (genMatches(s, R.GEN_FRAMER)) return high("generator meta tag");
      if (R.SERVER_FRAMER.test(header(s, "server"))) return high("'Server: Framer' response header");
      if (countHosts(s, (h) => h === "framerusercontent.com") >= 2) return medium("assets served from Framer's CDN");
      return null;
    },
  },
  {
    id: "blogger",
    detect: (s) => {
      if (genMatches(s, R.GEN_BLOGGER)) return high("generator meta tag");
      return null;
    },
  },
  {
    id: "google-sites",
    detect: (s) => {
      if (s.host === "sites.google.com" && s.path.startsWith("/view/")) return high("hosted on sites.google.com");
      if (s.assetPaths.some((p) => p.startsWith("//www.gstatic.com/_/atari/"))) return medium("Google Sites viewer scripts");
      return null;
    },
  },
  {
    id: "godaddy",
    detect: (s) => {
      if (genMatches(s, R.GEN_GODADDY)) return high("generator meta tag");
      if (hostIs(s.host, "godaddysites.com")) return high("hosted on godaddysites.com");
      if (s.assetPaths.some((p) => p.startsWith("//img1.wsimg.com/") && p.includes("/website-builder"))) {
        return medium("GoDaddy Website Builder scripts");
      }
      return null;
    },
  },
  {
    id: "lovable",
    detect: (s) => {
      if (hostIs(s.host, "lovable.app")) return high("hosted on lovable.app");
      if (s.assetPaths.some((p) => p.startsWith("/__l5e/"))) return medium("Lovable hosting scripts (/__l5e/)");
      if (s.$("aside#lovable-badge").length > 0) return medium("'Edit with Lovable' badge");
      return null;
    },
  },
  {
    id: "wordpress",
    detect: (s) => {
      if (genMatches(s, R.GEN_WORDPRESS)) return high("generator meta tag");
      if (s.$('link[rel="https://api.w.org/"]').length > 0) return high("WordPress REST API link");
      const wpAssets = s.assetPaths.filter((p) => p.includes("/wp-content/") || p.includes("/wp-includes/")).length;
      if (wpAssets >= 2) return medium("scripts and styles loaded from /wp-content/ or /wp-includes/");
      return null;
    },
  },
  {
    id: "nextjs-app",
    detect: (s) => (s.inline.nextFlight ? high("Next.js App Router scripts") : null),
  },
  {
    id: "nextjs-pages",
    detect: (s) => (s.$("script#__NEXT_DATA__").length > 0 ? high("Next.js page data script") : null),
  },
];

function detectPlugin(s: Signals): PlatformDetection["plugin"] {
  const $ = s.$;
  if ($("script.yoast-schema-graph").length > 0) return { id: "yoast", name: PLUGIN_NAMES.yoast };
  if ($("script.rank-math-schema, script.rank-math-schema-pro").length > 0) return { id: "rank-math", name: PLUGIN_NAMES["rank-math"] };
  if ($("script.aioseo-schema").length > 0 || genMatches(s, R.GEN_AIOSEO)) return { id: "aioseo", name: PLUGIN_NAMES.aioseo };
  return undefined;
}

/**
 * The site's platform, or null when unknown or ambiguous (two different platforms both with
 * the strongest evidence). Never throws.
 */
export function detectPlatform(ctx: Pick<AuditContext, "pages">): PlatformDetection | null {
  const home = ctx.pages[0];
  if (!home) return null;
  try {
    const s = collectSignals(home);
    const hits: PlatformDetection[] = [];
    for (const rule of RULES) {
      const hit = rule.detect(s);
      if (hit) hits.push({ id: rule.id, name: PLATFORM_NAMES[rule.id], ...hit });
    }
    if (hits.length === 0) return null;
    const best = hits.some((h) => h.confidence === "high") ? hits.filter((h) => h.confidence === "high") : hits;
    if (best.length !== 1) return null;
    const found = best[0];
    if (found.id === "wordpress") {
      const plugin = detectPlugin(s);
      if (plugin) return { ...found, plugin };
    }
    return found;
  } catch {
    return null;
  }
}

const CF_MANAGED_MARKER = "begin cloudflare managed content";

/** Cloudflare in front of the site and/or its managed robots.txt block. Null when neither. */
export function detectCloudflare(ctx: Pick<AuditContext, "pages" | "robots">): CloudflareDetection | null {
  try {
    const h = ctx.pages[0]?.headers ?? {};
    const edge = (h.server ?? "").trim().toLowerCase() === "cloudflare" || Boolean(h["cf-ray"]);
    const robotsText = ctx.robots.status === "ok" ? (ctx.robots.text ?? "").slice(0, 200_000).toLowerCase() : "";
    const managedRobots = robotsText.includes(CF_MANAGED_MARKER);
    if (!edge && !managedRobots) return null;
    const evidence = managedRobots
      ? "Cloudflare's managed block in robots.txt"
      : h["cf-ray"]
        ? "cf-ray response header"
        : "'Server: cloudflare' response header";
    return { edge, managedRobots, evidence };
  } catch {
    return null;
  }
}
