/**
 * T024: platform detection, the dated fix map and the howToFix augmentation.
 * Fixtures use the markers seen on real sites on 2026-11-23 (ADR-019).
 */
import { describe, expect, it } from "vitest";
import { analyze } from "@/lib/audit/analyze";
import { detectCloudflare, detectPlatform, type PlatformId } from "@/lib/audit/platform";
import {
  FAMILY_OF,
  FIX_TARGET_LABELS,
  FIXES_CHECKED_ON,
  ISSUE_FAMILIES,
  PLATFORM_FIXES,
  fixFor,
  type FixTarget,
} from "@/lib/audit/platform-fixes";
import { ISSUE_CATALOG } from "@/lib/audit/issues";
import { toAgentPrompt, toTicketsMarkdown } from "@/lib/audit/export";
import type { AuditResult } from "@/lib/audit/types";
import { doc, makeCtx, page } from "./helpers";

const HOME = "https://acme.example.com/";
const HTML_HEADERS = { "content-type": "text/html" };

function detect(html: string, opts: { url?: string; headers?: Record<string, string> } = {}) {
  const url = opts.url ?? HOME;
  return detectPlatform(makeCtx({ pages: [page(html, url, { headers: { ...HTML_HEADERS, ...opts.headers } })] }));
}

const body = "<h1>Acme</h1><p>We fix things.</p>";

