# Architecture — seenhq v1

## Stack
Next.js 16.4 (App Router, RSC, route handlers, server actions) · TypeScript strict · Tailwind CSS v4 · `motion` · Zod · `postgres` (any Postgres; Neon recommended) · `cheerio`, `robots-parser`, `ipaddr.js` for the audit engine · Vercel (+ Analytics, Speed Insights).

## Route map
| Route | Type | Owner |
|---|---|---|
| `/` | static page | frontend-designer |
| `/audit` | page (client island for the audit flow), accepts `?url=` | frontend-designer |
| `/services`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms` | static pages | frontend-designer (+ copy from content-seo) |
| `/admin` | dynamic page, HTTP Basic auth via `src/proxy.ts`/middleware | architect-backend |
| `/design-preview` | design system showcase, `noindex` | frontend-designer |
| `POST /api/audit` | route handler, `maxDuration=60`, node runtime | architect-backend (calls audit-engine) |
| `POST /api/audit/unlock` | route handler | architect-backend |
| contact form | server action `src/app/actions/contact.ts` | architect-backend |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt`, OG images | metadata routes | content-seo |
| `not-found` | page | frontend-designer |

## Folder ownership
```
src/app/(marketing)/**        frontend-designer (pages), content-seo (metadata exports via src/lib/seo)
src/app/admin/**              architect-backend
src/app/api/**                architect-backend
src/app/actions/**            architect-backend
src/components/**             frontend-designer
src/content/**                content-seo   (shapes in src/content/types.ts — Fable)
src/lib/audit/**              audit-engine  (contract src/lib/audit/types.ts — Fable)
src/lib/db/**, db/migrations  architect-backend
src/lib/security/**           architect-backend
src/lib/seo/**                content-seo
src/lib/mailer/**             architect-backend
public/images/**              frontend-designer (sources logged in docs/ASSETS.md)
tests/**                      qa-security (each agent may add tests for its own module)
```

## Audit flow
1. `/audit` form → `POST /api/audit {url}`.
2. Handler: Zod-validate, normalize URL, rate-limit (5/h/IP), `runAudit(url)` with a 55 s budget.
3. Crawl (`crawl.ts`): SSRF-safe fetch of homepage → robots.txt, sitemap, llms.txt, http→https probe → pick up to 5 internal links (same host, HTML, allowed for seenhqbot) → parse pages. PageSpeed runs in parallel (30 s cap).
4. After the crawl, three things run in parallel inside the remaining budget (`run.ts`):
   - **Deterministic checks** (`runChecks`): every SEO/GEO check over the crawled pages (pure, no IO).
   - **Live probes** (network, through `safeFetch`, audited host only): the AI-crawler probe (`net/probe.ts`, ADR-017: labelled simulated UAs for 6 AI bots, HEAD first with GET only when refused/unsupported, concurrency 2, 429 = not tested, 15-min per-host cache per instance, ≤ 42 requests, ≤ 6 s, skipped under 3 s usable) and the soft-404 probe (`net/soft404.ts`, one made-up URL, ≤ 4 s).
   - **AI phase** (`ai/`, ADR-015, only with `NVIDIA_API_KEY`): two parallel chat calls (analysis + drafts) given `min(20 s, remaining − 2 s)`, skipped under 6 s. Output is Zod-validated and sanitised; any failure → `ai: null`.
5. `assemble`: deterministic outcomes + probe, soft-404 and AI outcomes → checks, issues, scores, page summaries. Skipped or failed network/AI checks are `unavailable`. `AuditResult.ai` holds the AI insights (or null).
6. Response: `{ partial: PartialAuditReport, sealed: string }`. Partial = scores + issue counts + top 3 issues + AI teaser (`PartialAiInsights`: no drafts, no fact values, first 2 questions only). Audit row stored (if DB).
7. Email gate → `POST /api/audit/unlock {sealed, email, consent}` → unseal, store lead, return full `AuditResult`. Developer hand-off exports (`export.ts`: tickets Markdown, coding-agent prompt) are pure and client-importable.

## Data model (Postgres) — see db/migrations/0001_init.sql
- `audits` (id, url, final_url, overall/seo/geo/performance scores, result jsonb, ip_hash, created_at)
- `leads` (id, email, audit_id → audits, url, overall_score, source, consent, ip_hash, user_agent, created_at)
- `contact_submissions` (id, name, email, company, website, service, budget, message, status, ip_hash, created_at)
- `rate_limits` (bucket, window_start, count; PK bucket+window_start)
RLS enabled on all, no policies (server connection only).

## Env vars (.env.example)
`NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `AUDIT_SEAL_SECRET`, `IP_HASH_SALT`, `ADMIN_PASSWORD`, `PAGESPEED_API_KEY` (optional), `RESEND_API_KEY` (optional), `CONTACT_NOTIFY_EMAIL` (optional), `MAIL_FROM` (optional), `NVIDIA_API_KEY` / `NVIDIA_MODEL` / `NVIDIA_MODEL_FALLBACK` (optional, AI insights).

## Scoring
Each check has a weight (`score.ts` → `CHECK_WEIGHTS`) and returns score 0..1. `unavailable` checks are excluded from the denominator. Sub-score = Σ(weight·score)/Σ(weight) × 100 per category. Overall = 0.45·SEO + 0.35·GEO + 0.20·Performance (Performance is excluded and the rest re-weighted if PSI is unavailable). Issues come from non-passing checks, ordered by severity then `impact` (overall points recoverable).

- **SEO** (13 original checks + `seo.soft-404` 4, `seo.bing-indexnow` 3). `seo.bing-indexnow` is capped at `warn`.
- **GEO**: `geo.ai-crawlers` 20, `geo.answer-ready` 15, `geo.organization-schema` 14, `geo.ai-clarity` 11, `geo.faq` 10, `geo.entity-consistency` 8, `geo.dates` 8, `geo.raw-html-facts` 8, `geo.ai-crawler-probe` 8, `geo.snippet-eligibility` 8, `geo.author` 7, `geo.llms-txt` 6, `geo.fact-consistency` 6, `geo.content-format` 5, `geo.review-signals` 3 (ADR-015, ADR-018).
- **Unavailable by design:** `geo.ai-clarity` without an NVIDIA key or when the LLM fails (scores are then identical to an audit without AI); `geo.ai-crawler-probe` and `seo.soft-404` when skipped for time, cancelled, or when our own crawler was refused (probe inconclusive).
- `geo.ai-clarity` score = clarityScore/100, computed by our code from the model's fact/question statuses (60% facts, 40% questions), never chosen by the model.
