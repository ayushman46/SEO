/**
 * Regression tests for the R2 review findings (engine side). One block per finding.
 */
import { describe, expect, it } from "vitest";
import { load } from "cheerio";
import { doc, goodHome, makeCtx, okText, page } from "./helpers";
import { analyze } from "@/lib/audit/analyze";
import { countWords, metaContent, parsePage, prescanHtml, visibleText } from "@/lib/audit/html";
import { isAnswerParagraph, countAnswerBlocks, hasListsOrTables } from "@/lib/audit/checks/geo/answer-ready";
import { aiCrawlersCheck } from "@/lib/audit/checks/geo/ai-crawlers";
import { isOrgType } from "@/lib/audit/checks/geo/schema-util";
import { organizationSchemaCheck } from "@/lib/audit/checks/geo/organization-schema";
import { indexabilityCheck, isNoindex } from "@/lib/audit/checks/seo/indexability";
import { robotsTxtCheck } from "@/lib/audit/checks/seo/robots-txt";
import { canonicalCheck } from "@/lib/audit/checks/seo/canonical";
import { openGraphCheck } from "@/lib/audit/checks/seo/open-graph";
import { parseSitemap } from "@/lib/audit/checks/seo/sitemap";
import { isBlocked, parseRobots } from "@/lib/audit/robots";
import { isHtmlSoft404 } from "@/lib/audit/crawl";
import { resolvePublicAddress } from "@/lib/audit/net/ssrf";
import { AuditError } from "@/lib/audit/types";

const HOME = "https://acme.example.com/";
const keys = (o: { issues: { key: string }[] }) => o.issues.map((i) => i.key);
const ld = (obj: unknown) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
const parse = (html: string, url = HOME, headers: Record<string, string> = {}) =>
  parsePage({ url, requestedUrl: url, statusCode: 200, headers, html, isHome: url === HOME });

describe("#1 answer-ready semantics kept after the linear rewrite", () => {
  const answer =
    "<p>Acme Plumbing fixes leaking pipes, blocked drains and broken boilers across Leeds, with same-day visits and fixed prices quoted before any work begins.</p>";
  it("counts heading + answer, heading alone in a wrapper, and ignores nav/header/footer", () => {
    expect(countAnswerBlocks(load(`<main><h2>Cost?</h2>${answer}</main>`))).toBe(1);
    expect(countAnswerBlocks(load(`<main><div><h2>Cost?</h2></div>${answer}</main>`))).toBe(1);
    expect(countAnswerBlocks(load(`<main><div><h2>Cost?</h2></div><div>${answer}</div></main>`))).toBe(1);
    expect(countAnswerBlocks(load(`<header><h2>Cost?</h2>${answer}</header><footer><h3>x</h3>${answer}</footer>`))).toBe(0);
  });
  it("lists/tables: 3+ items outside chrome, scoped to main when present", () => {
    const list = "<ul><li>a</li><li>b</li><li>c</li></ul>";
    expect(hasListsOrTables(load(`<body>${list}</body>`))).toBe(true);
    expect(hasListsOrTables(load(`<body><nav>${list}</nav></body>`))).toBe(false);
    expect(hasListsOrTables(load(`<body><main><p>x</p></main>${list}</body>`))).toBe(false);
    expect(hasListsOrTables(load(`<body><article>${list}</article></body>`))).toBe(true);
    expect(hasListsOrTables(load("<body><table><tr><td>a</td></tr><tr><td>b</td></tr></table></body>"))).toBe(true);
    expect(hasListsOrTables(load("<body><table><tr><td>a</td></tr></table></body>"))).toBe(false);
  });
});