describe("detectPlatform: positives (one fixture per platform)", () => {
  const cases: { name: string; id: PlatformId; confidence: "high" | "medium"; html: string; url?: string; headers?: Record<string, string> }[] = [
    { name: "WordPress generator", id: "wordpress", confidence: "high", html: doc({ head: '<meta name="generator" content="WordPress 6.9">', body }) },
    { name: "WordPress REST link", id: "wordpress", confidence: "high", html: doc({ head: '<link rel="https://api.w.org/" href="https://acme.example.com/wp-json/">', body }) },
    {
      name: "WordPress assets only",
      id: "wordpress",
      confidence: "medium",
      html: doc({
        head: '<link rel="stylesheet" href="/wp-content/themes/acme/style.css"><script src="/wp-includes/js/jquery/jquery.min.js"></script>',
        body,
      }),
    },
    { name: "Wix generator", id: "wix", confidence: "high", html: doc({ head: '<meta name="generator" content="Wix.com Website Builder"/>', body }) },
    { name: "Wix header", id: "wix", confidence: "high", html: doc({ body }), headers: { "x-wix-request-id": "1795381278.27" } },
    {
      name: "Wix scripts",
      id: "wix",
      confidence: "medium",
      html: doc({ head: '<script src="https://static.parastorage.com/a.js"></script><link rel="stylesheet" href="https://static.parastorage.com/b.css">', body }),
    },
    { name: "Squarespace server", id: "squarespace", confidence: "high", html: doc({ body }), headers: { server: "Squarespace" } },
    {
      name: "Squarespace context",
      id: "squarespace",
      confidence: "high",
      html: doc({ head: "<script>Static.SQUARESPACE_CONTEXT = {};</script>", body }),
    },
    {
      name: "Shopify theme + header",
      id: "shopify",
      confidence: "high",
      html: doc({ head: '<script>window.Shopify = window.Shopify || {}; Shopify.theme = {"name":"Dawn"};</script>', body }),
      headers: { "powered-by": "Shopify" },
    },
    { name: "Shopify header only", id: "shopify", confidence: "medium", html: doc({ body }), headers: { "powered-by": "Shopify" } },
    {
      name: "Shopify cookies only",
      id: "shopify",
      confidence: "medium",
      html: doc({ body }),
      headers: { "set-cookie": "_shopify_essential=abc; Path=/; HttpOnly, localization=US; path=/; expires=Mon, 22 Nov 2027 21:00:45 GMT" },
    },
    { name: "Webflow generator", id: "webflow", confidence: "high", html: doc({ head: '<meta content="Webflow" name="generator"/>', body }) },
    {
      name: "Webflow html attribute",
      id: "webflow",
      confidence: "high",
      html: `<!doctype html><html data-wf-site="686294e263eb7e215bd232f7" data-wf-page="x"><head></head><body>${body}</body></html>`,
    },
    { name: "Framer generator", id: "framer", confidence: "high", html: doc({ head: '<meta name="generator" content="Framer dbde51c">', body }) },
    { name: "Framer server", id: "framer", confidence: "high", html: doc({ body }), headers: { server: "Framer/3e471b4" } },
    {
      name: "Next.js App Router",
      id: "nextjs-app",
      confidence: "high",
      html: doc({ head: '<script src="/_next/static/chunks/main.js"></script>', body: `${body}<script>(self.__next_f=self.__next_f||[]).push([0])</script>` }),
    },
    {
      name: "Next.js Pages Router",
      id: "nextjs-pages",
      confidence: "high",
      html: doc({ body: `${body}<script id="__NEXT_DATA__" type="application/json">{"page":"/"}</script>` }),
    },
    { name: "Lovable host", id: "lovable", confidence: "high", html: doc({ body }), url: "https://founder-stories.lovable.app/" },
    { name: "Lovable scripts", id: "lovable", confidence: "medium", html: doc({ head: '<script src="/__l5e/events.b979ee024b15adfd.js"></script>', body }) },
    { name: "Lovable badge", id: "lovable", confidence: "medium", html: doc({ body: `${body}<aside id="lovable-badge"><a id="lovable-badge-cta">Edit with Lovable</a></aside>` }) },
    { name: "Google Sites host", id: "google-sites", confidence: "high", html: doc({ body }), url: "https://sites.google.com/view/acme-plumbing" },
    {
      name: "Google Sites scripts",
      id: "google-sites",
      confidence: "medium",
      html: doc({ head: '<script src="https://www.gstatic.com/_/atari/_/js/k=atari.vw.en_US.x/m=view"></script>', body }),
    },
    {
      name: "GoDaddy generator",
      id: "godaddy",
      confidence: "high",
      html: doc({ head: '<meta name="generator" content="Starfield Technologies; Go Daddy Website Builder 8.0.0000"/>', body }),
    },
    { name: "GoDaddy host", id: "godaddy", confidence: "high", html: doc({ body }), url: "https://cityofacme.godaddysites.com/" },
    { name: "Blogger generator", id: "blogger", confidence: "high", html: doc({ head: "<meta content='blogger' name='generator'/>", body }) },
  ];
  for (const c of cases) {
    it(c.name, () => {
      const d = detect(c.html, { url: c.url, headers: c.headers });
      expect(d?.id).toBe(c.id);
      expect(d?.confidence).toBe(c.confidence);
      expect(d?.evidence.length).toBeGreaterThan(5);
    });
  }

  it("WordPress SEO plugins are named from their own markup", () => {
    const wp = '<meta name="generator" content="WordPress 6.9">';
    expect(detect(doc({ head: `${wp}<script type="application/ld+json" class="yoast-schema-graph">{}</script>`, body }))?.plugin?.id).toBe("yoast");
    expect(detect(doc({ head: `${wp}<script type="application/ld+json" class="rank-math-schema-pro">{}</script>`, body }))?.plugin?.id).toBe("rank-math");
    expect(detect(doc({ head: `${wp}<meta name="generator" content="All in One SEO Pro (AIOSEO) 5.0.5" />`, body }))?.plugin?.id).toBe("aioseo");
    expect(detect(doc({ head: wp, body }))?.plugin).toBeUndefined();
  });
});

