# R5: design, accessibility and regression QA after the redesign (T029)

Date: 2026-11-23. Reviewer: qa-security. Target: the production build already running at http://localhost:3210 (commit 13f3c91, docs-only eb2fe8d on top; not rebuilt). Read-only for `src/**`.

How: real rendering in headless Chrome 157 (puppeteer-core from the cached Lighthouse 13.6.0), full-page screenshots at 360x740, 768x1024, 1280x800 and 1920x1080 on `/ /audit /services /pricing /about /contact /methodology /bot /sample-report /privacy` and a 404, scripted keyboard / wheel / touch checks, axe-core 4.14.0 (bundled with Lighthouse, injected into the page) and Lighthouse 13.6.0.

Scratchpad (scripts, screenshots, Lighthouse JSON) is `C:\Users\Ayush\AppData\Local\Temp\claude\11a785f75f0135c8\c76b4fba-778c-45c4-b713-c060e6b08433\scratchpad\r5\`, written `SP\` below. Full-page shots: `SP\shots\<width>_<page>.png` (44 files). Contact sheets for reading them: `SP\sheets\`. Lighthouse runs: `SP\lh\`.

**Working tree warning.** While this review ran, other agents (T030 copy, T031 wiring) had uncommitted edits in 19 files under `src/components` / `src/app` and 10 under `src/content`. Screenshots and runtime checks describe the committed build on :3210. File:line references are against `HEAD`. One of those uncommitted edits breaks `npm run typecheck` (finding 1).

Severity: **critical** = blocks production deploy; **high** = fix before deploy; **medium** = fix soon; **low** = polish. **No critical findings.** The committed tree is green.

## Findings

| # | Sev | Page + viewport | Screenshot | What is wrong | Exact fix | Owner |
|---|-----|-----------------|------------|---------------|-----------|-------|
| 1 | high | repo (working tree, not HEAD) | n/a | `npm run typecheck` fails: `src/components/audit/AuditSteps.tsx(12,23): Property 'kicker' does not exist` on `home.howItWorks`. The uncommitted T030 edit to `src/content/home.ts` dropped `howItWorks.kicker`, and `AuditSteps.tsx:12` still renders it (it is the "HOW IT WORKS" label on /audit). HEAD typechecks clean (checked in a `git archive HEAD` export). Not a deploy blocker for HEAD; it blocks committing T030/T031. | Either keep `howItWorks.kicker` in `src/content/home.ts` (and in `HomeContent` in `src/content/types.ts`), or give `AuditSteps.tsx:11-13` its own label from `src/content/audit.ts`. Re-run `npm run typecheck` before commit. | frontend-designer (T031) with content-seo (T030) |
| 2 | high | /audit result and /sample-report, 320 to 390 wide | `SP\tray-real-360-viewport.png`, `SP\tray-end-360.png` | The fix tray hides its own total on phones. Measured width of the "1 issue picked · $149" line: 31 px at 320, 69 px at 360, 99 px at 390 on a real audit (the line needs 146 px), so it reads "1 issue ..." / "Prices ex..."; on /sample-report (longer button label) the column is **0 px** at 320 and 360. The tray exists to show the running total. | `src/components/audit/quote/FixTray.tsx:34`: make the left column `min-w-0 flex-1` and keep the total visible (`whitespace-nowrap` on the `PriceText`, truncate only the tax line). Below `sm`, let the actions shrink: Clear as a 44 px icon button with `aria-label`, or stack the row (`max-sm:flex-wrap`, total on its own line). Re-check at 320 with T031's third line ("One Fix sprint covers…"). | frontend-designer |
| 3 | high | /sample-report and audit result, every width, tray open | `SP\tray-end-1280.png`, `SP\tray-end-360.png` | The fixed tray covers keyboard focus (WCAG 2.2 SC 2.4.11 Focus Not Obscured, AA). Tabbing through /sample-report with one item picked: at 1280, 6 of 147 Tab stops end **fully** behind the tray and 22 partly (for example "All issues 18", "Copy as developer tickets", "Covers 1 issue", the `/contact/` page link). At 360 with a fine pointer: 7 fully, 22 partly. At the page end the last footer lines sit under the tray (last text bottom 760 vs tray top 739 at 1280; 700 vs 679 at 360), because the `h-24` spacer is inside the report, above the footer. | `src/app/globals.css:195-197`: in `html:has([data-fix-tray])` add `scroll-padding-bottom: calc(var(--fix-tray-h) + 0.75rem);` and `body { padding-bottom: var(--fix-tray-h); }`; then drop the spacer at `FixTray.tsx:25`. Set `--fix-tray-h` from the measured tray height (ResizeObserver in FixTray) instead of the fixed `5.25rem`; T031 adds a third line, so the tray gets taller. | frontend-designer |
| 4 | medium | /sample-report and audit result, below lg (360, 768) | `SP\chipjump-360.png` | Jumping from the sticky chip row hides the target heading under the chip row. "Core Web Vitals" lands at top 114 px; the chip row ends at 136 px, so the heading is fully covered. The row itself sits correctly below the floating nav (chip top 80, nav bottom 74). | `src/components/audit/FullReport.tsx:25` (`SubHeading` h4), `:279` (group h5) and `:317` (`#export` div): add `scroll-mt-14 lg:scroll-mt-0`. The chip row is 56 px; `html` `scroll-padding-top` covers only the nav. | frontend-designer |
| 5 | medium | /sample-report 1280 and 1920; /services 1280 | `SP\crop_navfrag_1280.png`, `SP\shots\1920_sample-report.png` | The page-hero fragment collides with the floating nav. The gold cloth on /sample-report (compact strip) tucks under the "Contact" and "Free audit" pills. The marble head on /services has its top under "Contact". At 360 the /sample-report cloth touches the menu button. | `src/components/pages/PageHero.tsx:147`: anchor the fragment below the nav, not from the strip bottom. For example `top-[calc(var(--nav-h)+0.5rem)]`, with a height cap of `max-h-[calc(100%-var(--nav-h)-1rem)]` for compact strips. Or put right-side motifs on the left under the logo pill, which is narrower. | frontend-designer |
| 6 | medium | / at 360 ("What you get" preview card) | `SP\sheets\360_home_s1.png` | The locked teaser rows squeeze the title into a column about 60 px wide. "No / Organization / or / LocalBusiness / schema" reads one word per line, with the chips beside it. The "Largest Contentful Paint is 3.9 s on mobile" row wraps into 3 lines next to the badge. Unlocked rows wrap their meta onto a second line and look fine. | `src/components/ui/IssueRow.tsx:59`: give the title a flex basis, `"min-w-0 flex-1 basis-[11rem] …"`, so the meta group wraps below it on narrow cards. | frontend-designer |
| 7 | medium | /pricing 360, 768 (stacked) and 1280 (4 columns) | `SP\sheets\360_pricing_s0.png`, `SP\sheets\768_pricing_s0.png`, `SP\shots\1280_pricing.png` | Rate card rhythm. (a) The fixed `h-[5.5rem]` price block exists to align figures across columns, but when columns stack it leaves a blank band of about 60 px between "Free audit" / "Fix sprint" / "Monitoring" and the price. (b) At 1280 the figures align, but descriptions of 3 vs 4 lines push the hairline and the first feature down about 18 px in two columns, so the rows below the price are not on one baseline. (c) `min-w-[4ch]` on the figure puts "$0" far from "per audit". | `src/components/pages/PricingCard.tsx:73`: `mt-3 xl:mt-5 xl:h-[5.5rem]` (fixed height only where columns sit side by side). `:85-87`: align the description and rule with CSS subgrid: `article` as `grid grid-rows-subgrid row-span-5` inside `ul.grid xl:grid-cols-4`, at `pricing/page.tsx:41`. Or set `xl:min-h-[4lh]` on the description. `:78`: drop `min-w-[4ch]`. | frontend-designer |
| 8 | low | / night-sky section, 360 and 1920 | `SP\crop_night_360.png` | Stars land inside the body copy and read as stray punctuation ("an AI˙ assistant", "already. chosen", "sources'"). | `src/components/home/NightSky.tsx:93` (`<Stars />`): keep a star-free zone behind the text column. Either a `mask-image` on the stars layer that is transparent over the left `max-w-2xl` copy block, or skip star positions inside that rect. | frontend-designer |
| 9 | low | /pricing, /services, /about, /methodology, /bot, /privacy at 1024+ | `SP\shots\1280_pricing.png`, `SP\combo1280b.png` | The "LAST UPDATED 23 NOVEMBER 2026" dateline floats mid-page (x about 500 of 1280). It is right-aligned inside `max-w-4xl`, so it lines up with neither the title nor the container edge. | `src/components/pages/PageHero.tsx:175`: drop `max-w-4xl` from the kicker `<p>` (aligns to the container edge), or drop `justify-between` and render it after the kicker with a `·`. | frontend-designer |
| 10 | low | /audit 360 | `SP\combo360a.png` (first column) | "Last updated 23 November 2026 ·" wraps, and the separator dot is left dangling at the end of the line. | `src/components/audit/AuditHero.tsx:74`: render the dot only from `sm` (`max-sm:hidden`), or replace it with `gap-x-3` alone. | frontend-designer |
| 11 | low | / services index at 360, 768, 1280; /services | `SP\sheets\768_home_s0.png` | "Included in the Full audit · $39" wraps with "· $39" orphaned on its own line (`max-w-[22ch]`). | `src/components/home/Sections.tsx:159`: `max-w-[28ch]`, or wrap "· $39" in `whitespace-nowrap`. Same string in `ServiceBlock.tsx:36`. | frontend-designer |
| 12 | low | /sample-report, every width | `SP\sheets\768_sample-report_s0.png` | 9 issues show "Up to +0 pts" (impacts 0.2 to 0.4 round to 0). | `src/components/audit/IssueCard.tsx:114-117`. **Already being fixed** in the uncommitted T031 work ("Under +1 pt"); verify after rebuild. | frontend-designer |
| 13 | low | /bot, /methodology at 360 | `SP\sheets\360_bot_s0.png` (column 2) | Double hairline: a section that ends with a definition list draws the list's last `border-b`, then 48 px later the next section's `border-t`. | `src/components/pages/DocBody.tsx:35`: add `last:border-b-0` to the row. | frontend-designer |
| 14 | low | /sample-report, audit result | n/a (accessibility tree) | The issue `<summary>` name reads metadata before the title: "Medium SEO Quick fix Estimated overall score gain: Up to +2 pts Pages are missing a meta description". Screen-reader users hear four chips before the issue. | `src/components/audit/IssueCard.tsx:107`: give the title `<H>` an id and set `aria-labelledby="<titleId> <metaId>"` on the summary. Or put the title first in DOM order and move the chip row visually with `order-first`. | frontend-designer |
| 15 | low | /contact after the tray hand-off | `SP\contact-handoff-1280.png` | The quote, `audit_id` and `audit_url` arrive (hidden fields plus the "Your quote" panel), but the visible "Website" field stays empty. | `src/components/contact/ContactForm.tsx:432`: default `website` to the stored quote's `audit_url` when present. | frontend-designer |
| 16 | low | / mobile, JS weight | n/a | The +28 KB on home is not first-party growth. It is Next.js viewport prefetch of the /sample-report route (details under Measured numbers). Separately, the home client chunk carries all of `src/content/audit.ts` (8.0 KB raw, 3.5 KB gzip) because `AuditUrlForm` imports `auditForm` from it. | Optional: `prefetch={false}` on the hero "See a sample report" link (`src/components/home/Hero.tsx:47`) if first-load bytes matter more than that navigation. Move `auditForm` into its own module (for example `src/content/audit-form.ts`) so the home island does not ship the report copy. | frontend-designer |
| 17 | low | /sample-report, every width | `SP\sheets\768_sample-report_s0.png` | The "Sample report" badge is blue over the front page and green over "Full report". Two tones for the same label. | Use one tone (FullReport badge `tone="pass"` vs the front-page badge). | frontend-designer |

