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
3. Engine: SSRF-safe fetch of homepage → robots.txt, sitemap, llms.txt → pick up to 5 internal links (same host, HTML) → per-page checks → site checks → PageSpeed (parallel, 25 s cap) → score.
4. Response: `{ partial: PartialAuditReport, sealed: string }`. Partial = scores + issue counts by severity + top 3 issues. Audit row stored (if DB).
5. Email gate → `POST /api/audit/unlock {sealed, email, consent}` → unseal, store lead, return full `AuditResult`.

## Data model (Postgres) — see db/migrations/0001_init.sql
- `audits` (id, url, final_url, overall/seo/geo/performance scores, result jsonb, ip_hash, created_at)
- `leads` (id, email, audit_id → audits, url, overall_score, source, consent, ip_hash, user_agent, created_at)
- `contact_submissions` (id, name, email, company, website, service, budget, message, status, ip_hash, created_at)
- `rate_limits` (bucket, window_start, count; PK bucket+window_start)
RLS enabled on all, no policies (server connection only).

## Env vars (.env.example)
`NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `AUDIT_SEAL_SECRET`, `IP_HASH_SALT`, `ADMIN_PASSWORD`, `PAGESPEED_API_KEY` (optional), `RESEND_API_KEY` (optional), `CONTACT_NOTIFY_EMAIL` (optional), `MAIL_FROM` (optional).

## Scoring
Each check has a weight and returns score 0..1 (`unavailable` checks are excluded from the denominator). Sub-score = Σ(weight·score)/Σ(weight) × 100 per category. Overall = 0.45·SEO + 0.35·GEO + 0.20·Performance (Performance falls back to being excluded and reweighted if PSI unavailable). Issues are produced from non-passing checks, ordered by severity then `impact` (points recoverable on overall).
