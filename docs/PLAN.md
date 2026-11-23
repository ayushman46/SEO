# noticr v1 plan (deadline sprint)

Deadline: live by **2026-11-23 12:30 IST**. Feature freeze **10:00 IST**. QA only 10:00–11:45. Prod deploy 11:45 (needs founder yes).
Scope changes from the original brief are in DECISIONS.md (ADR-009..011) and BACKLOG.md.

## Phase 0 — Setup (18:20–19:15)
- [x] Founder questions (3) and defaults logged
- [x] Next.js 16.4 scaffold, TS strict, Tailwind v4
- [x] Docs skeleton, contracts (`src/lib/audit/types.ts`, `src/content/types.ts`), route map
- [x] 5 agent definitions in `.claude/agents/`
- [ ] Prettier, Vitest, scripts, CI workflow (typecheck, lint, test, build)
- [ ] First commit + push

## Wave 1 — parallel (19:15–~23:00)
- [ ] T001 frontend-designer: design system, collage imagery, components, /design-preview, home page
- [ ] T002 audit-engine: SSRF-safe crawler, SEO + GEO checks, PSI, scoring, partial report, tests
- [ ] T003 architect-backend: Postgres migrations, db client, seal, rate limit, `/api/audit`, `/api/audit/unlock`, contact action, mailer, admin (basic auth), security headers
- [ ] T004 content-seo: all copy, metadata helpers, JSON-LD, sitemap, robots, llms.txt, OG image

## Wave 2 (~23:00–~04:00)
- [ ] T005 frontend-designer: /audit flow UI (progress, partial report, email gate, full report)
- [ ] T006 frontend-designer: Services, Pricing, About, Contact, Privacy, Terms, 404
- [ ] T007 admin UI polish (leads + contacts tables)
- [ ] T008 qa-security: continuous review, SSRF tests, axe, headers

## Wave 3 (~04:00–10:00)
- [ ] Integration fixes, noticr self-audit ≥ 95
- [ ] Vercel preview deploy, env vars set
- [ ] Mobile pass at 360/768/1280/1920

## Freeze → launch (10:00–12:30)
- [ ] QA + Lighthouse report → docs/LIGHTHOUSE.md
- [ ] Founder yes → production deploy, smoke test every route
- [ ] Launch report