Checked and **not** defects:
- The 360 full-page shot shows the moon over the word "before" in the night-sky heading. In a real viewport scroll, with and without reduced motion, the moon stays above the heading (0 overlapping line boxes at 4 scroll offsets). The overlap is a full-page-capture artifact of the parallax.
- `SP\shots\360_sample-report.png` repeats the top of the page after about 16,384 px. That is Chrome's capture limit; the page is 20,188 px tall at 360.
- The home URL field has `outline: none`, but its wrapper draws a 2 px accent ring on `:focus-visible` (`AuditUrlForm.tsx:80`).
- Native `<dialog>` lets Tab move from the last menu item to the browser UI. Focus never reached page content behind the menu.

## Measured numbers

### Lighthouse 13.6.0, mobile, 3 runs each, median (all runs: Perf / TBT ms / LCP ms)

| Page | Perf | TBT ms | LCP ms | CLS | A11y / BP / SEO | All runs |
|---|---|---|---|---|---|---|
| `/` | 57 | 2264 | 4026 | 0 | 100 / 100 / 100 | 60/1700/3905, 57/2605/4026, 57/2264/4042 |
| `/pricing` | 73 | 683 | 3635 | 0 | 100 / 100 / 100 | 88/491/1155, 62/1535/3829, 73/683/3635 |
| `/sample-report` | 60 | 1491 | 4054 | 0 | 100 / 100 / 100 | 59/1491/4131, 60/1618/4043, 66/890/4054 |
| `/audit` | 72 | 816 | 3527 | 0 | 100 / 100 / 100 | 72/782/3558, 62/2753/3266, 72/816/3527 |