describe("#2/#3 parsePage results unchanged by the iterative walkers", () => {
  it("visible text skips script/style/svg/etc.; nav links flagged; <base> respected; svg <title> ignored", () => {
    const p = parse(
      '<html><head><base href="https://acme.example.com/sub/"></head><body><svg><title>Icon</title></svg>' +
        '<header><a href="a">A</a></header><div role="navigation"><a href="b">B</a></div>' +
        '<script>var x = "hidden words";</script><style>.a{}</style><noscript>no</noscript>' +
        '<p>Two words</p><a href="/c">C</a><title>Real title</title></body></html>',
    );
    // Same as before the rewrite: text nodes are joined as-is ("ABTwo wordsCReal title"); svg,
    // script, style and noscript contribute nothing.
    expect(p.wordCount).toBe(3);
    expect(p.links).toEqual([
      { href: "https://acme.example.com/sub/a", inNav: true },
      { href: "https://acme.example.com/sub/b", inNav: true },
      { href: "https://acme.example.com/c", inNav: false },
    ]);
    expect(p.title).toBe("Real title");
  });
  it("visibleText matches the old clone+remove implementation on a realistic page", () => {
    const html = goodHome().replace(
      "</main>",
      '<script>var hidden = 1;</script><svg><text>logo</text></svg><template><p>tpl</p></template><iframe>f</iframe></main>',
    );
    const $ = load(html);
    const body = $("body").clone();
    body.find("script, style, noscript, template, svg, iframe").remove();
    expect(visibleText($)).toBe(body.text().replace(/\s+/g, " ").trim());
  });
  it("normal SVG-heavy pages (self-closing paths) are not mistaken for deep nesting", () => {
    const svg = `<svg viewBox="0 0 10 10">${'<path d="M0 0L1 1"/>'.repeat(3_000)}</svg>`;
    const html = `<html><body>${svg.repeat(5)}<div><br><img src="x.png"><p>a<p>b<li>c</body></html>`;
    expect(prescanHtml(html).tooComplex).toBe(false);
    expect(prescanHtml(html).depth).toBeLessThan(5);
    expect(() => parse(html)).not.toThrow();
  });
  it("inline scripts with '<' comparisons don't count as tags", () => {
    const html = `<html><body><script>${"if (a<b && c<d) {}\n".repeat(60_000)}</script><p>ok</p></body></html>`;
    expect(prescanHtml(html).tooComplex).toBe(false);
  });
});

describe("#4 sitemap fallback regex still extracts locs (and is linear)", () => {
  it("plain, namespaced and CDATA-wrapped locs", () => {
    expect(parseSitemap(`<urlset><url><loc>${HOME}a</loc></url></urlset>`).locs).toEqual([`${HOME}a`]);
    expect(parseSitemap(`<sm:urlset><sm:url><sm:loc>${HOME}b</sm:loc></sm:url></sm:urlset>`).locs).toEqual([`${HOME}b`]);
    expect(parseSitemap(`<urlset><url><loc><![CDATA[ ${HOME}c ]]></loc></url></urlset>`).locs).toEqual([`${HOME}c`]);
    expect(parseSitemap(`<sm:urlset><sm:loc>\n  <![CDATA[${HOME}d]]></sm:loc></sm:urlset>`).locs).toEqual([`${HOME}d`]);
  });
});

describe("#5 meta robots directive values", () => {
  it("max-image-preview:none is not 'none'", () => {
    const o = indexabilityCheck(
      makeCtx({ pages: [page(doc({ head: '<meta name="robots" content="index, follow, max-image-preview:none">' }))] }),
    );
    expect(o.status).toBe("pass");
    expect(o.issues).toEqual([]);
    const spaced = makeCtx({ pages: [page(doc({ head: '<meta name="robots" content="max-image-preview: none">' }))] });
    expect(isNoindex(spaced.pages[0])).toBe(false);
  });
  it("real noindex / none directives still count (incl. space-separated)", () => {
    for (const c of ["noindex", "NONE", "follow, noindex", "noindex nofollow"]) {
      const ctx = makeCtx({ pages: [page(doc({ head: `<meta name="googlebot" content="${c}">` }))] });
      expect(isNoindex(ctx.pages[0])).toBe(true);
    }
  });
});

describe("#7 organization types from schema.org", () => {
  it("accepts real Organization/LocalBusiness subtypes, rejects Service subtypes", () => {
    for (const t of ["Winery", "Motel", "Resort", "Brewery", "SportsTeam", "Airline", "EmergencyService", "IceCreamShop", "GasStation", "Library", "MusicGroup", "schema:Hostel", "https://schema.org/Campground"]) {
      expect(isOrgType(t), t).toBe(true);
    }
    for (const t of ["TaxiService", "FoodService", "GovernmentService", "Service", "Person", "WebSite", "Product"]) {
      expect(isOrgType(t), t).toBe(false);
    }
    expect(isOrgType("PetGroomingBusiness")).toBe(true); // unknown extension type, business-like name
  });
  it("a complete Winery scores 1", () => {
    const o = organizationSchemaCheck(
      makeCtx({ pages: [page(doc({ head: ld({ "@context": "https://schema.org", "@type": "Winery", name: "X", url: "https://x.com", logo: "https://x.com/l.png" }) }))] }),
    );
    expect(o.status).toBe("pass");
    expect(o.score).toBe(1);
  });
});

