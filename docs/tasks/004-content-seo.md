# T004 — All copy, metadata, JSON-LD, sitemap/robots/llms.txt, OG image
**Agent:** content-seo · **Priority:** 1–2 (frontend renders your copy) · **Depends on:** `src/content/types.ts`

## Deliverables (write the content files FIRST, within ~30 min; frontend-designer is building against them right now)
1. `src/content/site.ts` → `export const site: SiteConfig`. Nav: Free audit (/audit), Services (/services), Pricing (/pricing), About (/about), Contact (/contact). Footer groups. `enginesTracked`: ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews, Microsoft Copilot, Google Search, Bing.
2. `src/content/home.ts` → `export const home: HomeContent` (4 tabs: seo, geo, performance, fixes; 3 how-it-works steps; 6–8 FAQs that also define GEO, AI Overviews, llms.txt in answer-ready form).
3. `src/content/services.ts` → `export const services: Service[]` with slugs exactly: `seo-audit`, `geo-audit`, `technical-fixes`, `content-entity`, `monitoring`. Plus `export const servicesPage: PageCopy`.
4. `src/content/pricing.ts` → `export const pricingTiers: PricingTier[]` (Free audit $0; Full audit one-time ~$49; Fix sprint ~$199 one-time; Monitoring ~$29/month — all "[PLACEHOLDER]"-marked), `pricingFaq: FaqItem[]`, `pricingPage: PageCopy`. Note local-business friendliness.
5. `src/content/about.ts` (`aboutPage: PageCopy` + `aboutSections: {title, body}[]` — mission "be seen by people and by the machines they ask"; no fake team/bios; founder name/bio as placeholder), `src/content/contact.ts` (`contactPage: PageCopy`, field labels/help text, success message), `src/content/audit.ts` (`auditPage: PageCopy`, progress step labels: "Checking the address", "Reading robots.txt and sitemap", "Scanning pages", "Asking PageSpeed", "Scoring", plus email-gate copy and error messages by `AuditError` code + `rate_limited`).
6. `src/content/legal.ts` → `privacy: LegalDoc`, `terms: LegalDoc`. Plain, honest, matching what we actually do: we fetch public pages of the URL submitted, store audit results, email + IP hash for leads/contacts, no cookies beyond Vercel Analytics (cookieless), contact for deletion. Mark governing law/entity name placeholders. Not legal advice note in STATUS for founder.
7. `src/lib/seo/` — `metadata.ts`: `siteUrl()` (from `NEXT_PUBLIC_SITE_URL`, fallback `https://${VERCEL_PROJECT_PRODUCTION_URL}` or `http://localhost:3000`), `buildMetadata({title, description, path, noindex?})` returning Next `Metadata` with canonical, OG, Twitter, `metadataBase`, title template `%s · seenhq`. `jsonld.ts`: helpers `organizationLd()`, `websiteLd()`, `serviceLd(service)`, `faqLd(items)`, `breadcrumbLd(items)` + a `<JsonLd data={…}/>` server component in `src/lib/seo/JsonLd.tsx` (escape `<` in JSON).
   Root default metadata export: `export const rootMetadata: Metadata` for layout.tsx to use.
8. `src/app/sitemap.ts`, `src/app/robots.ts` (allow all incl. the AI bots listed in T002; disallow `/admin`, `/api/`, `/design-preview`; sitemap link), `src/app/llms.txt/route.ts` (static text, llmstxt.org format: `# seenhq`, `> summary`, sections linking key pages with one-line descriptions), `src/app/opengraph-image.tsx` (1200×630 via `next/og`, off-white paper bg, big serif-ish wordmark "seenhq" + tagline + blue accent rule; keep it font-safe — `next/og` default font is fine or fetch Instrument Serif TTF from Google Fonts at build time with a fallback).

## Rules
See `.claude/agents/content-seo.md`. Brand is "seenhq". No fake proof. Every placeholder contains "[PLACEHOLDER".
At the end, list every placeholder the founder must replace.

## Acceptance criteria
- All files typecheck against `src/content/types.ts` (`satisfies` or explicit types). Lint passes.
- Titles ≤ 60 chars, descriptions 120–155 chars (add a tiny vitest test asserting lengths for every PageCopy).
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/opengraph-image` render in `npm run build`.
