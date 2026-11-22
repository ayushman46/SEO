# QA: launch-readiness (T012)

Date: 2026-11-22. Reviewer: qa-security. Target: production build (`next start`) at http://localhost:3210, no env vars set (no DATABASE_URL, AUDIT_SEAL_SECRET, ADMIN_PASSWORD, NEXT_PUBLIC_SITE_URL). Read-only review: no application code was changed.

Severity: **critical** = blocks launch, **high** = fix before launch, **medium** = fix soon after, **low** = nice to have.

## Findings

| # | Severity | Where | Issue | Fix | Owner |
|---|----------|-------|-------|-----|-------|
| 1 | critical | `src/content/legal.ts`, `src/content/about.ts`, `src/content/contact.ts`, pricing/services content; rendered on /audit (2), /services (16), /pricing (21), /about (5), /contact (4), /privacy (9), /terms (9) | Visible "replace before launch" placeholder tags render on 7 public pages. Unresolved: legal entity name, registered address, privacy contact email, jurisdiction, payment/refund/cancellation terms, retention period, processor names (Neon/Resend), founder name and bio, City/Country, reply SLA ("2 working days"), "confirm GST registration and rate", "confirm reviewer", and the bare `[PLACEHOLDER]` tags next to prices and scope ("up to 50 pages", "$69", "from $199"). A privacy policy and terms with no legal entity, contact or jurisdiction are not publishable. | Founder supplies the real values; content-seo replaces every `[PLACEHOLDER…]` marker in `src/content/**`. Re-check: `grep -rn "\[PLACEHOLDER" src/content src/components` should only match the design-preview demo and the `PlaceholderText` helper. | founder + content-seo |
| 2 | high | `src/lib/seo/metadata.ts:29-35`, `src/lib/security/seal.ts:27-41`, `src/lib/security/request.ts:78-90`, `src/lib/security/rate-limit.ts:115` | Production env must be set. All of these fall back silently (warn-only): no `NEXT_PUBLIC_SITE_URL` and not on Vercel means canonical, og:image, sitemap, robots `Sitemap:` and JSON-LD `@id`/`url` all point at `http://localhost:3000` (observed on this build). No `AUDIT_SEAL_SECRET` means a random per-process key, so unlock fails whenever the unlock request lands on a different serverless instance than the audit (lead-gate breaks in production). No `IP_HASH_SALT` means a public, fixed dev salt. No `DATABASE_URL` means the rate limit is per instance (ADR-013). | Launch checklist: set `NEXT_PUBLIC_SITE_URL=https://<prod domain>`, `AUDIT_SEAL_SECRET` (>=32 chars), `IP_HASH_SALT` (>=16), `DATABASE_URL`, `CONTACT_NOTIFY_EMAIL`, `RESEND_API_KEY`, `MAIL_FROM` in Vercel Production. Optional hardening: fail fast (throw at first use) when `NODE_ENV=production && VERCEL_ENV=production` and `AUDIT_SEAL_SECRET`/`IP_HASH_SALT` are missing. | founder (env) / architect-backend (fail-fast) |
| 3 | low | `.next/static/media/index.<hash>.js`, served at `/_next/static/media/index.396kbcd66iu9-.js` (200, application/javascript) | Turbopack emits the server-only `postgres` package entry (`import os from 'os'` …) as a public static asset because of an asset reference inside postgres.js. Open-source code only; no secrets or app code; reveals the DB driver. | Add `serverExternalPackages: ["postgres"]` to `next.config.ts`, rebuild, confirm `.next/static/media` contains only fonts/icons. | architect-backend |
| 4 | low | `src/lib/security/request.ts:30-37` | Client IP is the first `X-Forwarded-For` hop. With a spoofed XFF a client gets a fresh audit bucket (verified locally: 198.51.100.99 was not limited after 198.51.100.77 was). Safe on Vercel (the platform overwrites XFF), unsafe behind any other proxy or a bare `next start`. Already documented in code. | Deploy only on Vercel, or behind a proxy that strips client XFF. Note it in the deploy docs. | architect-backend |
| 5 | low | `/services`, `/pricing` RSC payload | Raw `[PLACEHOLDER]` strings appear in the flight payload because list items use the copy string as their React `key`. Not visible, but scrapers that read the payload can see it. | Resolved by #1. Optionally key list items by index or id. | frontend |
| 6 | low | `src/app/api/audit/route.ts:35-42,70-73` | The engine's specific `invalid_url` messages ("Only standard web ports (80 and 443)…", "Only http:// and https://…", "username or password") are replaced by the generic route message, so `example.com:8080` or `ftp://…` users get a vague error. | Pass the AuditError message through for `invalid_url` (these messages are already user-safe), or map sub-reasons. | architect-backend |
| 7 | low | `src/app/api/audit/route.ts:106` | The quota is charged before DNS/SSRF resolution, so typos (NXDOMAIN) and DNS-to-private hosts (e.g. `localtest.me`) use up one of the 5 hourly audits. This is the conservative choice (prevents free DNS probing), so it is noted, not a defect. | None required. Optionally mention "typos count" in the 429 copy. | architect-backend |