Comparison:
- `docs/lighthouse/m_*.json` (2026-11-22): home, pricing and sample-report are accessibility / best-practices / SEO only (all 100, unchanged). `m_audit.json` has Perf 73 against 72 now.
- The previous agent's T026 "after" medians on this same code (`scratchpad\lh2-t026after.json`): `/` 67 / 775 / 3881, `/pricing` 81 / 410 / 3574, `/sample-report` 67 / 787 / 4031.
- Today's TBT is 1.5x to 3x higher for the same JS. That is the machine, not the code (see reliability).

**Reliability.** Poor for Performance and TBT on this machine:
- Lighthouse's CPU benchmark index swung from 466 to 806 across these 12 runs, and every run warned that the CPU is slower than Lighthouse expects. 8 node and 10 Chrome processes from other agents were running.
- Identical runs differ by up to 26 points (`/pricing` 62 to 88).
- LCP and CLS are stable (CLS 0 on every run).
- Use these numbers only as a relative check. Confirm `/` and `/sample-report` with PageSpeed Insights on the Vercel preview before judging the 95+ target: all four pages are well below 95 here, and `/` and `/sample-report` were below 70 in every run today and in T026.

### Home JS transfer, 246 KB: where it comes from

Lighthouse network log, `SP\lh\perf_home_1.json`. Transfer bytes, compressed.
- **246,214 B total, of which 166,308 B is the page itself.** That is 9 scripts in the HTML: `3iz8_hoapa1o_` 72.8 KB (React DOM, 1.0 s of bootup), `1hy9p0hfrq0w2` 46.4 KB (Next runtime), `3t-wkfok3i6w6` 15.2 KB (the home client island: AuditUrlForm, tabs, engine strip toggle, plus all of `content/audit.ts`), and 6 small framework chunks.
- **79,906 B is Next.js `<Link>` viewport prefetch**, requested at about 1.43 s, after load:
  - the /audit route: `415dondmdiky8` 25.3 KB, `13dqhqxixhs85` 14.2 KB, `1ebn6lmmwei67` 13.7 KB;
  - the /sample-report route: `1vud40qer9yi3` 14.0 KB, `1ppfhuok5-5bl` 12.6 KB.
