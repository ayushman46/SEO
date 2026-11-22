# T006 — Services, Pricing, About, Contact, Privacy, Terms, 404
**Agent:** frontend-designer · **Depends on:** T001 components, T004 copy + `src/lib/seo`, T003 contact action

## Files
`src/app/(marketing)/{services,pricing,about,contact,privacy,terms}/page.tsx`, `src/app/not-found.tsx`, `src/components/contact/ContactForm.tsx` (client, `useActionState` with `@/app/actions/contact`), `src/components/pages/*` shared bits (PageHero with small torn-paper collage strip, PricingCard, ServiceBlock, LegalBody).

## Requirements
- Every page: `export const metadata = buildMetadata({...})` from `@/lib/seo/metadata` using the page's `PageCopy`; JSON-LD via `<JsonLd>`: Breadcrumb on all, Service list on /services, FAQPage on /pricing (pricingFaq) — and on home if FAQ renders (check T001 did it).
- /services: one page, a section per service with id = slug (anchors from home), deliverables, "for who", price from, CTA to /contact?service=slug and /audit.
- /pricing: tiers grid (highlighted tier), placeholder note visible to founder only via "[PLACEHOLDER]" strings (leave them visible — founder replaces before launch), FAQ.
- /about: editorial long-form with a collage.
- /contact: form (name, email, company, website, service select prefilled from `?service=`, budget, message, consent, hidden honeypot `company_website`), inline Zod field errors from the action, success state, `aria-live`.
- /privacy, /terms: readable legal layout, "Last updated" date, TOC on desktop.
- 404: on-brand ("This page isn't seen — yet"), links home + audit.

## Acceptance
Typecheck/lint pass; AA contrast; 360–1920 clean; every page has unique title/description/canonical.
