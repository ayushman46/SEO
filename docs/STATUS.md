# Status log (newest on top)

## 2026-11-24 00:20 IST: renamed to noticr; remaining round 4 findings fixed and LIVE (a0f8638)
- **Live and smoke-tested:** brand is noticr everywhere (site, metadata, crawler UA noticrbot, docs, tests). URL unchanged: https://seenhq.vercel.app (noticr.vercel.app is taken; Vercel project still named seenhq). R7 6-13 and 15-24 fixed. 783 tests, typecheck, lint, build green. All routes 200, missing 404, python.org audits at 79.
- **Not browser-checked:** the changed audit/contact/report states (only HTML and tests). Fix sprint copy now says "code fixes" (a test bans "technical fixes"): founder may prefer another word.
- **Open:** server keeps the audit slot after a visitor leaves (needs request cancellation); a production address for the new name; `BING_SITE_VERIFICATION` (new optional env); launch video lives in video/ (own package.json, excluded from site tooling).
- **Founder actions unchanged:** RESEND_API_KEY + CONTACT_NOTIFY_EMAIL (+ MAIL_FROM) or DATABASE_URL; NVIDIA_API_KEY; PAGESPEED_API_KEY; named person on About; payments.

## 2026-11-23 13:35 IST: round 4 high findings fixed and LIVE (a592268)
- **Live and smoke-tested:** (R7 #3) a homepage that refuses our crawler is no longer scored: audit fails with a specific message (yelp.com → 422 "bot check, HTTP 403, looks like DataDome"); normal sites still audit (python.org 79). (R7 #4/#5) the 8-fix cap counts only Fix sprint issues. (R7 #2/#9) the "One Fix sprint covers up to 8…" line shows only for a sprint-only fixed quote (gone from /sample-report). (R7 #1) production error log when a contact message, order or lead was neither stored nor emailed; docs/LAUNCH_REPORT.md has a "Before you take orders" section. Also R7 #14 (figcaption attribution). 769 tests, typecheck, lint, build green.
- **Still open:** R7 findings 6-13 and 15-24 (medium/low) in docs/reviews/R7-round4-live.md; parked home content-visibility experiment (docs/parked/); home mobile performance unconfirmed by PageSpeed.
- **Founder actions (most urgent first):** RESEND_API_KEY + CONTACT_NOTIFY_EMAIL (+ MAIL_FROM) or DATABASE_URL, otherwise orders exist only in runtime logs; NVIDIA_API_KEY; PAGESPEED_API_KEY; a named person on About; payments.

## 2026-11-23 12:45 IST: SPRINT STOPPED at the 12:30 deadline. Round 3 small fixes live; round 4 findings logged, not applied
- **Live:** round 3 fixes from docs/reviews/R6-live.md that were finished and verified: true hero line (names the $149 Fix sprint), service-card price alignment, no focus ring on the rupee panel, FAQ marker consistency, 404 robots tags, About CTA punctuation. 722 tests, typecheck, lint, build green.
- **NOT shipped:** the home-page content-visibility experiment (R6 finding 1). The agent was cut off by the usage limit before finishing its sticky/anchor checks, so it is parked in docs/parked/home-content-visibility.patch + LazySection.tsx.txt. Home main-thread cost on mobile is therefore still open and still unconfirmed by PageSpeed Insights.
- **Next round (not started):** docs/reviews/R7-round4-live.md has 24 verified findings (4 high). Highest: (1) contact/order form reports success even when nothing is stored or emailed (needs RESEND_API_KEY + CONTACT_NOTIFY_EMAIL and/or DATABASE_URL in Vercel); (2) "One Fix sprint covers up to 8 of these for $149" shows above totals where it is untrue; (3) a site that returns 403 to our crawler is still scored from its block page; (4) the 8-fix cap counts issues across all services, so the Fix sprint jumps to "From $249" wrongly.
- **Reminder:** pushes to main auto-deploy to production (founder chose to keep this).
- **Founder actions:** NVIDIA_API_KEY, PAGESPEED_API_KEY, RESEND_API_KEY + CONTACT_NOTIFY_EMAIL, DATABASE_URL; a named person on About; payments.

## 2026-11-23 11:25 IST: v1.2 LIVE (restored v1.1 home + redesigned inner pages + new prices). IMPORTANT: pushes to main auto-deploy to production
- **Discovery:** the Vercel project is connected to the GitHub repo, so EVERY `git push` to `main` deploys to production (seen in `vercel ls --prod`: a production deployment per push). Earlier status entries and chat messages that said "production is still v1.1" after 08:40 were WRONG: the redesign and the new price ladder went live with the checkpoint pushes (from about 08:40). From now on: push to `main` only verified work; use a branch for work in progress, or the founder disables auto-deploy in Vercel > Project > Settings > Git.
- **Live now (f436910):** home page restored to the v1.1 layout (founder request), with current prices, honest copy, logo marquee, Lenis smooth scroll, eye blink; inner pages keep the redesign (rate card, report front page, fix list, etc.). Production smoke test: all routes 200, missing 404, audit of python.org 200 in 2.7 s (79).
- **Not verified:** PageSpeed Insights on the live site after these changes (the in-app browser pane would not run it). Scroll feel in a visible browser.
- **Loop rules going forward:** home layout is frozen to v1.1 (critics may report only bugs, untrue copy and a11y there). Founder chose (11:10) to KEEP auto-deploy: work on `main`, and every push goes live, so push only after typecheck, lint, full tests and build are green and the change is checked; never push a work-in-progress checkpoint.
- **Running:** qa-security T034 round 3 review of the live site -> docs/reviews/R6-live.md. Next: apply its findings (owners per finding), verify, push (= deploy), smoke test production.
- **Founder decisions open:** NVIDIA_API_KEY; named person on About; payments; DATABASE_URL; privacy wording tweaks (R5 B7, B8); FAQ heading wording; whether to keep the eye blink.

## 2026-11-23 10:55 IST: round 2 done; founder wants the PREVIOUS home page back; production deploy on hold until it is restored
- **Committed + pushed (a54bf4c):** round 2 copy fixes (R5-copy), wiring, rendered design QA fixes (R5-design-qa: tray on phones, focus not obscured, rate card alignment). 721 tests, typecheck, lint, build green. Preview of that state: https://noticr-pa0z65w2t-ayushs-projects-32c1d225.vercel.app (routes 200, audit + unlock OK, new prices visible).
- **Founder (10:50):** "go back to the previous home landing page, it was better." Running: frontend-designer T033 restores the HOME page (route / only) to the v1.1 design (commit afe001d), keeping current prices, honest copy, logo marquee, smooth scroll, a11y/perf fixes. Inner-page redesign stays.
- **Founder (10:05):** deploy the new version to production once fixes are done; keep the fixing loop running until the session limit. => After T033: build, screenshots vs v1.1, preview, smoke test, then `npx vercel deploy --prod --yes` (approved), PageSpeed Insights, then next critic round (critics must NOT redesign the home page again: home layout is frozen to v1.1; only bugs, copy truth and a11y there).
- **Production is still v1.1 with old prices.**

## 2026-11-23 09:20 IST: feedback loop round 1 done and on preview; round 2 critics running
- **Committed + pushed (13f3c91):** copy rewrite (115 edits, docs/COPY_STYLE.md + style tests), below-market price ladder (Full audit $39/₹2,999, Fix sprint fixed $149/₹9,999 up to 8 fixes, Monitoring $19/₹999, fact-check $59/₹3,999, local setup $99/₹3,999, unblock $49/₹2,999, content from $99/₹6,999), Lenis smooth scroll (gated, self-disabling guard, docs/SCROLL_PERF.md), design review R4 (56 findings), three signature moments (eye blink, report front page, pricing rate card). 711 tests, typecheck, lint, build green.
- **Preview:** https://noticr-8jlrmdrps-ayushs-projects-32c1d225.vercel.app. **Production is still v1.1 with the OLD prices and copy.**
- **Running (round 2):** copy critic -> docs/reviews/R5-copy.md; rendered design/a11y/scroll QA -> docs/reviews/R5-design-qa.md.
- **Exact next step:** apply R5 findings (content-seo for copy, frontend-designer for design; sequential), rebuild, preview, then round 3 critics; repeat until critics find little or the usage limit hits. Ask founder before production deploy (new prices go live with it).
- **Not verified:** scroll feel and FPS in a visible real browser (the in-app pane was hidden and throttled). Headless timespan measured 60 fps at 1x CPU.
- **Research:** docs/research/pricing-1-price-points.md, pricing-2-buyers-and-gap.md, PRICING_RECOMMENDATION.md.

## 2026-11-23 07:50 IST: v1.1 LIVE in production; round 3 started (pricing research, smooth scroll, slop removal)
- **Production:** https://seenhq.vercel.app is v1.1 (founder approved 07:05). PageSpeed mobile: / 98, /audit 99, /sample-report 96, /methodology 98; a11y/BP/SEO 100. docs/LAUNCH_REPORT.md updated.
- **Founder request (07:40):** deeper pricing + exact-gap research; agents in a feedback loop to fix the site and remove AI slop; awwwards-style smooth scrolling with no FPS cost.
- **Running (5 agents):** pricing research 1 (price points, India, unit economics) -> docs/research/pricing-1-price-points.md; pricing research 2 (buyer quotes, demand, exact gap) -> docs/research/pricing-2-buyers-and-gap.md; frontend T025 smooth scroll (Lenis, gated; docs/SCROLL_PERF.md); critic copy slop -> docs/reviews/R4-copy-slop.md; critic design/UX -> docs/reviews/R4-design-ux.md.
- **Exact next step:** when critics + scroll agent finish: content-seo applies R4-copy-slop, frontend-designer applies R4-design-ux (sequential, different files), then a second critic round on the result (loop until critics find little), build, real-browser scroll/FPS check, Lighthouse, preview deploy, ask founder before production. Synthesize the two pricing docs into a recommended price ladder and ask the founder before changing live prices.
- **Note:** a Workflow launch was denied by the permission system; use ordinary agents.

## 2026-11-23 03:20 IST: platform-aware fixes added; still WAITING for founder yes to deploy production
- **Committed + pushed:** platform detection + 135 vendor-verified where-to-click fix entries (ADR-019). 675 tests, typecheck, lint, build green.
- **Latest preview (final candidate):** https://noticr-14z10gium-ayushs-projects-32c1d225.vercel.app (audit of webflow.com via its API: 200 in 4.8 s, score 92).
- **Production is still v1.** Next step on founder yes: `npx vercel deploy --prod --yes`, smoke test, PageSpeed Insights, launch report v1.1.
- **Known:** Shopify's bot check sometimes refuses noticrbot (403), so some Shopify stores cannot be audited.

## 2026-11-23 02:45 IST: v1.1 reviewed, fixed, on preview; WAITING for founder yes to deploy production
- **Committed + pushed (39c92d4):** all R3 review findings fixed (1 critical ReDoS, 1 high label trust, 14 others). 605 tests x3, typecheck, lint, build green. New pages a11y/best-practices/SEO 100 locally.
- **Preview (v1.1 final candidate):** https://noticr-klvcg209z-ayushs-projects-32c1d225.vercel.app. All routes 200; real audit of wikipedia.org through the deployed API: 200 in 2.0 s, 31 checks.
- **Production (https://seenhq.vercel.app) is still v1.** The harness blocked `vercel deploy --prod` without a fresh founder approval. Next step when the founder says yes: `npx vercel deploy --prod --yes`, smoke test routes + audit + quote hand-off, PageSpeed Insights on /, /audit, /sample-report, /methodology, then write docs/LAUNCH_REPORT.md v1.1 section.
- **Founder actions:** approve production deploy; NVIDIA_API_KEY (AI reading is off without it; then run one real audit and tune prompts); decide Fix sprint fixed vs "From"; contact email; Bing verification; optional DATABASE_URL + npm run db:migrate (0001 + 0002), PAGESPEED_API_KEY, ADMIN_PASSWORD.
- **Backlog candidates (docs/MARKET_RESEARCH_3_FULL.md, CONVERSION_RESEARCH.md):** payment link (Razorpay/UPI), follow-up emails, platform-aware fix steps, re-audit diff + change alerts (need DB), white-label reports, competitor comparison, AI shopping feed readiness.

## 2026-11-23 01:50 IST: v1.1 built, on preview, under review
- **Committed + pushed (fc8c945):** AI reading (NVIDIA, off until NVIDIA_API_KEY is set), 9 new checks (content-format, fact-consistency, raw-html-facts, ai-crawler-probe, snippet-eligibility, review-signals, bing-indexnow, soft-404, ai-clarity), export (tickets / agent prompt), instant quote + order hand-off to contact form, /methodology, /bot, /sample-report, logo marquee, copy + legal updates. 547 tests, typecheck, lint, build green. Browser-checked locally: logo strip, sample report, real audit of python.org (79), quote panel, hand-off to /contact.
- **Preview:** https://noticr-ido5sx3ub-ayushs-projects-32c1d225.vercel.app
- **Running:** qa-security review T023 → docs/reviews/R3-v1.1.md.
- **Exact next step:** apply R3 findings (owners: audit-engine / architect-backend / frontend-designer / content-seo), rebuild, Lighthouse on preview pages, then production deploy (vercel deploy --prod) and PageSpeed check, then final report.
- **Founder decisions open:** NVIDIA_API_KEY; Fix sprint fixed $199 vs "From $199"; INR price for Content & entity; taxes shown inclusive; contact email + Bing verification for our own site; founder identity on About.
- **Research docs:** MARKET_RESEARCH.md, _2_PRODUCT.md, _3_FULL.md, CONVERSION_RESEARCH.md.

## 2026-11-23 00:30 IST: v1.1 sprint (founder: run autonomously until 12:30 today)
Founder brief: improve the free audit with an NVIDIA-hosted LLM, add every validated market gap, deepest market research, and a real free-to-paid path. If a usage limit interrupts, resume with "continue the noticr sprint" and pick up from this entry.
- **Live:** https://seenhq.vercel.app is v1 (commit fe25d51 + ring fix). Nothing from v1.1 is deployed yet.
- **In flight (uncommitted in the working tree unless noted):**
  - audit-engine: T014 NVIDIA LLM insights (spec docs/tasks/014-ai-insights.md; contract v1.1 in src/lib/audit/types.ts), then T016 four gap checks + export.ts (docs/MARKET_RESEARCH_2_PRODUCT.md "build now").
  - frontend-designer: T015 logo marquee DONE in tree (src/components/ui/EngineStrip*.tsx, public/logos), not yet browser-checked.
  - research agents writing docs/MARKET_RESEARCH_3_FULL.md and docs/CONVERSION_RESEARCH.md.
- **Queue after the engine reports:** UI for AI insights + new checks + export buttons (frontend-designer); privacy/copy update for LLM use (content-seo); conversion features from CONVERSION_RESEARCH.md (instant quote, per-issue "fix this for me", sample report, methodology page); backlog gaps (platform-aware fixes, competitor comparison, re-audit diff needs DB); independent review; build; browser + Lighthouse; preview deploy; production deploy.
- **Founder actions:** NVIDIA_API_KEY in .env.local and Vercel (AI section stays off without it); optional DATABASE_URL, PAGESPEED_API_KEY, ADMIN_PASSWORD.
- **Deploy rule:** production deploy was approved for v1 at 23:40; founder then asked for the complete product by 12:30, so v1.1 goes to preview first and to production after browser + Lighthouse checks pass.

## 2026-11-23 00:05 IST: LAUNCHED
- **Live:** https://seenhq.vercel.app. PageSpeed Insights mobile: / 96, /audit 99, /pricing 98, /about 99; A11y/BP/SEO 100. Launch report: docs/LAUNCH_REPORT.md.
- **Next (optional, founder):** DATABASE_URL, PAGESPEED_API_KEY, ADMIN_PASSWORD, email keys, custom domain (see launch report).

## 2026-11-23 ~00:30 IST: QA done, preview deployed
- **Preview:** https://noticr-7xbaexaql-ayushs-projects-32c1d225.vercel.app (Vercel Authentication on; open while logged in to Vercel). All routes 200, missing path 404. Real audit of vercel.com via the deployed API: 200 in 3.2 s; unlock 200 (seal secret works across instances).
- **Vercel env set (values never printed):** AUDIT_SEAL_SECRET, IP_HASH_SALT (preview + production), NEXT_PUBLIC_SITE_URL=https://seenhq.vercel.app (production).
- **QA (docs/QA.md):** no critical/high security issues. Placeholders replaced with neutral wording (founder decision). Lighthouse mobile local: A11y/BP/SEO 100 on all 8 pages, CLS 0; Performance 57-79 locally but this laptop benchmarks 670-800 and runs vary widely; measure on production with PageSpeed Insights after deploy.
- **Exact next step:** founder yes for production deploy (vercel deploy --prod), then smoke test production + PageSpeed Insights on seenhq.vercel.app, then launch report.
- **Founder optional env:** ADMIN_PASSWORD (enables /admin), PAGESPEED_API_KEY, DATABASE_URL (+ npm run db:migrate), RESEND_API_KEY/CONTACT_NOTIFY_EMAIL/MAIL_FROM.

## 2026-11-22 ~22:10 IST: feature-complete for v1 (pre-QA)
- **Done + pushed (d6f3a4c):** all pages, live audit flow verified end to end in the browser (python.org: 75, unlock works), R2 security/correctness fixes (engine 19, backend 6), 3 research-validated services (docs/MARKET_RESEARCH.md). Typecheck, lint, 339 tests, build green.
- **Exact next step:** QA pass (axe + keyboard + Lighthouse on all marketing pages, 360/768/1280/1920), then Vercel preview deploy (needs founder env vars), then launch report.
- **Open product decisions for founder:** India rupee pricing ladder (research option, not added); whether monitoring includes AI fact re-checks; Mona Lisa in hero; all [PLACEHOLDER] prices/contact/legal.
- **Known issues for launch report:** rate limit per-instance without DATABASE_URL (ADR-013); leads only logged without DATABASE_URL; Core Web Vitals "Not measured" without PAGESPEED_API_KEY.
- **Time left:** ~11.8 h to 10:00 freeze.

## 2026-11-22 ~20:30 IST: PAUSED (usage limit). Resume with "continue the noticr sprint"
- **Done + pushed:** all pages built (home, /audit flow, services, pricing, about, contact, privacy, terms, 404, design-preview), each independently reviewed and fixed. Typecheck, lint, 257 tests and `npm run build` green at this commit.
- **Was in flight when paused (may be partially applied in this commit or lost):**
  - audit-engine applying R2 findings 1-8, 12-18, 22-25 (docs/reviews/R2-engine-backend.md). Re-check each finding against the code; the 4 DoS ones (1-4) are the priority.
  - architect-backend applying R2 findings 9, 10, 11, 19, 20, 21 + rename contact honeypot field + derive service slugs from one list.
  - Market-gap research workflow (run id wf_878a229d-163). No result was read. Re-run or resume it, then add validated gaps as services (content-seo: services.ts/pricing.ts; backend: service slug list).
- **Exact next step:** git status; run typecheck/lint/test/build; finish R2 fixes; browser-check /audit (run a real audit end to end), /services, /pricing, /about, /contact, /privacy, /terms at 360/768/1280/1920; then market-gap services; then QA + Lighthouse; then Vercel preview deploy.
- **Small open items:** move sentence-length strings from src/components/audit/labels.ts and pricing/services page literals into src/content; founder decision on Mona Lisa eyes in hero.
- **Founder actions:** DATABASE_URL (leads not persisted without it), PAGESPEED_API_KEY (Core Web Vitals unavailable without it), AUDIT_SEAL_SECRET + IP_HASH_SALT + ADMIN_PASSWORD before deploy, legal review of privacy/terms, replace all [PLACEHOLDER] values.

## 2026-11-22 19:15 IST: Wave 1 mostly landed
- **Current phase:** Wave 1 → Wave 2 handoff
- **Done + pushed:** T002 audit engine (180 tests), T003 backend/API/admin (26 tests), T004 copy/SEO (39 tests) incl. review round R1 (28 verified findings applied, see docs/reviews/R1-content-seo.md).
- **In progress:** T001 design system + home (frontend-designer, uncommitted in working tree: src/components, globals.css, layout.tsx, public/images). Review workflow R2 (security + correctness of engine and backend) running.
- **Exact next step:** when T001 reports: npm run build, view / and /design-preview in the browser at 360/768/1280/1920, send visual feedback, commit. Then T005 (/audit UI) and T006 (remaining pages). Apply R2 findings via audit-engine / architect-backend.
- **Fable to-do:** create public/logo.png (512x512) once the wordmark exists (Organization JSON-LD points at it).
- **Blockers / founder actions:**
  - No database (founder: skip for now). Leads and contact messages are only logged.
  - PageSpeed Insights does not work without a key (Google returns 429). Core Web Vitals show "unavailable" until a free PAGESPEED_API_KEY is set.
  - Privacy policy and terms are drafts, not legal advice; need founder review.
- **Time left:** ~14.7 h to 10:00 freeze, ~17.2 h to 12:30 deadline.

## 2026-11-22 18:45 IST — Wave 1 running
- **Current phase:** Wave 1 (parallel build)
- **In progress:**
  - T001 design system + home — frontend-designer
  - T002 audit engine — audit-engine
  - T003 backend/API/admin — architect-backend
  - T004 copy/metadata/SEO files — content-seo
  All on `main` working tree with strict file ownership (no worktrees: node_modules copy on this machine takes >10 min). Fable commits each after review.
- **Exact next step:** review each agent's output as it lands → typecheck/lint/test/build → commit + push → launch T005 (audit UI) and T006 (pages) for frontend-designer; qa-security review of T002/T003.
- **Blockers:**
  - No database: founder chose "skip DB for now" (19:25). The build continues DB-optional. Leads/contacts are logged server-side only until `DATABASE_URL` is set. This is a launch-report known issue: leads are not persisted.
- **Time left:** ~14.7 h to 10:00 freeze, ~17 h to 12:30 deadline.

## 2026-11-22 18:40 IST — Phase 0 done
- Next.js 16.4.6 scaffold, TS strict, Tailwind v4, vitest, prettier, CI workflow, `.env.example`.
- Contracts: `src/lib/audit/types.ts`, `src/content/types.ts`. Docs: PLAN, ARCHITECTURE, DECISIONS (ADR-001..011), BACKLOG, task specs 001–006.
- 5 agents in `.claude/agents/`.
- Pushed to github.com/ayushman46/SEO `main` (initial commits; repo was empty).
- Founder decisions: Supabase free limit reached → no auth in v1 (ADR-011), plain Postgres (ADR-010); audience startups + local businesses, low prices.