- **Why it rose from 218,082 to 246,214 B (+28.1 KB).** The /sample-report prefetch (26.6 KB) accounts for almost all of it. In Lighthouse's 412x823 viewport, the hero "See a sample report" link now sits at y = 753, inside the fold, so Next prefetches that route on load. 13f3c91 tightened the hero (`mt-5` to `mt-4`, `mt-7` to `mt-6`) and changed `HeroCollage`. `/pricing` went the other way (244.8 to 229.2 KB), consistent with a prefetch shift rather than bigger shared chunks.
- **Caveat:** I could not rebuild the old commit (build forbidden), so this attribution comes from byte arithmetic plus the measured link position, not from a build diff. Confidence: moderately high.
- The prefetched chunks download after load and do not run until navigation. They do not affect LCP. Home TBT is dominated by React DOM and "Unattributable" main-thread work.

### Smooth scroll, Lighthouse timespan, real wheel input, desktop 1350x940, 1x CPU, Lenis active (2 runs each)

| Page | TBT | CLS | Long tasks | Frames | p50 / p95 frame ms | Frames > 33 ms | Main thread ms (other / script / style / paint) |
|---|---|---|---|---|---|---|---|
| `/` run 1 | 0 | 0 | 0 | 448 | 16.7 / 16.8 | 7 | 2269 (954 / 454 / 383 / 478) |
| `/` run 2 | 0 | 0 | 0 | 462 | 16.7 / 16.9 | 7 | 2388 (985 / 478 / 411 / 513) |
| `/sample-report` run 1 | 0 | 0 | 0 | 468 | 16.7 / 16.8 | 4 | 1414 (554 / 440 / 40 / 378) |
| `/sample-report` run 2 | 0 | 0 | 0 | 466 | 16.7 / 16.8 | 5 | 1361 (536 / 418 / 39 / 368) |

