# Review R2: audit engine + backend (security and correctness, adversarially verified)

25 confirmed findings.

## 1. [high] [dos] src/lib/audit/checks/geo/answer-ready.ts:31

**Issue:** countAnswerBlocks runs `$h.parent().children().length` (line 31) and `$h.parents(...)` (line 28) for every h1–h3. That is O(headings x siblings) synchronous CPU work. The crawl budget is only enforced by abort timers, so it cannot interrupt this, and analyze() runs after the budget anyway. The event loop is blocked until Vercel kills the function at maxDuration.

**Scenario:** I measured countAnswerBlocks directly. Homepage body `"<h2>".repeat(10000)` (40 KB): 11.2 s. `"<h2>".repeat(20000)` (80 KB): 66.3 s. It grows quadratically, and a 2 MB page is limited only by the 60 s kill. Any visitor can POST /api/audit with a URL they control. Each call burns a full 60 s of function CPU and returns a 504. On Fluid compute it also stalls every other request sharing that instance.

**Fix:** In countAnswerBlocks (answer-ready.ts:24-42), before the loop add `const chrome = new Set($("nav, footer, header").find("h1, h2, h3").toArray());`. Change the loop to `$("h1, h2, h3").slice(0, 200).each((_, el) => { if (chrome.has(el)) return; const $h = $(el); const candidates = [$h.next()]; if (!$h.prev().length && !$h.next().length) candidates.push($h.parent().next()); ...rest unchanged })`. In hasListsOrTables (line 53), build `const chromeLists = new Set($("nav, header, footer").find("ul, ol").toArray());` and filter with `!chromeLists.has(el) && $(el).children("li").length >= 3`. Add a regression test asserting that countAnswerBlocks(load("<body>" + "<h2>".repeat(20000))) finishes in well under 1 s.

## 2. [high] [dos] src/lib/audit/html.ts:130

**Issue:** visibleText() clones <body> and then calls `.find("script, style, noscript, template, svg, iframe").remove()` on the detached clone. With many sibling elements this is quadratic. The recursive clone also overflows the stack on deep nesting, which makes parsePage throw. parsePage runs synchronously on every fetched page (homepage and subpages, up to 2 MB each), so the time budget cannot stop it.

**Scenario:** I timed cheerio directly. `"<html><body>" + "<p>".repeat(40000)` (120 KB): clone 127 ms, find+remove 8,530 ms. Whole parsePage: 20k p = 2.7 s, 40k = 9.3 s, 80k = 32.5 s. A 2 MB page of `<p>` (about 700k elements) ran longer than 300 s for 2 pages, and I killed it. Separately, 2,000 nested `<div>` makes visibleText throw `Maximum call stack size exceeded`. On the homepage that turns a valid site into a generic `unreachable` error.

**Fix:** Replace visibleText in /c/Users/Ayush/Downloads/SEO/src/lib/audit/html.ts:128-132 with an iterative walk that needs no clone and no selector:

const SKIP_TEXT = new Set(["script","style","noscript","template","svg","iframe"]);
export function visibleText($: CheerioAPI): string {
  const root = $("body").get(0);
  if (!root) return "";
  const out: string[] = [];
  const stack: AnyNode[] = [...root.children].reverse();
  while (stack.length) {
    const n = stack.pop()!;
    if (n.type === "text") out.push((n as Text).data);
    else if ("children" in n && !("name" in n && SKIP_TEXT.has((n as Element).name))) {
      const ch = (n as Element).children;
      for (let i = ch.length - 1; i >= 0; i--) stack.push(ch[i]);
    }
  }
  return cleanText(out.join(""));
}

Import the AnyNode/Text/Element types from "domhandler".

Optional, but recommended so later checks are also bounded: right after `load()` in parsePage, add `if ($("*").length > 50_000) throw new AuditError("too_large", ...)`. "too_large" already exists in types.ts. Add a regression test with 20k sibling `<p>` elements (it must finish in well under 1 s) and 20k nested `<div>` elements (it must not throw).

Correction to the scenario: the stack overflow starts at about 20k nesting levels, not 2,000. 1k, 2k and 5k nested divs parse fine.

## 3. [high] [dos] src/lib/audit/html.ts:172

**Issue:** Every <a href> runs `$el.parents("nav, header, [role=navigation]")`. That is O(links x DOM depth) with heavy per-step cheerio overhead, and it runs synchronously inside parsePage.

**Scenario:** I measured the links loop alone. `"<div>".repeat(4000) + '<a href="/x">x</a>'.repeat(4000)` (about 100 KB): 7.85 s. With n=8000 (about 200 KB), the whole parsePage took 57.2 s and then threw a stack overflow (see the visibleText finding). A 2 MB page fits n of about 60k, which is far beyond the 60 s maxDuration. This works on the homepage and on any subpage.

**Fix:** In C:/Users/Ayush/Downloads/SEO/src/lib/audit/html.ts, compute the nav links once before the loop and look each link up in the Set:

```ts
const baseHref = $("base[href]").first().attr("href");
const navLinks = new Set($("nav, header, [role=navigation]").find("a[href]").toArray());
const links: { href: string; inNav: boolean }[] = [];
$("a[href]").each((_, el) => {
  const href = resolveHref($(el).attr("href"), input.url, baseHref);
  if (!href) return;
  links.push({ href, inNav: navLinks.has(el) });
});
```

Do not cap the loop at 1,000 links. selectInternalLinks ranks nav links first (crawl.ts:112), so a cap could drop nav links that appear late in the page and change which subpages are crawled.