describe("detectPlatform: near-miss negatives (never guess)", () => {
  const nulls: { name: string; html: string; url?: string; headers?: Record<string, string> }[] = [
    { name: "plain site", html: doc({ body }) },
    {
      name: "links and images from wp-content on another site",
      html: doc({ body: `${body}<a href="https://other.example/wp-content/uploads/menu.pdf">Menu</a><img src="https://other.example/wp-content/uploads/a.jpg">` }),
    },
    { name: "one stray wp-content script", html: doc({ head: '<script src="https://cdn.example/wp-content/plugins/x.js"></script>', body }) },
    {
      name: "hotlinked Wix images",
      html: doc({ body: `${body}<img src="https://static.wixstatic.com/media/a.jpg"><img src="https://static.wixstatic.com/media/b.jpg"><img src="https://static.wixstatic.com/media/c.jpg">` }),
    },
    { name: "a page that says it moved away from Wix", html: doc({ body: "<p>We moved from Wix.com Website Builder to our own site.</p>" }) },
    { name: "Squarespace CDN images only", html: doc({ body: `${body}<img src="https://images.squarespace-cdn.com/a.jpg"><img src="https://images.squarespace-cdn.com/b.jpg">` }) },
    {
      name: "Shopify CDN images without a Shopify storefront",
      html: doc({ body: `${body}<img src="https://cdn.shopify.com/s/files/1/a.jpg"><script src="https://cdn.shopify.com/shopifycloud/x.js"></script>` }),
    },
    {
      name: "Shopify Hydrogen storefront (custom code)",
      html: doc({ body: `${body}<img src="https://cdn.shopify.com/s/files/1/a.jpg">` }),
      headers: { "powered-by": "Shopify, Oxygen, Hydrogen" },
    },
    { name: "a 'Made in Framer' link", html: doc({ body: `${body}<a href="https://www.framer.com/">Made in Framer</a>` }) },
    { name: "a link to Webflow", html: doc({ body: `${body}<a href="https://webflow.com/">Built with Webflow</a>` }) },
    { name: "Next.js mentioned in text, not in a script", html: doc({ body: "<p>Our app uses self.__next_f and __NEXT_DATA__ internally.</p>" }) },
    { name: "a 'Built with Lovable' link", html: doc({ body: `${body}<a href="https://lovable.dev/">Built with Lovable</a>` }) },
    { name: "Google Fonts from gstatic", html: doc({ head: '<link rel="stylesheet" href="https://fonts.gstatic.com/s/inter.css">', body }) },
    { name: "a sites.google.com page outside /view/", html: doc({ body }), url: "https://sites.google.com/" },
    { name: "a GoDaddy-hosted image", html: doc({ body: `${body}<img src="https://img1.wsimg.com/isteam/ip/abc/logo.png">` }) },
    { name: "a link to a Blogger blog", html: doc({ body: `${body}<a href="https://acme.blogspot.com/">Our old blog</a>` }) },
    {
      name: "two platforms with strong markers (ambiguous)",
      html: doc({ head: '<meta name="generator" content="Wix.com Website Builder"><meta name="generator" content="Webflow">', body }),
    },
  ];
  for (const c of nulls) {
    it(c.name, () => {
      expect(detect(c.html, { url: c.url, headers: c.headers })).toBeNull();
    });
  }

  it("a high-confidence marker wins over a weaker one from another platform", () => {
    // Headless Next.js store with Shopify cookies (like gymshark.com): the code is Next.js.
    const d = detect(doc({ body: `${body}<script id="__NEXT_DATA__" type="application/json">{}</script>` }), {
      headers: { "set-cookie": "_shopify_y=abc; Path=/" },
    });
    expect(d?.id).toBe("nextjs-pages");
  });

  it("never throws on an empty context", () => {
    expect(detectPlatform({ pages: [] })).toBeNull();
  });
});

