# Decisions (ADR log)

Newest on top. One short entry each.

## ADR-012 — Static CSP with 'unsafe-inline' scripts in v1 (architect-backend)
CSP is a static header from `next.config.ts` `headers()`, not per-request nonces. Nonces force every page to render dynamically, which defeats Cache Components' static shells for the marketing pages. Cost: `script-src 'self' 'unsafe-inline'` (+ `'unsafe-eval'` in dev only) weakens XSS protection, so we rely on React's escaping and never render untrusted HTML. Allowed origins: `https://va.vercel-scripts.com` (Vercel Analytics), `https://vitals.vercel-insights.com` (connect). `img-src 'self' data: blob:` means no third-party images (e.g. audited sites' favicons) unless added here. `frame-ancestors 'none'` + `X-Frame-Options: DENY`. HSTS and `upgrade-insecure-requests` in production only. Revisit with nonces / SRI if we add user-generated content.
Related Next 16 constraint: with `cacheComponents: true` the `dynamic` and `runtime` route segment exports are not allowed, so `/api/audit` sets only `maxDuration = 60` and `/admin` reads `headers()` inside `<Suspense>` instead of `dynamic = "force-dynamic"`.

## ADR-011 — No user auth in v1 (founder decision, 2026-11-22 18:40 IST)
Founder removed auth from v1: "the website won't need it; if needed we'll add it later."
Consequences: dashboard (projects, history) cut to BACKLOG. Full report is gated behind an **email** (lead capture) instead of signup. Admin is a single page behind HTTP Basic auth with one `ADMIN_PASSWORD` env var — no accounts, no roles.

## ADR-010 — Plain Postgres via `DATABASE_URL`, provider-agnostic
Supabase free tier is at its 2-active-project limit on the founder's account, and without auth Supabase's main advantage is gone. We talk to any Postgres through `postgres` (porsager, tiny, no ORM) with SQL migrations in `/db/migrations`. Recommended host: Neon free tier (never deleted; auto-suspends and resumes in <1s). Supabase still works (paste its pooled connection string). Every table has RLS enabled with no policies, so if it ever lives on Supabase the anon/public API cannot read it — only the server connection can.
If `DATABASE_URL` is missing, the app still runs: audits work, and lead/contact submissions are logged server-side and the user sees success (dev/demo only; STATUS.md flags it).

## ADR-009 — Stateless email gate with sealed results
The free audit returns a partial report plus the **full result sealed with AES-256-GCM** (`AUDIT_SEAL_SECRET`). To unlock, the client posts the sealed blob + email; the server decrypts, stores the lead, and returns the full report. No DB round-trip needed to hold results, works on serverless, and the client cannot read the full report without the email step. Seals expire after 2 hours.

## ADR-008 — Synchronous audit, 60 s hard budget
No job queue in v1. `POST /api/audit` runs homepage + up to 5 internal pages with a global 55 s budget (`maxDuration = 60` on Vercel). Per-request timeout 8 s, max 2 MB per HTML page, max 3 redirects, each hop re-validated against SSRF rules.

## ADR-007 — SSRF protection
Only http/https on ports 80/443. Hostname resolved via DNS; every resolved address checked against private/reserved ranges (IPv4 + IPv6 incl. mapped addresses, loopback, link-local, CGNAT, metadata 169.254.169.254). The socket connects to the **validated IP** (custom `lookup`) to defeat DNS rebinding. Redirects followed manually and re-validated.

## ADR-006 — Rate limiting
Postgres fixed-window counter table when `DATABASE_URL` exists, in-memory fallback otherwise. Audit: 5 per IP per hour. Unlock: 10 per IP per hour. Contact: 5 per IP per hour. IPs are stored only as salted SHA-256 hashes.

## ADR-005 — Dependencies beyond the brief
- `cheerio` — HTML parsing for the audit engine (fast, server-only).
- `robots-parser` — spec-compliant robots.txt matching (Allow/Disallow precedence, wildcards).
- `ipaddr.js` — correct IPv4/IPv6 range classification for SSRF checks.
- `postgres` — DB client (see ADR-010).
- `motion` (Framer Motion's current package name) — motion.
- No React Hook Form: forms are 3 small server-action forms; `useActionState` + Zod is less code. No Lenis: native scrolling is better for a11y and Lighthouse.
- No shadcn CLI: we need ~6 primitives; hand-built on our tokens so it doesn't look like a default shadcn site.

## ADR-004 — Light mode only in v1
Per the deadline override. Tokens are still CSS variables so dark mode is a later palette swap.

## ADR-003 — Defaults taken without founder input
- Domain: none yet. `NEXT_PUBLIC_SITE_URL` drives canonicals/sitemap; defaults to the Vercel URL.
- PageSpeed Insights: called keyless (low quota). `PAGESPEED_API_KEY` optional; on failure the CWV check shows "unavailable" and is excluded from scoring.
- Email notifications: `Mailer` interface with a console implementation; Resend implementation activates when `RESEND_API_KEY` is set.
- Audience: startups/SaaS **and** local businesses; prices on the low side. All prices are marked placeholders.
- Brand is written **seenhq**, all lowercase.

## ADR-002 — Next.js 16.4 App Router, Tailwind v4, TypeScript strict
Latest stable at sprint start. Turbopack dev.

## ADR-001 — One repo, docs as source of truth
`/docs/STATUS.md` top entry is the resume point for any session.