No critical or high security defects were found in the application code.

## Pass list

### Routes, status codes and content types
- 200 `text/html`: `/ /audit /services /pricing /about /contact /privacy /terms /design-preview`.
- `/robots.txt` 200 text/plain; `/sitemap.xml` 200 application/xml; `/llms.txt` 200 text/plain; `/opengraph-image` 200 image/png; `/icon.svg` 200 image/svg+xml; `/apple-icon.png` 200 image/png; `/favicon.ico` 200 image/x-icon; `/logo.png` 200 image/png.
- A missing path returns 404 (HTML not-found page).
- `/admin` returns 404 with ADMIN_PASSWORD unset, with `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`.

### SEO metadata (8 indexable pages)
- Titles are unique and 41-51 chars.
- Exactly one `<h1>` per page.
- Canonical present on every indexable page.
- Meta description 139-155 chars on every indexable page.
- `og:image` resolves to a 200 image/png.
- All JSON-LD blocks parse (Organization/WebSite array plus FAQPage etc.), and none contains `[PLACEHOLDER`.
- `/design-preview` has `robots: noindex, nofollow`, is not in the sitemap, is disallowed in robots.txt, and no public page links to it.
- The sitemap lists the 8 public pages, and every one returns 200.
- robots.txt allows the major AI crawlers, disallows /admin, /api/, /design-preview, and has a `Sitemap:` line (host depends on env, see finding #2).
- Internal links: every `<a href="/…">` on all 9 pages (18 unique targets incl. `/contact?service=*` and `/llms.txt`) returns 200. Every in-page `#anchor` and cross-page `/path#id` resolves to an existing `id`.

### Security headers
- HTML, API, static, image and 404 responses all carry `Content-Security-Policy` (`frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `X-Frame-Options: DENY`.
- No `X-Powered-By` header.
- HSTS is sent whenever `NODE_ENV=production`, which includes local `next start`; browsers ignore it over http.
- API responses add `X-Robots-Tag: noindex` and `Cache-Control: no-store`.

### API: POST /api/audit (every error is `{error:{code,message}}` JSON, never a stack trace)
- Invalid JSON: 400 `invalid_json`. No JSON content-type: 415. Body over 4 KB (with Content-Length or chunked): 413 `payload_too_large`.
- Missing url, non-string url, or array body: 400 `invalid_url`.
- `ftp://`, `javascript:`, `file:`, ports other than 80/443, and userinfo URLs: 400 `invalid_url`.
- 422 `blocked_host` for:
  - `localhost`, `foo.localhost`
  - `127.0.0.1`, `0.0.0.0`, `169.254.169.254`, `10.0.0.1`, `172.16.0.1`, `192.168.1.1`, `100.64.0.1`
  - `[::1]`, `[::ffff:127.0.0.1]`, `[::ffff:a9fe:a9fe]`
  - `2130706433`, `0x7f000001`, `0177.0.0.1`, `127.1`
  - `localtest.me` (DNS resolves to loopback)
- Redirect hops are re-normalized and re-resolved, and the socket is pinned to the validated IP (static review of `src/lib/audit/net/fetch.ts` and `ssrf.ts`).
- One real audit of https://example.com returned 200 in about 7 s with `{partial, sealed}`:
  - `howToFix` appears only on the 3 `topIssues`.
  - The 15 `lockedIssues` carry only `id, title, severity, category`, and no locked issue overlaps a top issue.
  - `sealed` is AES-256-GCM ciphertext (not readable base64 JSON).
- Rate limit: the 6th countable request from one IP in the window returned 429 `rate_limited` with `retryAfter` and a `Retry-After` header. Malformed and blocked-by-construction URLs are rejected before the limiter and do not count. A blocked host still gets 422 after the limit is hit.

### API: POST /api/audit/unlock
- Tampered or garbage `sealed`: 400 `invalid_or_expired`.
- Missing consent, `consent:false` or `consent:"true"`: 400 `consent_required`.
- Bad email or CRLF-injected email: 400 `invalid_email`.
- Invalid JSON: 400.
- A valid unlock returns `{result}` with all 18 issues, each with `howToFix`.
- Rate limit: 10/h per IP, checked before unseal (static).

### Contact server action (static review of `src/app/actions/contact.ts`, `contact-schema.ts`)
- Zod schema bounds every field: name 2-100, email <=254 and valid, company <=120, website http(s) and <=2048, service and budget enums, message 10-4000, consent required. Only string FormData values are read.
- The honeypot `hp_field_x7` returns a fake success and stores and sends nothing.
- Per-IP rate limit of 5/h.
- Echoed values are capped at 4000 chars.
- The mail subject is stripped of CR/LF (`oneLine`).
- Next server actions enforce an Origin/Host check.

### Admin auth
- `src/lib/security/admin-auth.ts` compares SHA-256 of both sides with an XOR accumulate (constant time).
- A password under 12 chars is treated as unset, so /admin returns 404.
- Auth is checked in proxy and again in the page.

### Secrets and bundles
- `.next/static` contains none of: `AUDIT_SEAL_SECRET`, `IP_HASH_SALT`, `ADMIN_PASSWORD`, `DATABASE_URL`, `RESEND_API_KEY`, `PAGESPEED_API_KEY`, `CONTACT_NOTIFY_EMAIL`, `MAIL_FROM`, the dev salt, `cheerio`, `robots-parser`, `createCipheriv`, `resolve4`, `api.resend.com`, or SQL. The only hit was the postgres.js media asset (finding #3).
- The only `NEXT_PUBLIC_` variable is `NEXT_PUBLIC_SITE_URL`, which is not a secret.
- `git ls-files` includes `.env.example` only; `.gitignore` has `.env*` with `!.env.example`.

### Copy honesty (rendered HTML of all 8 public pages, the 404 page and llms.txt)
- No matches for "sign in", "log in", "dashboard", "SeenHQ", "Seenhq", "trusted by", "used by", "[COPY]".
- "guarantee" appears only as negations ("Can you guarantee rankings…?" FAQ on /, "No guarantees of rankings or citations" and "a guide, not a guarantee" on /terms).

## Commands

| Command | Result |
|---------|--------|
| `npm run typecheck` (next typegen + tsc --noEmit) | pass |
| `npm run lint` | pass (0 problems) |
| `npx vitest run` | pass: 21 files, 343 tests |
| Route/metadata/link crawler (node, against :3210) | pass apart from findings #1 and #2 |
| curl header checks | pass |
| curl /api/audit negative matrix (30 cases) | pass |
| 1 real audit (example.com) and the unlock matrix | pass |
| Rate-limit trip | pass |
| Bundle secret grep, `git ls-files` | pass (finding #3 is low) |
| `npm run build` | not run (another agent owns the rebuild) |
| axe / keyboard / Lighthouse | not run in this task (no browser) |