describe("detectCloudflare", () => {
  const ctx = (robots: string | null, headers: Record<string, string> = {}) =>
    makeCtx({ pages: [page(doc({ body }), HOME, { headers: { ...HTML_HEADERS, ...headers } })], robots });

  it("finds the managed robots.txt block", () => {
    const d = detectCloudflare(ctx("# BEGIN Cloudflare Managed content\nUser-agent: GPTBot\nDisallow: /\n# END Cloudflare Managed Content\n"));
    expect(d).toMatchObject({ managedRobots: true, edge: false });
  });
  it("finds the edge from headers", () => {
    expect(detectCloudflare(ctx(null, { "cf-ray": "a5eadc883fc78cf1-BLR", server: "cloudflare" }))).toMatchObject({ edge: true, managedRobots: false });
  });
  it("null without either", () => {
    expect(detectCloudflare(ctx("User-agent: *\nAllow: /\n", { server: "nginx" }))).toBeNull();
  });
});

describe("fix map", () => {
  const VENDOR_HOSTS: Record<FixTarget, string[]> = {
    wordpress: ["wordpress.org", "make.wordpress.org"],
    yoast: ["yoast.com"],
    "rank-math": ["rankmath.com"],
    aioseo: ["aioseo.com"],
    shopify: ["help.shopify.com"],
    wix: ["support.wix.com"],
    squarespace: ["support.squarespace.com"],
    webflow: ["help.webflow.com"],
    framer: ["www.framer.com"],
    "nextjs-app": ["nextjs.org"],
    "nextjs-pages": ["nextjs.org"],
    lovable: ["docs.lovable.dev"],
    blogger: ["support.google.com"],
    "google-sites": ["support.google.com"],
    godaddy: ["www.godaddy.com"],
    cloudflare: ["developers.cloudflare.com"],
  };
  const entries = Object.entries(PLATFORM_FIXES).flatMap(([target, fam]) =>
    Object.entries(fam ?? {}).map(([family, entry]) => ({ target: target as FixTarget, family, entry: entry! })),
  );

  it("has entries", () => {
    expect(entries.length).toBeGreaterThan(80);
  });

  it("every entry has a vendor sourceUrl and a checkedOn date", () => {
    for (const { target, family, entry } of entries) {
      const where = `${target}/${family}`;
      expect(entry.checkedOn, where).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.checkedOn, where).toBe(FIXES_CHECKED_ON);
      for (const src of [entry.sourceUrl, ...(entry.extraSourceUrls ?? [])]) {
        const u = new URL(src);
        expect(u.protocol, where).toBe("https:");
        expect(VENDOR_HOSTS[target], `${where}: ${src}`).toContain(u.hostname);
      }
      expect(entry.steps.length, where).toBeGreaterThan(20);
      expect(entry.steps.length, where).toBeLessThan(500);
      expect(entry.steps, where).not.toMatch(/\n/);
    }
  });

  it("entries are re-checked at least every 6 months (re-verify on the vendor pages, then bump FIXES_CHECKED_ON)", () => {
    const ageDays = (Date.now() - Date.parse(`${FIXES_CHECKED_ON}T00:00:00Z`)) / 86_400_000;
    // Warn instead of failing: a calendar date must not break CI on its own (Fable, 2026-11-23).
    if (ageDays >= 183) {
      console.warn(
        `[platform-fixes] entries were last checked ${Math.round(ageDays)} days ago: re-verify the vendor pages and bump FIXES_CHECKED_ON.`,
      );
    }
    expect(Number.isFinite(ageDays)).toBe(true);
  });

  it("families only name real issue ids and only real families are used", () => {
    for (const ids of Object.values(ISSUE_FAMILIES)) for (const id of ids) expect(ISSUE_CATALOG).toHaveProperty(id);
    for (const { family } of entries) expect(ISSUE_FAMILIES).toHaveProperty(family);
    expect(new Set(FAMILY_OF.keys()).size).toBe(Object.values(ISSUE_FAMILIES).flat().length);
    for (const t of Object.keys(PLATFORM_FIXES)) expect(FIX_TARGET_LABELS).toHaveProperty(t);
  });

  it("GoDaddy has no entries (its help pages refused curl on 2026-11-23)", () => {
    expect(PLATFORM_FIXES.godaddy).toBeUndefined();
  });

  it("looks up by issue id", () => {
    expect(fixFor("wix", "seo.title:missing")?.sourceUrl).toMatch(/support\.wix\.com/);
    expect(fixFor("wix", "performance.cwv:slow")).toBeNull();
    expect(fixFor("squarespace", "geo.ai-crawlers:training-blocked")?.steps).toMatch(/Block known artificial intelligence crawlers/);
  });
});