Reliability:
- Good for "does it hold the frame budget at 1x": the two runs agree, and both pages ended exactly at the bottom (`scrollY = max`).
- The frame figures are rAF intervals in headless Chrome without a GPU. They measure main-thread scheduling, not what a real compositor shows.
- The 4 to 7 frames over 33 ms (about 1.5%) cluster at glide start and stop.
- They say nothing about weak laptops (the earlier 4x runs in `docs/SCROLL_PERF.md` still apply) or phones (Lenis does not load there).

### Accessibility

- **Lighthouse accessibility, mobile:** 100 on all 10 routes. The 404 cannot be scored: Lighthouse refuses non-200 documents, so axe covers it.
- **axe-core 4.14.0, injected, WCAG 2.0 / 2.1 / 2.2 A and AA plus best-practice, at 360 and 1280:** **0 violations** on all 11 routes. Also 0 with the mobile menu open, with the INR rate card shown, and with every `<details>` on /sample-report open plus the tray shown.
- **Contrast, computed by script.** axe leaves many contrast checks "incomplete" because of the paper grain and photo backgrounds, so I computed solid-colour contrast for every text node on 7 pages (grain ignored). Lowest pairs: white on the primary blue button 4.68:1, severity chips 4.89:1, `text-accent-ink` links 5.72:1, the de-blued `text-ink-2` / muted text on paper 6.01:1 and up. All pass AA.
- **Focus ring.** `rgb(30,123,245)`, 2 px with a 2 px offset, on the currency tabs, the issue summaries and buttons. That is about 3.4:1 on paper and 4.0:1 on white, so it passes the 3:1 non-text rule.
- **Heading order:** no skipped levels and exactly one `<h1>` on every route at every width.
- **Landmarks:** the sticky chip row is a `<nav aria-label="Full report">` (the lg rail has the same name and only one is rendered at a time). The tray is a `<section>` named "Your fix list". Changes are announced through a polite `role="status"` live region ("Added … to your fix list. 1 issue, $149.").

## What passed

**Commands**