## 4. [high] [dos] src/lib/audit/checks/seo/sitemap.ts:29

**Issue:** ReDoS. The fallback regex `/<(?:\w+:)?loc>\s*(?:<!\[CDATA\[)?\s*(https?:\/\/[^<\]\s]+)/gi` has two adjacent `\s*` separated only by an optional group, so it backtracks quadratically on a long run of whitespace. The fallback runs whenever cheerio finds no http <loc>. parseSitemap runs synchronously on attacker-controlled /sitemap.xml: up to 2 MB raw or 4 MB after gunzip. It is called at crawl.ts:250, at crawl.ts:273 and again in sitemapCheck.

**Scenario:** The attacker serves /sitemap.xml as `"<urlset><loc>" + " ".repeat(N)`. The loc text trims to "", so locs is empty and the fallback runs. Measured with parseSitemap: N=40,000 takes 4.4 s. With the raw regex: 5k = 67 ms, 10k = 301 ms, 20k = 1.0 s, 40k = 6.7 s (quadratic). At the 2 MB cap that extrapolates to hours. A gzipped 4 MB file of spaces is only a few KB on the wire. The function is pinned until the 60 s kill, at a cost of one audit from the rate limit.

**Fix:** In src/lib/audit/checks/seo/sitemap.ts:29, replace the fallback regex with /<(?:\w{1,20}:)?loc>\s{0,64}(?:<!\[CDATA\[\s{0,64})?(https?:\/\/[^<\]\s]{1,2048})/gi. I verified it runs in linear time and still extracts plain, namespaced and CDATA-wrapped locs. Also, in src/lib/audit/crawl.ts (lines 250, 261, 273), keep the ParsedSitemap result from the first parseSitemap call on the chosen sitemap and reuse it for sitemapUrls instead of parsing again. That cuts the repeated cheerio parse of a 4 MB body.

## 5. [high] [engine-seo] src/lib/audit/checks/seo/indexability.ts:6

**Issue:** The meta robots check runs the regex /\b(noindex|none)\b/ over the whole content string, so a valid directive value 'none' (from max-image-preview:none) is read as the 'none' directive, which means noindex+nofollow. The page gets marked noindex. On the homepage this raises a CRITICAL issue, caps the indexability score at 0.2, and sets PageSummary.indexable=false. The X-Robots-Tag branch already handles this case; the meta branch does not.

**Scenario:** Proven with parsePage + indexabilityCheck on <meta name="robots" content="index, follow, max-image-preview:none">. Result: status fail, score 0, issues [{key:'seo.indexability:noindex', severity:'critical'}]. A fully indexable site is told Google can't index its homepage.

**Fix:** In src/lib/audit/checks/seo/indexability.ts, delete line 6 (const NOINDEX = ...). Replace line 14 with: if ((name === "robots" || name === "googlebot") && ($(el).attr("content") ?? "").toLowerCase().split(",").map((t) => t.trim()).some((t) => t === "noindex" || t === "none")) meta = true; Split on commas only, because splitting on whitespace too would turn "max-image-preview: none" into a bare "none" token. In tests/audit/checks-seo.test.ts, add a case: indexabilityCheck on a page whose head has <meta name="robots" content="index, follow, max-image-preview:none">. Expect status "pass" and no issues.

## 6. [high] [engine-seo] src/lib/audit/crawl.ts:322

**Issue:** Any internal page whose canonical resolves to the homepage is silently dropped: it gets `continue` with no note and is never passed to the checks. This was meant to dedupe /home → /. But a site-wide canonical pointing at the homepage is one of the worst real-world SEO misconfigurations (a CMS template bug that de-indexes every inner page), and here it is hidden. Every inner page is discarded, the crawl uses up all max*3 spare candidates, the report covers only the homepage, and seo.canonical passes.

**Scenario:** Site where every template outputs <link rel="canonical" href="https://acme.com/">. /about, /services, /contact etc. are all fetched and discarded at lines 323-325. pages = [home] and canonicalCheck reports '1 of 1 page has a single, absolute canonical URL'. The customer sees a pass on the exact problem that is killing their rankings.

**Fix:** In src/lib/audit/crawl.ts:322-325, treat a page as a duplicate of the homepage only when it really has the same content, and say so when skipping it.

```ts
const canonicalUrl = canonical ? resolveHref(canonical, page.url) : null;
if (canonicalUrl && pageKey(canonicalUrl) === pageKey(homeUrl)) {
  const norm = (p: PageData) => p.$("body").text().replace(/\s+/g, " ").trim();
  if (page.title === homePage.title && norm(page) === norm(homePage)) {
    notes.push(`${pathOf(url)} is a copy of your homepage, so we skipped it.`);
    continue;
  }
}
results[idx] = page; collected++;
```

In src/lib/audit/checks/seo/canonical.ts, compute `const homeKey = pageKey(ctx.finalUrl)`. For each page that is not the homepage and whose resolved canonical (`new URL(first, p.url)`) has a pageKey equal to homeKey, push p.url to a `pointsHome` array and set s = 0. Then emit `{ key: "seo.canonical:points-to-home", affectedUrls: pointsHome, share: 3 }`.

Register "seo.canonical:points-to-home" in src/lib/audit/issues.ts with high severity, a title such as "Inner pages declare the homepage as their canonical", and a fix telling the user to make each page's canonical point to itself. If the issue key is a typed union in src/lib/audit/types.ts, add it there too. That is a contract change, so coordinate it via Fable. Add a crawl/canonical test with a fixture site whose inner pages all have a home canonical.

## 7. [high] [engine-geo-score] src/lib/audit/checks/geo/schema-util.ts:82

**Issue:** Business-type detection uses a hand-picked allowlist plus a suffix regex. It misses many common schema.org LocalBusiness and Organization subtypes. It also wrongly accepts Service subtypes, which describe an offering rather than a business. Both organization-schema and entity-consistency rely on isOrgNode.

**Scenario:** Ran isOrgType through tsx. It returns false for Winery, Brewery, Motel, Resort, Hostel, Campground, IceCreamShop, FastFoodRestaurant, GasStation, AutoBodyShop, Library, Airline, SportsTeam and MusicGroup. A winery with complete markup ({"@type":"Winery","name":"X","url":"https://x.com","logo":"..."}) gets geo.organization-schema score 0 and the issue "No Organization or LocalBusiness schema was found" (weight 14, the third-largest GEO check). entity-consistency then also drops the Organization name source. In the other direction, isOrgType returns true for TaxiService, FoodService and GovernmentService because they match /service$/.

**Fix:** In src/lib/audit/checks/geo/schema-util.ts:
(1) Replace ORG_TYPES with a constant set of every schema.org Organization and LocalBusiness descendant, lowercased and generated once from schemaorg-current-https.jsonld by walking rdfs:subClassOf from schema:Organization. Put it in a generated file such as org-types.ts with a comment giving the schema.org version.
(2) In isOrgType, strip an optional "schema:" prefix or "http(s)://schema.org/" prefix before the lookup. Then use the set as the main test, and keep a narrowed suffix regex /(business|organization|store|agency|clinic|contractor)$/ only for unknown or extension types. Remove the `service` alternative; ProfessionalService, LegalService, FinancialService, AccountingService and EmergencyService come from the generated set.
(3) Optionally, in isOrgNode, also return true when the node has priceRange or openingHours/openingHoursSpecification, since these are LocalBusiness-only properties. Do NOT treat "address + telephone" as a business signal, because Person, Place and ContactPoint also carry those.
(4) Add unit tests in tests/audit: isOrgType true for Winery, Motel, Resort, Brewery, SportsTeam, Airline and EmergencyService; false for TaxiService, FoodService, GovernmentService and Service. Add an organization-schema fixture where {"@type":"Winery","name":"X","url":"https://x.com","logo":"https://x.com/l.png"} scores 1.

## 8. [medium] [ssrf] src/lib/audit/robots.ts:11

**Issue:** robots.txt rules are tied to the URL the file was finally fetched from, not the site being audited. In crawl.ts:126, textOutcome stores `url: res.finalUrl`. parseRobots then calls robotsParser(robots.url, text). robots-parser returns `undefined` from isAllowed() for any URL on a different origin, and isBlocked() treats `undefined` as allowed. So if /robots.txt redirects to another host, every Disallow rule is silently ignored. This affects both the crawler's own robots compliance and the geo.ai-crawlers and robots checks. RFC 9309 says rules fetched through a redirect apply to the original host.

**Scenario:** Audited site https://example.com serves /robots.txt as a 301 to https://cdn.example.net/robots.txt, which contains `User-agent: *\nDisallow: /`. I checked robots-parser directly: rp('https://cdn.example.net/robots.txt', 'User-agent: *\nDisallow: /').isAllowed('https://example.com/about','noticrbot') returns undefined. Result: the crawler fetches disallowed pages, and the report tells the user GPTBot, OAI-SearchBot and the others are allowed when the site blocks them all.

**Fix:** In src/lib/audit/crawl.ts, after the robots soft-404 block (line 243-246) and before `const robotsParsed = parseRobots(robots);` (line 248), add: `if (robots.status === "ok") robots.url = `${origin}/robots.txt`;`. Per RFC 9309, rules fetched through a redirect apply to the original authority. Do not change textOutcome globally, because sitemap and llms rely on finalUrl. Add a test in tests/audit: parseRobots({status:'ok', url:'https://example.com/robots.txt', statusCode:200, text:'User-agent: *\nDisallow: /'}) with isBlocked(..., 'https://example.com/about', 'GPTBot') === true. Also add a crawl-level test where /robots.txt 301s to another host serving Disallow: / and assert that the ai-crawlers and robots-txt checks report blocked.

## 9. [medium] [api-auth] src/lib/security/rate-limit.ts:102

**Issue:** Without DATABASE_URL (the current deployment state), the IP limits of 5/h on /api/audit, 10/h on unlock and 5/h on contact are kept in a per-process Map. Vercel serverless spreads traffic over many instances and resets them on cold start, so the limit is per instance rather than per IP. The same fallback runs on every Postgres error (line 127).

**Scenario:** An attacker sends 50 concurrent POST /api/audit requests from one IP. Vercel scales to several instances, each with an empty Map, so far more than 5 audits run in that hour. Each one makes the server crawl an arbitrary site and call PageSpeed (spending the PAGESPEED_API_KEY quota). The platform becomes a fetch amplifier, and the contact form can be spammed the same way, with every submission going to notifyTeam.

**Fix:** Do not fail closed without a database, because that disables /api/audit in the current deployment. Instead:
(1) As a backstop now, add a Vercel Firewall rate-limit rule, keyed on IP: POST /api/audit 5 per hour, POST /api/audit/unlock 10 per hour, and Server Action POSTs to the contact page (requests with the `Next-Action` header on the contact route path) 5 per hour. This works whatever the instance topology is.
(2) In code, add a shared store as the second tier: an Upstash Redis / Vercel KV INCR+EXPIRE fixed window, used when its env vars are set. Keep the memory Map as the last fallback only. Log one console.error at startup when isProduction() is true and the request is answered by the memory store, so the gap shows up in logs.
(3) Update ADR-006 in docs/DECISIONS.md: the in-memory limiter is per-instance and best-effort only. Production needs DATABASE_URL, a KV store or a WAF rule. List this as a launch known issue in STATUS.md next to the existing no-DB note.
No existing tests change: tests for the memory fallback still pass because the memory path is unchanged.

## 10. [medium] [api-auth] src/lib/db/index.ts:34

**Issue:** The hard-coded ssl: "require" option takes precedence over the URL's sslmode (postgres.js src/index.js:521 prefers explicit options), and postgres.js maps 'require' to { rejectUnauthorized: false } (src/socket.js:20-21). The DB server certificate is therefore never verified, even when the operator's DATABASE_URL says sslmode=verify-full.

**Scenario:** DATABASE_URL=postgres://u:p@db.example.neon.tech/app?sslmode=verify-full. getDb() passes ssl:'require', so TLS accepts any certificate. An on-path attacker between the Vercel function and the DB can present a self-signed certificate and read or modify every lead email, contact message and rate-limit row. channel_binding defaults to 'prefer', so the attacker can downgrade it.

**Fix:** In src/lib/db/index.ts:34, stop overriding TLS settings that come from the URL, and default to full verification. Replace the ssl line with this:

  const params = new URL(url).searchParams;
  const urlSetsTls = params.has("sslmode") || params.has("ssl") || params.has("sslrootcert");
  ...
  ssl: isLocalHost(url) ? false : urlSetsTls ? undefined : "verify-full",

If ssl is undefined, postgres.js uses the URL's sslmode/sslrootcert. That means `sslrootcert=system`, `sslmode=verify-full`, or `sslrootcert=/path/supabase-ca.crt` all get verified. Without any TLS parameters, Node's default CA check applies.

In .env.example, document DATABASE_URL with `?sslmode=verify-full` (Neon) or `?sslmode=verify-full&sslrootcert=<path to Supabase CA>` (Supabase). Also note that Neon's copy-paste string uses `sslmode=require`, which does not verify the certificate. Do not hard-code 'verify-full' for every host: Supabase certificates chain to Supabase's private root CA, so a hard-coded value would break connections to Supabase.

## 11. [medium] [db] scripts/migrate.ts:70

**Issue:** The migration lock is a session-level pg_advisory_lock/pg_advisory_unlock taken outside any transaction. The app has only one DATABASE_URL, and src/lib/db/index.ts:33 says it is expected to be a transaction-mode pooler (Neon -pooler host, Supabase 6543). On a transaction pooler, every statement outside a transaction can run on a different backend. The lock is taken on backend A, and the unlock in the finally block (line 108) runs on backend B. It returns false, and the WARNING is hidden by onnotice:false. The lock stays held on A, which remains in the pooler's server pool. The lock therefore neither gives mutual exclusion nor gets released.

**Scenario:** Run `npm run db:migrate` against the Neon/Supabase pooled URL, then run it again (for example, the next deploy, or a CI retry). The second run's `select pg_advisory_lock(7311420501)` lands on a different backend and blocks with no timeout until the pooler closes backend A (PgBouncer server_idle_timeout is 600 s by default, and it stays open longer if app traffic keeps reusing A). The migration hangs. Also, two concurrent runners are not actually serialized.

**Fix:** In scripts/migrate.ts, delete the session lock at line 67 and the unlock in the finally block at lines 110-114. Make every step that touches the schema a transaction that first takes a transaction-scoped lock:

const lock = (tx) => tx`select pg_advisory_xact_lock(${LOCK_KEY}::bigint)`;

Bootstrap:
await sql.begin(async (tx) => { await tx`set local lock_timeout = '60s'`; await lock(tx); await tx`create table if not exists schema_migrations (...)`; await tx`alter table schema_migrations enable row level security`; });

Per file:
const applied = await sql.begin(async (tx) => { await tx`set local lock_timeout = '60s'`; await lock(tx); const done = await tx`select 1 from schema_migrations where name = ${file}`; if (done.length) return false; await tx.unsafe(content); await tx`insert into schema_migrations (name, checksum) values (${file}, ${sum})`; return true; });

Count a file as applied only when that call returns true. Keep the checksum-mismatch warning, using the earlier select. Optionally, also read `process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL` for migrations, and document in .env.example and README.md that migrations should use the direct (non-pooled) URL.

## 12. [medium] [engine-seo] src/lib/audit/checks/seo/robots-txt.ts:26

**Issue:** blocksAll checks only the '*' group, and a hit fails the check (score 0, issue 'robots.txt blocks search engines from your whole site', whose copy says 'Google can't read your pages'). This fires even when robots.txt explicitly allows Googlebot and Bingbot in their own groups, which is a common, deliberate allow-list setup.

**Scenario:** Proven: robots.txt 'User-agent: Googlebot\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: *\nDisallow: /'. robotsTxtCheck returns status fail, score 0, summary 'robots.txt blocks all crawlers from your homepage.' and issue seo.robots-txt:blocks-all (high), even though Google and Bing can crawl everything.

**Fix:** In robots-txt.ts, replace line 26 with `const blocksBing = isBlocked(robots, home, "Bingbot");`. Change the condition to `if (blocksGoogle || blocksBing)`, set the summary to "robots.txt blocks Google…" when `blocksGoogle` is true and "robots.txt blocks Bing…" otherwise, and set the severity to critical when `blocksGoogle` is true and high otherwise. Optionally, before the pass return, add `if (isBlocked(robots, home, "*")) return outcome(def, { score: 0.8, status: "warn", summary: "robots.txt only lets listed crawlers in; Google and Bing are allowed.", issues: [{ key: "seo.robots-txt:blocks-unlisted" }] })`. That needs a new low-severity entry in issues.ts. Then add a test using the Googlebot/Bingbot allow-list robots.txt that expects anything other than fail.

## 13. [medium] [engine-seo] src/lib/audit/html.ts:54

**Issue:** metaContent derives one key per tag as name ?? property ?? itemprop, which causes two bugs. (a) itemprop is treated like name, so microdata <meta itemprop="description"> (the legacy Google+ snippet tags often placed in <head> before the real description, and product microdata in <body>) is taken as the page's meta description. (b) When a tag has both name and property, property is never checked, so <meta name="description" property="og:description" content="..."> (a byte-saving pattern some themes use) is not counted as og:description.

**Scenario:** Proven: parsePage('<div itemscope><meta itemprop="description" content="Red shoe"></div>').metaDescription === 'Red shoe', so a page with NO meta description passes 'missing' and gets length-checked on the wrong string. metaContent($, 'og:description') on '<meta name="description" property="og:description" content="x">' returns null, so open-graph reports og:description missing when it is present.

**Fix:** In src/lib/audit/html.ts metaContent, replace line 54 and the following comparison with a check against each attribute on its own, and drop itemprop:

const keys = [$el.attr("name"), $el.attr("property")].map((v) => (v ?? "").toLowerCase().trim());
if (keys.includes(lower)) { const c = $el.attr("content"); if (c !== undefined) found = cleanText(c); }

No caller needs itemprop. author.ts and dates.ts already query [itemprop=...] directly.

## 14. [medium] [engine-geo-score] src/lib/audit/html.ts:45

**Issue:** countWords only splits on whitespace, and sentenceCount (answer-ready.ts:12) only recognises ASCII . ! ?. Chinese, Japanese and Thai text has no spaces and uses 。！？, so a whole paragraph or page counts as about one word. This makes answer-ready fail for these sites and puts a wrong wordCount in PageSummary.

**Scenario:** Japanese paragraph "東京で歯科医院を選ぶときは、…夜八時まで診療しています。" (two sentences, about 70 characters) under <h2>料金はいくらですか</h2>. Through tsx: countWords returns 1, isAnswerParagraph returns false and countAnswerBlocks returns 0. parsePage reports wordCount 1 for the whole page. Any CJK site therefore gets geo.answer-ready:no-answer-blocks (medium) and loses half of that check's weight, and the full report shows wordCount 1 for every page.

**Fix:** In src/lib/audit/html.ts, keep whitespace splitting for scripts that use spaces, and use Intl.Segmenter only on tokens that contain CJK or Thai characters:
```ts
const NO_SPACE_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
const WORD_SEG = new Intl.Segmenter(undefined, { granularity: "word" });
export function countWords(s: string): number {
  const t = cleanText(s);
  if (!t) return 0;
  let n = 0;
  for (const w of t.split(" ")) {
    if (!/[\p{L}\p{N}]/u.test(w)) continue;
    if (NO_SPACE_SCRIPT.test(w)) { for (const seg of WORD_SEG.segment(w)) if (seg.isWordLike) n++; }
    else n++;
  }
  return n;
}
```
In src/lib/audit/checks/geo/answer-ready.ts:13, use `text.match(/[.!?](\s|$)|[。！？]/g)`. Add a test to tests/audit/checks-geo.test.ts asserting that the Japanese two-sentence paragraph above gives isAnswerParagraph === true. Also assert that the existing English answer paragraph's word count does not change.

## 15. [medium] [engine-geo-score] src/lib/audit/checks/geo/ai-crawlers.ts:29

**Issue:** Bot access is checked only against the homepage URL `${origin}/`. A robots.txt that blocks a bot everywhere except the homepage, or blocks whole content sections, is reported as "all allowed".

**Scenario:** Ran robots-parser 3.1.1 directly. With robots.txt "User-agent: GPTBot\nDisallow: /\nAllow: /$", isAllowed('https://ex.com/','GPTBot') returns true, so GPTBot is reported as allowed even though every page except / is blocked. Similarly, "User-agent: OAI-SearchBot\nDisallow: /blog/" blocks all blog content from ChatGPT search, yet the check passes with score 1 and says "All 10 major AI crawlers are allowed".

**Fix:** In src/lib/audit/checks/geo/ai-crawlers.ts:
1. Replace line 28-29 with: `const urls = [...new Set([`${ctx.origin}/`, ...ctx.pages.map((p) => p.url)])];` then for each bot compute `const disallowed = urls.filter((u) => isBlocked(robots, u, b.name));`. A bot counts as fully blocked, and goes into `blocked` as it does today, when the homepage is disallowed or when disallowed.length * 2 >= urls.length. A bot counts as partially blocked when 0 < disallowed.length and it is not fully blocked.
2. If any bots are partially blocked, push `{ key: "geo.ai-crawlers:partially-blocked", affectedUrls: <union of their disallowed urls>, detail: "Some pages are blocked for: <name (product)>, ...", severity: <"high" if any are search bots, otherwise leave the default>, share: 1 }`. Then reduce the score in proportion, e.g. lost += WEIGHT[kind] * disallowed.length / urls.length for each partially blocked bot. Change the summary so it no longer says "all allowed" when there are partial blocks.
3. Add a catalog entry for "geo.ai-crawlers:partially-blocked" with checkId "geo.ai-crawlers" in src/lib/audit/issues.ts next to lines 340-352, and add the key to the IssueKey union if it is listed explicitly. Without this, the change fails typecheck.
4. Add tests in tests/audit/checks-geo.test.ts:
- (a) robots "User-agent: GPTBot\nDisallow: /\nAllow: /$" with pages [home, /about] gives training-blocked.
- (b) robots "User-agent: OAI-SearchBot\nDisallow: /blog/" with pages [home, /blog/post] gives partially-blocked, with affectedUrls containing the /blog/post URL and status not "pass".
- (c) The existing pass and fully-blocked cases stay unchanged.

## 16. [low] [ssrf] src/lib/audit/net/ssrf.ts:37

**Issue:** The DNS timeout is only a Promise.race around dns.lookup(), which calls getaddrinfo on libuv's shared 4-thread pool. When the race 'times out', the blocked getaddrinfo keeps holding its thread until the system resolver gives up (glibc default is about 5s x 2 attempts per nameserver). An attacker-controlled hostname whose authoritative nameserver drops queries can therefore fill the pool. The async zlib streams in fetch.ts readBody use the same pool, so gzip/brotli decompression stalls for every other audit on that instance.

**Scenario:** An attacker controls ns.evil.example, which drops all queries. They POST /api/audit 4-5 times concurrently with a.evil.example, b.evil.example, and so on (the limit is 5 per IP per hour, so one IP is enough). Each call ties up a threadpool thread for about 10s+, even though each audit returns 'timeout' after 5s. Meanwhile, legitimate audits on the same Fluid-compute instance queue behind them. Their dns.lookup calls hit the 5s race and fail with 'Looking up X took too long', and their gzip bodies stall until the 8s request timeout. Repeating this keeps the instance degraded.

**Fix:** In src/lib/audit/net/ssrf.ts, keep the IP-literal path, then add a check before any lookup: if host is 'localhost', ends with '.localhost', or ends with '.localhost.' (case-insensitive), throw AuditError('blocked_host', ...). This follows RFC 6761 and keeps tests/audit/ssrf.test.ts:17 passing. Then replace the dns.lookup race with a per-call `const resolver = new dns.Resolver({ timeout: 2000, tries: 2 })` (from node:dns promises) and run `const [a, aaaa] = await Promise.allSettled([resolver.resolve4(host), resolver.resolve6(host)])`. Inside the existing abort/timeout race, have onAbort and the timer call resolver.cancel() before rejecting. Build records from the fulfilled results (family 4 for resolve4, family 6 for resolve6). If both are rejected, throw 'unreachable', or 'timeout' if either one rejected with ETIMEOUT or ECANCELLED. Keep the existing check that every address is public and the IPv4-preferred pinning unchanged. Add a test that 'foo.localhost' returns 'blocked_host'.

## 17. [low] [dos] src/lib/audit/html.ts:455

**Issue:** In parsePage's return, the title, metaDescription and heading texts (headings: line 438) come from the audited page with no length cap, and they are copied into the AuditResult page summaries (analyze.ts:48-49). The result is returned in the partial report, stored as jsonb by insertAudit, and sealed. Unlock rejects anything over MAX_SEALED_CHARS = 400,000 and bodies over 512 KB.

**Scenario:** A site whose `<title>` is 1.5 MB of random text (under the 2 MB cap). The /api/audit response and the stored `audits.result` row each grow by megabytes per page, which bloats the DB at 5 audits/hour/IP. The sealed token is over 400k chars, so POST /api/audit/unlock always fails with 413/`invalid_or_expired`, and the user can never unlock their report.

**Fix:** Truncate in src/lib/audit/analyze.ts:48-49 when building PageSummary, so checks still see the full values: `title: p.title === null ? null : p.title.slice(0, 300),` and `metaDescription: p.metaDescription === null ? null : p.metaDescription.slice(0, 500),`. Optionally also cap the url field the same way (e.g. 2,048 chars). Do not truncate in parsePage, because the duplicate-title/description checks compare the full strings. Headings don't need a cap for this bug, since they are not in AuditResult.

## 18. [low] [dos] src/lib/audit/checks/seo/canonical.ts:23

**Issue:** `/<([^>]+)>\s*;\s*rel="?canonical"?/i` is O(n^2) on a Link header that contains many '<' and no '>'. Each start position scans to the end. It runs once per crawled page.

**Scenario:** The attacker's pages send `Link: ` followed by 16,000 '<' characters, close to Node's 16 KB response-header limit. Measured: 834 ms per exec, so about 5 s of blocked event loop across 6 pages. It stacks on top of the findings above.

**Fix:** In src/lib/audit/checks/seo/canonical.ts:23, change the regex to `/<([^<>]{1,2048})>\s*;\s*rel="?canonical"?/i.exec(linkHeader)?.[1]`.

## 19. [low] [api-auth] next.config.ts:13

**Issue:** The static CSP applies to every Vercel deployment, including preview builds, but it does not allow the Vercel Toolbar / Comments that Vercel injects there (a script from https://vercel.live, plus frames and websocket connections to vercel.live / *.pusher.com). On preview deployments the toolbar is blocked and the console fills with CSP violation errors. Lighthouse Best Practices ('no browser errors logged to the console') fails on preview URLs, which is where QA will measure.

**Scenario:** Open any preview deployment. The console shows "Refused to load the script 'https://vercel.live/_next-live/feedback/feedback.js' because it violates ... script-src", comments and the toolbar don't work, and the Best Practices score falls below 95.

**Fix:** In next.config.ts add `const isVercelPreview = process.env.VERCEL_ENV === "preview";` and `const live = isVercelPreview ? " https://vercel.live" : "";`. Then append to these directives only when isVercelPreview is true: script-src += " https://vercel.live"; style-src += " https://vercel.live"; img-src += " https://vercel.live https://vercel.com"; font-src += " https://vercel.live https://assets.vercel.com"; connect-src += " https://vercel.live wss://ws-us3.pusher.com"; and add the directive "frame-src https://vercel.live" (on preview only). Leave the production policy byte-for-byte the same. Alternative: turn off the Vercel Toolbar for Preview in the project settings (or set the VERCEL_PREVIEW_FEEDBACK_ENABLED=0 env var) and keep the CSP unchanged.

## 20. [low] [db] src/lib/db/index.ts:36

**Issue:** The DB client timeouts (connect_timeout 10 s, query_timeout 10 s) are too long for the public routes' maxDuration. The unlock route has maxDuration = 15 (src/app/api/audit/unlock/route.ts:12) and makes two sequential DB calls before it responds: rateLimit, which falls back to memory only after the DB call fails, and then insertLead. The audit route has maxDuration = 60 (src/app/api/audit/route.ts:15), but runAudit starts its own 55 s budget only after rateLimit returns, and insertAudit runs after that. That means data is lost exactly in the case the 'best effort, the notification still carries the lead' design is meant to cover.

**Scenario:** DATABASE_URL points to a host that is unreachable or blackholed (provider outage, wrong host, network partition). POST /api/audit/unlock: rateLimit waits 10 s for connect_timeout, then insertLead waits another 10 s, so the total is about 20 s, which is over the 15 s limit. Vercel kills the function before jsonOk() returns and before the after(() => notifyTeam(...)) callback is registered. The user gets a 504, does not get the report, and the lead is neither stored nor emailed, so it is lost completely. On /api/audit the sequence is 10 s rateLimit + 55 s audit on a slow site + insertAudit, which is more than 60 s, so the user gets a 504 for a completed audit.

**Fix:** In src/app/api/audit/route.ts, add `const t0 = Date.now();` as the first line of POST. Change line 81 to `result = await runAudit(normalized, { signal: request.signal, budgetMs: 50_000 - (Date.now() - t0) });`. runAudit already clamps this to at least 5 s. This counts the rateLimit time against the 60 s maxDuration and leaves headroom for insertAudit and seal. Optionally, in src/lib/db/index.ts:37, lower `query_timeout` to 5 so that a slow but reachable DB cannot spend more than 5 s on insertAudit. Do not change the unlock route; it already finishes in about 10 s in the outage case.

## 21. [low] [db] src/lib/db/index.ts:34

**Issue:** `ssl: isLocalHost(url) ? false : "require"` is an explicit option, so postgres.js ignores any `sslmode` in the URL. In postgres.js, 'require' means TLS with rejectUnauthorized:false, so the server certificate is never verified, even when the operator puts `?sslmode=verify-full` in DATABASE_URL. In the other direction, a non-localhost host without TLS (docker-compose `db`, `postgres`, `host.docker.internal`) is forced to TLS. I confirmed this with a probe: postgres('postgres://u:p@ep.neon.tech/x?sslmode=verify-full', {ssl:'require'}).options.ssl === 'require', and postgres('postgres://u:p@db:5432/x?sslmode=disable', {ssl:'require'}).options.ssl === 'require'. The same pattern is in scripts/migrate.ts:64.

**Scenario:** (a) The operator sets DATABASE_URL=...neon.tech/db?sslmode=verify-full. The connection is still unauthenticated TLS, so a network MITM can present any certificate and read or alter audit, lead and contact data (channel_binding defaults to 'prefer', so the attacker can downgrade it). (b) The operator uses DATABASE_URL=postgres://u:p@db:5432/app?sslmode=disable with docker-compose. Every query fails with 'server does not support SSL', getDb errors, and leads/contacts are not stored. The routes swallow the error, so this shows up only in logs.

**Fix:** In src/lib/db/index.ts (line 31-39) and scripts/migrate.ts (line 61-67), add a helper `function urlSetsSsl(u: string): boolean { try { const p = new URL(u).searchParams; return p.has('sslmode') || p.has('sslrootcert'); } catch { return false; } }`. Then change the ssl line to `...(urlSetsSsl(url) ? {} : { ssl: isLocalHost(url) ? false : ('require' as const) }),`. Without the explicit option, postgres.js uses the URL's sslmode: verify-full turns on Node certificate verification, and disable turns TLS off. In .env.example, document that hosted Postgres (Neon or Supabase) should use `?sslmode=verify-full`.

## 22. [low] [engine-seo] src/lib/audit/checks/seo/canonical.ts:16

**Issue:** Canonicals are deduped by raw href string, not by resolved URL. One canonical declared both in an HTTP Link header and in <link rel=canonical> (or written as '/' in one place and absolute in the other, or with and without a trailing slash) is reported as 'multiple canonical tags' and costs 0.5 of the page score.

**Scenario:** Proven: HTML <link rel="canonical" href="https://acme.com/"> plus header Link: <https://acme.com>; rel="canonical" gives issues [seo.canonical:multiple]. HTML href="/" plus header <https://acme.com/> gives [multiple, relative]. Both declarations point at the same URL, so Google sees no conflict.

**Fix:** In src/lib/audit/checks/seo/canonical.ts, collect raw hrefs in order and dedupe on the resolved URL. Then use the first raw href for the absolute/relative test:

const raws: string[] = [];
$('link[rel~="canonical" i][href]').each((_, el) => { const h = ($(el).attr("href") ?? "").trim(); if (h) raws.push(h); });
const headerCanon = /<([^>]+)>\s*;\s*rel="?canonical"?/i.exec(linkHeader)?.[1]?.trim();
if (headerCanon) raws.push(headerCanon);
const hrefs = new Set<string>();
for (const h of raws) { try { hrefs.add(new URL(h, p.url).href); } catch { hrefs.add(h); } }
if (hrefs.size === 0) { missing.push(p.url); continue; }
...
const first = raws[0];   // keep the existing /^https?:\/\// relative test and the new URL(first, p.url) try/catch unchanged

Strings that fail to parse fall back to the raw string and stay distinct, and they still hit the existing catch, which flags them as relative.

## 23. [low] [engine-seo] src/lib/audit/checks/seo/indexability.ts:22

**Issue:** The X-Robots-Tag parser keeps the last bot scope for every later comma-separated token. Repeated headers are joined with ', ' (fetch.ts flattenHeaders), so a generic 'noindex' sent in its own header after a bot-scoped header is attributed to that bot and missed: a false negative on a real noindex.

**Scenario:** Response with two headers, 'X-Robots-Tag: bingbot: nofollow' and 'X-Robots-Tag: noindex', is flattened to 'bingbot: nofollow, noindex'. Proven: isNoindex(...) === false, so a page that Google will drop is reported as indexable.

**Fix:** In src/lib/audit/net/fetch.ts flattenHeaders, after building `out`, add: `const xr = res.headersDistinct?.["x-robots-tag"]; if (xr?.length) out["x-robots-tag"] = xr.join("\n");` (headersDistinct is in Node 18.3+ and returns one array entry per header line). In src/lib/audit/checks/seo/indexability.ts isNoindex, replace the single loop with `for (const line of header.split("\n")) { let scope: string | null = null; for (const raw of line.split(",")) { ...existing token logic... } }`, so scope resets for each header line. Header strings without "\n" (for example test fixtures) behave exactly as before.

## 24. [low] [engine-geo-score] src/lib/audit/crawl.ts:124

**Issue:** HTML soft-404 detection for robots.txt, llms.txt and sitemap only checks whether the body starts with `<!doctype html` or `<html`. It ignores Content-Type, and llms.txt has no second check like looksLikeRobotsTxt. Any HTML 404 page served with status 200 that starts with something else is treated as a real llms.txt.

**Scenario:** GET /llms.txt returns 200, Content-Type text/html, body "<!-- 404 -->\n<!DOCTYPE html><html>…Not found…". The regex test returns false (verified with node), so status is "ok". isValidLlmsTxt then fails, and llmsTxtCheck reports "/llms.txt exists but doesn't start with a `# Title` line" (score 0.5, geo.llms-txt:invalid-format). The user is told to fix a file they never created. The same happens for bodies starting with `<?xml …?><!DOCTYPE html` or `<head>`.

**Fix:** In src/lib/audit/crawl.ts:124, sniff only the body, without a content-type check. Use the same test as looksLikeHtml in fetch.ts:70: `const looksHtml = /<(!doctype\s+html|html[\s>]|head[\s>]|body[\s>])/i.test(res.text.slice(0, 2048));` (or export looksLikeHtml from net/fetch.ts and call it). Do not mark a file "missing" just because its Content-Type is text/html: real robots.txt, llms.txt and sitemap files served with a wrong content-type must still parse. Keep the gzip branch in getSitemap ahead of textOutcome. Add a test fixture: a 200 response at /llms.txt whose body is "<!-- 404 -->\n<!DOCTYPE html><html><body>Not found</body></html>". It should produce llms.status === "missing" and the geo.llms-txt:missing issue.

## 25. [low] [engine-geo-score] src/lib/audit/robots.ts:11

**Issue:** parseRobots builds the parser with robots.url, which textOutcome sets to res.finalUrl (the URL after redirects). robots-parser returns undefined, not false, for URLs whose origin differs from the parser URL, and isBlocked treats undefined as allowed. If robots.txt redirects to another host, every rule is ignored. That covers the AI-bot rules and the noticrbot skip used during crawling.

**Scenario:** Homepage final URL is https://ex.com/ and /robots.txt redirects 301 to https://www.ex.com/robots.txt, which contains "User-agent: *\nDisallow: /". Verified that rp('https://www.ex.com/robots.txt', txt).isAllowed('https://ex.com/','GPTBot') returns undefined, so all 10 AI bots are reported as allowed. Per RFC 9309 and Google's documentation, redirected robots.txt rules apply to the original host.

**Fix:** Leave FetchedText.url as it is (it still means the final URL). Build the parser with the URL that was requested. Two ways to do that. (1) Add an optional `requestedUrl?: string` to FetchedText in src/lib/audit/context.ts and set `requestedUrl: url` in every return of textOutcome (crawl.ts:120-129). Then in robots.ts:11 use `robotsParser(robots.requestedUrl ?? robots.url, robots.text)`. (2) The smaller option: change the signature to `parseRobots(robots: FetchedText, origin?: string)` and call `robotsParser(origin ? `${origin}/robots.txt` : robots.url, robots.text)`. Then pass `origin` at crawl.ts:248 and `new URL(ctx.finalUrl).origin` in checks/seo/robots-txt.ts:23 and checks/geo/ai-crawlers.ts:27. Either way the Sitemap: lines still resolve correctly because they are absolute URLs. Add a test where the robots.txt fetch redirects to another host with `Disallow: /`, and assert that isBlocked returns true for the homepage.