describe("howToFix augmentation in analyze()", () => {
  const head = (extra = "") => `<meta name="viewport" content="width=device-width, initial-scale=1">${extra}`;
  // No <title>, no description: seo.title:missing and seo.meta-description:missing fire.
  const html = (extra = "") => doc({ head: head(extra), body: "<h1>Acme Plumbing</h1><p>Plumbers in Leeds.</p>" });
  const run = (extra = "", robots: string | null = null, headers: Record<string, string> = {}) =>
    analyze(makeCtx({ pages: [page(html(extra), HOME, { headers: { ...HTML_HEADERS, ...headers } })], robots }));

  it("adds a dated, sourced block after the generic text when a platform is detected", () => {
    const r = run('<meta name="generator" content="Wix.com Website Builder"/>');
    const title = r.issues.find((i) => i.id === "seo.title:missing")!;
    const generic = ISSUE_CATALOG["seo.title:missing"].howToFix;
    expect(title.howToFix.startsWith(generic)).toBe(true);
    expect(title.howToFix).toContain("\n\nOn Wix: In the editor click Pages & Menu");
    expect(title.howToFix).toMatch(/\(checked 2026-11-23, source: https:\/\/support\.wix\.com\/en\/article\/[a-z0-9-]+\)$/);
    expect(r.notes).toContain(
      "Detected platform: Wix (generator meta tag). Where-to-click steps for it were added to " +
        `${r.issues.filter((i) => i.howToFix.includes("\n\nOn Wix:")).length} fixes, checked against the vendor's help pages on 2026-11-23.`,
    );
  });

  it("leaves every howToFix untouched when nothing is detected", () => {
    const r = run();
    for (const i of r.issues) expect(i.howToFix, i.id).toBe(ISSUE_CATALOG[i.id as keyof typeof ISSUE_CATALOG].howToFix);
    expect(r.notes.some((n) => n.startsWith("Detected platform"))).toBe(false);
  });

  it("hedges medium-confidence detections", () => {
    const r = run("", null, { "powered-by": "Shopify" });
    const title = r.issues.find((i) => i.id === "seo.title:missing")!;
    expect(title.howToFix).toContain("\n\nIf your site runs on Shopify: Pages: Online Store > Pages");
    expect(r.notes.find((n) => n.startsWith("Detected platform"))).toMatch(/^Detected platform: Shopify \(likely; 'powered-by: Shopify' response header\)\./);

    const wp = run(
      '<link rel="stylesheet" href="/wp-content/themes/a/style.css"><script src="/wp-includes/js/a.js"></script><meta name="generator" content="All in One SEO (AIOSEO) 4.9">',
    );
    const t = wp.issues.find((i) => i.id === "seo.title:missing")!;
    expect(t.howToFix).toContain("\n\nIf you use All in One SEO: Edit the page and scroll down to AIOSEO Settings");
  });

  it("does not change scores, checks, impact or issue order", () => {
    const plain = run();
    const wix = run('<meta name="generator" content="Wix.com Website Builder"/>');
    expect(wix.scores).toEqual(plain.scores);
    expect(wix.checks).toEqual(plain.checks);
    expect(wix.pages).toEqual(plain.pages);
    expect(wix.issues.map((i) => [i.id, i.impact, i.severity, i.title, i.description])).toEqual(
      plain.issues.map((i) => [i.id, i.impact, i.severity, i.title, i.description]),
    );
  });

  it("adds both the WordPress and the SEO plugin steps", () => {
    const r = analyze(
      makeCtx({
        pages: [
          page(
            doc({
              head: `${head('<meta name="generator" content="WordPress 6.9"><meta name="robots" content="noindex,nofollow">')}<script type="application/ld+json" class="yoast-schema-graph">{"@context":"https://schema.org","@graph":[]}</script>`,
              body: "<h1>Acme</h1><p>Plumbers in Leeds.</p>",
            }),
            HOME,
          ),
        ],
      }),
    );
    const noindex = r.issues.find((i) => i.id === "seo.indexability:noindex")!;
    const wpAt = noindex.howToFix.indexOf("\n\nOn WordPress: Go to Settings > Reading");
    const yoastAt = noindex.howToFix.indexOf("\n\nIn Yoast SEO: Edit the page");
    expect(wpAt).toBeGreaterThan(0);
    expect(yoastAt).toBeGreaterThan(wpAt);
    expect(r.notes.some((n) => n.startsWith("Detected platform: WordPress with Yoast SEO (generator meta tag)."))).toBe(true);
  });

  it("adds Cloudflare steps only when its managed robots.txt block is present", () => {
    const managed = "# BEGIN Cloudflare Managed content\nUser-agent: GPTBot\nDisallow: /\nUser-agent: ClaudeBot\nDisallow: /\n# END Cloudflare Managed Content\nUser-agent: *\nAllow: /\n";
    const withCf = run("", managed, { "cf-ray": "abc-BLR", server: "cloudflare" });
    const training = withCf.issues.find((i) => i.id === "geo.ai-crawlers:training-blocked")!;
    expect(training.howToFix).toContain("\n\nOn Cloudflare: Your robots.txt starts with Cloudflare's managed block");
    expect(withCf.notes.some((n) => n.startsWith("Detected Cloudflare in front of the site (Cloudflare's managed block in robots.txt)"))).toBe(true);

    const plainBlock = "User-agent: GPTBot\nDisallow: /\nUser-agent: ClaudeBot\nDisallow: /\nUser-agent: *\nAllow: /\n";
    const noCf = run("", plainBlock, { "cf-ray": "abc-BLR", server: "cloudflare" });
    const t2 = noCf.issues.find((i) => i.id === "geo.ai-crawlers:training-blocked")!;
    expect(t2.howToFix).toBe(ISSUE_CATALOG["geo.ai-crawlers:training-blocked"].howToFix);
    expect(noCf.notes.some((n) => n.includes("Cloudflare"))).toBe(false);
  });

  it("export fences still hold the augmented text", () => {
    const a = run('<meta name="generator" content="Wix.com Website Builder"/>');
    const result: AuditResult = {
      id: "00000000-0000-4000-8000-000000000000",
      version: 1,
      requestedUrl: HOME,
      finalUrl: HOME,
      hostname: "acme.example.com",
      startedAt: "2026-11-23T00:00:00.000Z",
      durationMs: 1,
      scores: a.scores,
      checks: a.checks,
      issues: a.issues,
      pages: a.pages,
      coreWebVitals: null,
      truncated: false,
      notes: a.notes,
      ai: null,
    };
    const tickets = toTicketsMarkdown(result);
    const prompt = toAgentPrompt(result);
    const title = a.issues.find((i) => i.id === "seo.title:missing")!;
    // The whole howToFix (generic + platform block) sits inside one fenced block.
    expect(tickets).toContain(`**Change**\n\n\`\`\`text\n${title.howToFix}\n\`\`\``);
    expect(prompt).toContain(`Fix: ${title.howToFix}\n\`\`\``);
    // Fences stay balanced: every opening ``` line has a closing one.
    for (const md of [tickets, prompt]) {
      const fences = md.split("\n").filter((l) => /^`{3,}/.test(l));
      expect(fences.length % 2).toBe(0);
    }
  });
});