describe("#8/#25 robots rules bind to the requested robots.txt URL", () => {
  it("redirected robots.txt still applies to the audited origin", () => {
    const robots = parseRobots({
      status: "ok",
      url: "https://cdn.other.example.net/robots.txt",
      requestedUrl: "https://example.com/robots.txt",
      statusCode: 200,
      text: "User-agent: *\nDisallow: /",
    });
    expect(isBlocked(robots, "https://example.com/about", "GPTBot")).toBe(true);
    const plain = parseRobots({ status: "ok", url: "https://example.com/robots.txt", statusCode: 200, text: "User-agent: *\nDisallow: /" });
    expect(isBlocked(plain, "https://example.com/about", "GPTBot")).toBe(true);
  });
});

describe("#12 robots.txt allow-list for Google and Bing", () => {
  const allowList = "User-agent: Googlebot\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: *\nDisallow: /";
  it("is a warning, not a fail", () => {
    const o = robotsTxtCheck(makeCtx({ pages: [page(doc())], robots: allowList }));
    expect(o.status).toBe("warn");
    expect(keys(o)).toEqual(["seo.robots-txt:blocks-unlisted"]);
  });
  it("blocking Bing alone is a high-severity fail", () => {
    const o = robotsTxtCheck(makeCtx({ pages: [page(doc())], robots: "User-agent: Bingbot\nDisallow: /" }));
    expect(o.status).toBe("fail");
    expect(o.issues[0]).toMatchObject({ key: "seo.robots-txt:blocks-all", severity: "high" });
  });
});

describe("#13 metaContent keys", () => {
  it("ignores microdata itemprop and checks name and property independently", () => {
    expect(parse('<html><body><div itemscope><meta itemprop="description" content="Red shoe"></div></body></html>').metaDescription).toBeNull();
    const $ = load('<meta name="description" property="og:description" content="x">');
    expect(metaContent($, "og:description")).toBe("x");
    expect(metaContent($, "description")).toBe("x");
    const og = openGraphCheck(
      makeCtx({
        pages: [
          page(
            doc({
              head: '<meta property="og:title" content="t"><meta name="description" property="og:description" content="d"><meta property="og:image" content="https://acme.example.com/i.png">',
            }),
          ),
        ],
      }),
    );
    expect(og.issues.some((i) => i.detail?.includes("og:description"))).toBe(false);
  });
});

describe("#14 CJK/Thai word and sentence counting", () => {
  const ja =
    "東京で歯科医院を選ぶときは、通いやすさと料金の分かりやすさを必ず確認しましょう。当院は駅から徒歩三分の場所にあり、平日は夜八時まで診療しています。";
  it("a two-sentence Japanese paragraph is an answer paragraph", () => {
    expect(countWords(ja)).toBeGreaterThanOrEqual(20);
    expect(isAnswerParagraph(ja)).toBe(true);
    expect(countAnswerBlocks(load(`<main><h2>料金はいくらですか</h2><p>${ja}</p></main>`))).toBe(1);
  });
  it("English counts are unchanged", () => {
    const en =
      "Acme Plumbing fixes leaking pipes, blocked drains and broken boilers across Leeds, with same-day visits and fixed prices quoted before any work begins.";
    expect(countWords(en)).toBe(23);
    expect(countWords("same-day — 24/7 ok")).toBe(3);
  });
});

describe("#15 AI crawlers blocked beyond the homepage", () => {
  const about = page(doc(), "https://acme.example.com/about");
  it("(a) everything but the homepage blocked counts as blocked", () => {
    const o = aiCrawlersCheck(makeCtx({ pages: [page(doc()), about], robots: "User-agent: GPTBot\nDisallow: /\nAllow: /$" }));
    expect(keys(o)).toEqual(["geo.ai-crawlers:training-blocked"]);
  });
  it("(b) one section blocked is a partial block with affected URLs", () => {
    const post = page(doc(), "https://acme.example.com/blog/post");
    const o = aiCrawlersCheck(makeCtx({ pages: [page(doc()), post], robots: "User-agent: OAI-SearchBot\nDisallow: /blog/" }));
    expect(keys(o)).toEqual(["geo.ai-crawlers:partially-blocked"]);
    expect(o.issues[0].affectedUrls).toEqual(["https://acme.example.com/blog/post"]);
    expect(o.issues[0].severity).toBe("high");
    expect(o.status).not.toBe("pass");
    expect(o.summary).not.toMatch(/All \d+ major AI crawlers are allowed/);
  });
  it("(c) unaffected cases", () => {
    expect(aiCrawlersCheck(makeCtx({ pages: [page(doc()), about], robots: "User-agent: *\nAllow: /" })).status).toBe("pass");
    const full = aiCrawlersCheck(makeCtx({ pages: [page(doc()), about], robots: "User-agent: *\nDisallow: /" }));
    expect(full.score).toBe(0);
  });
});