| Command | Working tree (with others' uncommitted edits) | HEAD (13f3c91/eb2fe8d, exported) |
|---|---|---|
| `npm run typecheck` | **FAIL** (finding 1) | PASS |
| `npm run lint` | PASS | PASS |
| `npx vitest run` | PASS, 40 files / 721 tests | PASS, 40 files / 711 tests |

**Routes and API**
- `curl`: 200 for `/ /audit /services /pricing /about /contact /methodology /bot /sample-report /privacy /terms /llms.txt /robots.txt /sitemap.xml`; 404 for `/no-such-page-r5`.
- Security headers present on `/`: CSP with `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, Permissions-Policy.
- `POST /api/audit {"url":"https://example.com"}` returned 200 in 1.05 s, as `{partial, sealed}`.
  - `partial` has `id, finalUrl, hostname, scores{overall 52, seo 56, geo 47, performance null}, pagesScanned 1, issueCounts{0/1/9/10}, topIssues(3), lockedIssues, checks, durationMs, truncated, ai`.
  - The 3 top issues carry `description/howToFix/effort/impact/affectedUrls`. Locked issues carry only `id/title/severity/category`, so no fixes leak before unlock.
  - `performance` and `ai` are null because no PageSpeed or model key is set locally.

**Layout**
- No horizontal overflow (`scrollWidth == innerWidth`) on any of the 11 routes at 360, 768, 1280 or 1920.
- No element wider than the viewport outside a clipping or scrolling ancestor. The only hit is the off-screen contact honeypot, which is intentional.

**Interaction (headless, scripted)**
- Mobile menu (360, touch): opens with Enter, focus moves inside, Tab stays inside the modal `<dialog>`, Escape closes and returns focus to "Open menu", a menu link navigates and closes the menu.
- Home tabs: ArrowRight, End and Home move focus and selection together, with roving tabindex (`-1,0,-1,-1`) and the panel shown.
- /pricing currency switch (text tabs): arrows swap the USD and INR panels, focus follows, the hash updates to `#india-pricing`, the page does not jump, and the focus ring is visible.
- Issue `<details>`: Enter opens and Space closes, with a visible 2 px focus ring on the summary.
- Copy buttons: per-issue "Copy" writes the clipboard and announces "Copied". "Copy as developer tickets" copies 20,591 chars; "Copy as one prompt" copies 16,549 chars.
- Tray hand-off on a real example.com audit:
  - "Have us fix this · $149" toggles `aria-pressed` and shows the tray.
  - "Request this fix" goes to `/contact?service=technical-fixes`.
  - The service is preselected, the "Your quote" panel shows "Technical fix sprint … $149, Total $149", and hidden `quote_*`, `audit_id` and `audit_url` fields are set.
  - On /sample-report the tray button leads to /audit by design.
- Skip link: visible on the first Tab, Enter moves focus to `<main id="main">`, and the next Tab is the first control in main.
- In-page nav (1280): every link on /methodology (7), /bot (7), /privacy (9) and /sample-report (7) lands its heading 96 to 137 px from the top, below the floating nav. /about has no in-page nav.
- Eye blink: 2 lid animations once on URL-field focus, none while typing, again on a new focus. Zero animations and no Lenis under `prefers-reduced-motion: reduce`.

**Smooth scroll**
- Lenis loads with a fine pointer at 1280 and does not load with touch emulation or reduced motion.
- A wheel notch glides (scrollY 143 after 60 ms, 300 at rest).
- Space, PageDown (616 px each), ArrowDown (40 px), End and Home all scroll.
- No scroll trap at the bottom (a wheel up responds at once, 6703 to 6463) or at the top.
- Nested scrollers scroll themselves, not the page: the code `<pre>` on /sample-report at 1280, the chip row `<ul>` at 360, and the user-agent `<pre>` on /bot at 360.
- Back after a wheel glide and a navigation restores the exact position (1800 to 1800); Forward lands at the top.
- With smooth CSS scrolling, Tab keeps the focused element in view at 360 on /, /privacy and /sample-report (0 to 2 of 60 stops caught mid-animation, 0 with reduced motion).

**Visual: looked at and fine**
- Hero on all 4 widths: no clipped text or widows in display headings.
- The report front page at 360: score, "In good shape…" verdict, four sub-scores, "Fix first" list.
- Collapsed issue cards, services index, /services detail pages, /methodology tables, /contact form, /about, the 404, footer.
- Section rhythm is even apart from finding 7.
