# seenhq v1 launch report

**Live:** https://seenhq.vercel.app (Vercel production, deployed 2026-11-22 23:50 IST, about 12.5 h before the deadline)
**Repo:** https://github.com/ayushman46/SEO, branch `main`

## Scores on production (Google PageSpeed Insights, mobile, Moto G Power, slow 4G)

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| / | 96 | 100 | 100 | 100 |
| /audit | 99 | 100 | 100 | 100 |
| /pricing | 98 | 100 | 100 | 100 |
| /about | 99 | 100 | 100 | 100 |

Home metrics: FCP 1.1 s, LCP 2.5 s, TBT 30 ms, CLS 0. seenhq's own free audit scores the live site 100 / 100 / 100 (SEO / GEO, all 21 checks pass).

## What shipped
- **Marketing site:** Home, Services (8 services), Pricing (USD + India ₹ switch), About, Contact, Privacy, Terms, 404. Metadata, JSON-LD (Organization, WebSite, Service, OfferCatalog, FAQPage, Breadcrumb), sitemap.xml, robots.txt (AI crawlers allowed), llms.txt, OG image, icons.
- **Free audit:** homepage + up to 5 pages, SEO + GEO checks, scoring, prioritised issues; full report unlocked by email (lead capture). SSRF-protected crawler, rate limited, 60 s cap, concurrency cap.
- **Contact form** (server action, validated, honeypot, rate limited) and **/admin** (leads and contact tables, HTTP Basic auth).
- **Three services from verified market research** (docs/MARKET_RESEARCH.md): AI fact-check & fix, local AI visibility setup, AI crawler unblock.
- **Quality:** 350 tests, two independent review rounds (R1 copy, R2 security/correctness: 25 verified findings fixed), launch QA (docs/QA.md). No critical or high issues open.

## Known issues (set these to remove them)
| Issue | Effect today | Fix |
|---|---|---|
| No `DATABASE_URL` | Leads and contact messages are not stored; they appear only in Vercel runtime logs. /admin shows "not configured". | Create a free Neon Postgres, add `DATABASE_URL` (and `DATABASE_URL_UNPOOLED`) in Vercel, run `npm run db:migrate`, redeploy. |
| Rate limit is per server instance without a DB | A determined abuser can exceed 5 audits/hour across instances (ADR-013). | Same as above, optionally a Vercel Firewall rule on `/api/audit`. |
| No `PAGESPEED_API_KEY` | Audits show Performance "Not measured" (Google rejects keyless calls). | Free key from Google Cloud, add in Vercel, redeploy. |
| No `ADMIN_PASSWORD` | /admin returns 404. | Add a 12+ character password in Vercel. |
| No email notifications | New leads/contacts are not emailed to you. | `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`, `MAIL_FROM`. |
| No custom domain | Site is on seenhq.vercel.app. | Add the domain in Vercel, then update `NEXT_PUBLIC_SITE_URL` and redeploy. |

## Replace or review (neutral wording is live now)
- Prices (USD and INR) are live list prices you chose by default: review on /pricing and /services.
- No public email, address, founder bio or legal entity: add when you have them (src/content/site.ts, about.ts, legal.ts).
- Privacy policy and terms are plain-language drafts, not legal advice: have them reviewed.
- Hero uses the Mona Lisa's eyes (public domain): swap if you prefer a less famous portrait.
- Social profile URLs for structured data (`sameAsProfiles` in src/lib/seo/jsonld.tsx).

## In the backlog (docs/BACKLOG.md)
User accounts and dashboard, AI visibility tracking, PDF export, share links, background jobs, blog, Stripe, dark mode, per-service pages, trend charts.