describe("#16 localhost names never reach DNS", () => {
  it("rejects *.localhost", async () => {
    for (const h of ["foo.localhost", "LOCALHOST.", "a.b.localhost."]) {
      const e = await resolvePublicAddress(h).catch((x: unknown) => x);
      expect(e).toBeInstanceOf(AuditError);
      expect((e as AuditError).code).toBe("blocked_host");
    }
  });
});

describe("#17 page summaries cap page-controlled strings", () => {
  it("title and meta description are truncated in the result, full for checks", () => {
    const longTitle = "T".repeat(5_000);
    const longDesc = "D".repeat(5_000);
    const ctx = makeCtx({ pages: [page(doc({ head: `<title>${longTitle}</title><meta name="description" content="${longDesc}">` }))] });
    const a = analyze(ctx);
    expect(a.pages[0].title).toHaveLength(300);
    expect(a.pages[0].metaDescription).toHaveLength(500);
    expect(ctx.pages[0].title).toHaveLength(5_000);
  });
});

describe("#22 canonical dedupe by resolved URL", () => {
  it("same URL in tag and header (with/without trailing slash) is not 'multiple'", () => {
    const o = canonicalCheck(
      makeCtx({ pages: [page(doc({ head: `<link rel="canonical" href="${HOME}">` }), HOME, { headers: { link: '<https://acme.example.com>; rel="canonical"' } })] }),
    );
    expect(o.status).toBe("pass");
    const rel = canonicalCheck(
      makeCtx({ pages: [page(doc({ head: '<link rel="canonical" href="/">' }), HOME, { headers: { link: `<${HOME}>; rel="canonical"` } })] }),
    );
    expect(keys(rel)).toEqual(["seo.canonical:relative"]);
  });
  it("#6 inner pages canonicalised to the homepage are flagged", () => {
    const canon = `<link rel="canonical" href="${HOME}">`;
    const o = canonicalCheck(
      makeCtx({ pages: [page(doc({ head: canon })), page(doc({ head: canon }), "https://acme.example.com/about")] }),
    );
    expect(keys(o)).toEqual(["seo.canonical:points-to-home"]);
    expect(o.issues[0].affectedUrls).toEqual(["https://acme.example.com/about"]);
  });
});

describe("#23 X-Robots-Tag scope resets per header line", () => {
  const ctx = (v: string) => makeCtx({ pages: [page(doc(), HOME, { headers: { "x-robots-tag": v } })] }).pages[0];
  it("a generic noindex in its own header is not attributed to the previous bot", () => {
    expect(isNoindex(ctx("bingbot: nofollow\nnoindex"))).toBe(true);
    expect(isNoindex(ctx("bingbot: nofollow, noindex"))).toBe(false); // same header: still bingbot-scoped
    expect(isNoindex(ctx("googlebot: noindex"))).toBe(true);
  });
});

describe("#24 soft-404 sniffing", () => {
  it("detects HTML bodies that don't start with <!doctype or <html", () => {
    expect(isHtmlSoft404("<!-- 404 -->\n<!DOCTYPE html><html><body>Not found</body></html>", "")).toBe(true);
    expect(isHtmlSoft404('<?xml version="1.0"?><!DOCTYPE html><html></html>', "")).toBe(true);
    expect(isHtmlSoft404("<head><title>x</title></head>", "")).toBe(true);
    expect(isHtmlSoft404("  <html>", "text/plain")).toBe(true);
  });
  it("keeps real text files, even with a wrong content-type", () => {
    expect(isHtmlSoft404("# Acme\n\n> We use <html lang> on every page.", "text/plain")).toBe(false);
    expect(isHtmlSoft404("User-agent: *\nDisallow:", "text/html")).toBe(false);
    expect(isHtmlSoft404('<?xml version="1.0"?><urlset></urlset>', "text/html")).toBe(false);
  });
  it("helper fixture sanity: ok text stays ok", () => {
    expect(okText("https://a.example/llms.txt", "# A").status).toBe("ok");
  });
});
