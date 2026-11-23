# T002 — Audit engine v1 (SEO + deterministic GEO)
**Agent:** audit-engine · **Priority:** 2 · **Depends on:** `src/lib/audit/types.ts` (contract, read-only)

## Goal
`runAudit(url)` crawls the homepage + up to 5 internal pages within a 55 s budget, safely, and returns a contract-exact `AuditResult`.

## Files
`src/lib/audit/index.ts` (exports `runAudit`, `toPartialReport`, `normalizeAuditUrl`, re-exports types), `src/lib/audit/net/` (ssrf.ts, fetch.ts), `src/lib/audit/crawl.ts`, `src/lib/audit/checks/seo/*.ts`, `src/lib/audit/checks/geo/*.ts`, `src/lib/audit/checks/performance.ts` (PSI), `src/lib/audit/score.ts`, `src/lib/audit/issues.ts` (issue copy catalog), `tests/audit/**`.
Deps (pin exact): `cheerio`, `robots-parser`, `ipaddr.js`. Use Node `undici` (bundled `fetch` via `undici` Agent with custom `connect.lookup`) or `node:http(s)` with a custom `lookup` — whichever reliably pins the validated IP while keeping SNI/Host correct. Must run on the Node runtime (not edge).

## Requirements
**Input:** `normalizeAuditUrl` accepts "example.com", "https://example.com/path", trims, adds https, lowercases host, strips hash, rejects: non-http(s) schemes, credentials in URL, ports other than 80/443, IP literals in private ranges, hostnames `localhost`, `*.local`, `*.internal`, single-label hosts, length > 2048.
**SSRF:** see agent brief. Resolve with `dns.promises.lookup(host, {all:true})`; reject if ANY address is non-public (ipaddr.js `range()` must be `unicast`, plus explicit checks for IPv4-mapped IPv6). Pin connection to the validated address. Redirects: manual, max 3, re-normalize + re-validate each hop; cross-host redirect on the homepage is allowed (www ↔ apex) and the final host becomes the crawl host.
**Limits:** per-request 8 s timeout; HTML body cap 2 MB (abort stream); robots/sitemap/llms cap 512 KB; User-Agent `Mozilla/5.0 (compatible; noticrbot/1.0; +https://noticr.com/bot)` (base URL from `NEXT_PUBLIC_SITE_URL` if set). Concurrency 3 for internal pages.
**Crawl:** fetch homepage → fetch `/robots.txt`, `/sitemap.xml` (or sitemap from robots), `/llms.txt` in parallel → choose up to 5 internal links (same registrable host, http(s), not assets/mailto/tel, dedupe, prefer nav/shallow paths, skip robots-disallowed for noticrbot) → fetch pages. Kick off PSI (mobile) in parallel at start with its own 30 s cap; if it fails/timeouts, CWV check = `unavailable` and `performance` score null.
PSI: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=…&strategy=mobile&category=performance` + `&key=` if `PAGESPEED_API_KEY`.

**SEO checks (category "seo"):** title (present, unique across pages, 30–60 chars), meta description (present, 70–160, unique), headings (exactly one H1, no skipped levels), canonical (present, absolute, self or same-host), indexability (no noindex meta/X-Robots-Tag, 200 status), robots.txt (exists, not blocking all), sitemap (exists, parseable, has URLs), image alt (% of `<img>` with non-empty alt or role=presentation), structured data (JSON-LD present + parses as JSON + has @type), Open Graph (og:title, og:description, og:image), HTTPS (final URL https + http→https redirect if checkable cheaply), viewport meta (width=device-width), lang attribute on html.
**GEO checks (category "geo"):** AI crawler access (robots.txt rules for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, Bytespider — report which are blocked; blocking the search/retrieval bots is worse than training bots), llms.txt present (+ basic format: starts with `# `), Organization/LocalBusiness schema (name, url, logo/sameAs), FAQ signals (FAQPage schema OR ≥3 question-style headings), author signals (author meta/schema Person/byline rel=author), date signals (datePublished/dateModified in schema, `<time datetime>`, or article:modified_time), answer-ready content (definition-style first paragraphs: a heading followed by a 1–3 sentence paragraph of 20–60 words; summary/TL;DR; lists/tables present), entity consistency (site name consistent across title/og:site_name/Organization name).
**Performance (category "performance"):** single check from PSI: score + LCP/CLS/TBT/INP; status pass ≥ 90, warn 50–89, fail < 50.

**Scoring:** per ARCHITECTURE.md. Integers 0–100. Weights: put them in one table in `score.ts` with comments. Issues: each non-pass check produces 1+ issues from `issues.ts` catalog (title, description, howToFix with concrete snippet where useful, effort, severity). `impact` = estimated overall points recoverable. Sort severity desc then impact desc.
**toPartialReport:** top 3 issues full, rest as teaser `{id,title,severity,category}`, issueCounts, checks without summaries/scores.

## Acceptance criteria
- Vitest tests (add `vitest` dev dep pinned if not present — qa-security is adding config; if `vitest.config.ts` is absent, create a minimal one) covering: IP classifier (all ranges in qa brief incl. `::ffff:127.0.0.1`, `0.0.0.0`, `100.64.0.1`, `169.254.169.254`, `fc00::1`, `fe80::1`), normalizeAuditUrl cases, each check against small HTML fixtures, scoring math, partial report shape.
- A manual script `scripts/audit-cli.ts` (run with `npx tsx scripts/audit-cli.ts https://example.com`) prints the summary — run it against 2 real public sites and paste the output summary in your report. (tsx is fine via npx, no dep needed.)
- `npm run typecheck && npm run lint` pass for your files. No `any`.
- Total runtime on a normal site < 30 s typical, never > 58 s.
