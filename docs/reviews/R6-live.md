# R6: live review of https://seenhq.vercel.app (T034)

Reviewer: qa-security. Date: 23 November 2026. Target: production, commit f436910 (main). Local branch loop/round-3 is the same code.
Method: real headless Chrome (the puppeteer-core bundled with Lighthouse 13.6.0), curl, Lighthouse 13.6.0, axe-core 4.14.0. I ran nothing against src/ and built nothing.
Scratch evidence is in `C:\Users\Ayush\AppData\Local\Temp\claude\11a785f75f0135c8\c76b4fba-778c-45c4-b713-c060e6b08433\scratchpad\r6\`, written below as `r6\`.

The home layout is frozen. Every home-page item below is a bug, copy, accessibility or performance item. None of them asks for a redesign.

## Findings (most severe first)

No critical or high findings.

| # | Sev | Page + viewport | Evidence | What is wrong | Exact fix | Owner |
|---|---|---|---|---|---|---|
| 1 | medium | `/`, mobile (Lighthouse) | `r6\lh\perf_home_*.json`, `r6\lhcal\perf_home_*.json` | **Home main-thread cost is out of line with the other pages.** On the same machine at the same moment, home TBT (median) is 1,760 ms vs /audit 346 ms at the default 4x CPU, and 906 ms vs 101 ms at a 2x CPU calibrated to this slow machine. The time sits in one ~0.5 to 1 s "Unattributable" task about 1.2 to 1.8 s into load: the first style and layout pass over a 1,236-element DOM, followed by hydration of 1yjuqmad91lry.js. The home HTML is 402 KiB (231 KiB of it RSC flight data); /pricing is 254 KiB with 812 tags. **What it is not:** Lenis is not in the initial chunks (it loads lazily); the always-on marquee costs about 60 ms of animation ticks in 10 s; the hero LCP image is preloaded with fetchpriority=high (load delay about 160 ms). CLS is 0. Removing CSS features one at a time (text-wrap, clip-path, engine strip, hero collage) gave no clear signal through this machine's noise. Only `content-visibility:auto` on the sections below the hero lowered TBT in both repetitions (1,648 / 1,545 ms vs baseline 1,397 / 3,278 ms). I could not get a PageSpeed Insights number: the keyless API returned 429 (daily quota). So the regression against PSI 98 is likely but not proven. | Smallest change that keeps the layout: in `src/app/(marketing)/page.tsx` (sections rendered from line ~30), give every section after `<Hero/>` and `<ProofAndEngines/>` the classes `[content-visibility:auto] [contain-intrinsic-size:auto_900px]` through a wrapper or className. Layout and visuals do not change; the first layout covers only the first screen. Before merging, check: anchor links into home (/#faq), the scroll-driven reveal animations, and that the sticky FAQ heading (`lg:sticky`) still sticks. Then re-measure on PSI with `PAGESPEED_API_KEY`. | frontend-designer |
| 2 | medium | `/audit` live flow, all viewports | `r6\flow\1280-full.png`, `r6\sheets\full_report.png` | **Two of the advertised outputs never appear on live.** The real audit of example.com returned Performance "not measured", with the notes "PageSpeed Insights quota was exceeded" and "AI reading wasn't available for this run". The home hero, /audit, llms.txt and the FAQ all promise "Google's own speed test" and "one AI model's reading". The report says so honestly, so nothing on the page is false, but every live audit delivers less than the copy promises. This is already on the founder's list in LAUNCH_REPORT.md. | Founder: add `PAGESPEED_API_KEY` and `NVIDIA_API_KEY` in Vercel and redeploy. No code change. | architect-backend (founder action) |
| 3 | low | `/`, all viewports | `r6\shots\360_home.png` (hero) | **The hero floor price is not true.** `src/content/home.ts:10` says "fix it at fixed prices from $149", but AI crawler unblock is a fix at $49 and /pricing's H1 says "Fixed prices from $19". | `src/content/home.ts:10`: "…Then we can fix it for you at a fixed price (a Fix sprint is $149 for up to 8 fixes), with no contract and before/after proof." Copy only, same length class; check the 40-word cap. | content-seo |
| 4 | low | `/` at 768, 1024, 1280, 1920 (service cards); also `/` at 360 | `r6\shots\1280_home.png` (second card row), `r6\sheets\1024_home_0.png` | **Price rows in the service cards are misaligned.** In the card row Monitoring / AI fact-check / Local AI / AI crawler unblock, the Local AI card puts "per location" on a second line, so its rule and "$99" sit about 18 px higher than "$19/month", "$59" and "$49". Same in the 2-column grid at 1024 to 1279 and at 768. | `src/components/home/Sections.tsx:161`: change `flex flex-col gap-1.5` to `flex flex-wrap items-baseline gap-x-1.5 gap-y-1`, so the qualifier sits inline after the price ("$99 per location"). Or give every card a reserved qualifier line: `min-h-[1.25rem]` on the span at line 173, always rendered. | frontend-designer |
| 5 | low | `/pricing#india-pricing`, 360 and 1280 | `r6\sheets\inr_crop.png`, `r6\shots\360_pricing-inr.png` | **A blue 2 px focus ring frames the whole rupee panel on load.** Arriving at the hash makes Chrome focus the `tabIndex={-1}` panel (it is the fragment target; I confirmed activeElement = `#india-pricing` and the outline is solid rgb(30,123,245) 2px). Mouse and link users see what looks like a selection box around the price table. | `src/components/pages/CurrencySwitch.tsx:183`: add `focus-visible:outline-none` to the panel className. The panel has tabIndex -1, so keyboard Tab never lands on it, and the tabs keep their own ring (line 155). | frontend-designer |
| 6 | low | home vs inner pages | `r6\sheets\1280_home_1.png` vs `r6\sheets\1280_pricing_0.png` | **Two small visual differences between home and inner pages.** (a) FAQ marker: the home FAQ uses circled "+" (`marker="circle"`, `Sections.tsx:300`) while /pricing and the DocBody FAQs use a bare "+" (Accordion default `marker = "plus"`, `Accordion.tsx:68`). (b) Price type: home service cards show prices in bold sans (`Sections.tsx:165`, `font-semibold`), but /services, /pricing and the home pricing teaser use the serif display price. Nav, buttons, kickers, footer, colours and the paper/sky treatment match everywhere, so it still reads as one site. | Without touching home: (a) pass `marker="circle"` in `src/app/(marketing)/pricing/page.tsx` and `src/components/pages/DocBody.tsx` (or change the Accordion default at `Accordion.tsx:68` to "circle"). (b) Leave as is; it is the frozen home card style. Noted only. | frontend-designer |
| 7 | low | `/about`, all | `r6\sheets\360_inner_a.png` | **Final CTA headings differ in punctuation.** /about's closing card reads "See how your site looks to search and AI" with no full stop (`src/content/about.ts:31`); the home final CTA has the full stop (`src/content/home.ts:251`). | Add the full stop at `src/content/about.ts:31`. | content-seo |
| 8 | low | 404, all | `r6\html\404.html` | **Conflicting robots meta on the 404 page.** The 404 page emits `<meta name="robots" content="noindex">` and also the root `robots` "index, follow" plus `googlebot` "index, follow, max-image-preview:large, max-snippet:-1". Google applies the most restrictive rule and the status is 404, so this does no harm in practice. | `src/lib/seo/metadata.ts:116-120`: drop the `googleBot` sub-object and put `"max-image-preview": "large", "max-snippet": -1` on `robots` itself. Optionally give `src/app/not-found.tsx` its own title ("Page not found · noticr"); it currently reuses the home title and description. | content-seo |
| 9 | low (known) | `POST /api/audit` | curl | **No rate-limit headers on successful responses.** Only the 429 carries `Retry-After`; 200 responses have no `RateLimit-*` headers. The limiter is per instance in memory because production has no `DATABASE_URL` (documented in ADR-013). | Nothing new. Setting `DATABASE_URL` makes it shared. Optional: add `RateLimit-Limit/Remaining` on 200 from `limited.remaining` in `src/app/api/audit/route.ts:110`. | architect-backend |

Not reported as defects (checked, they are fine or intentional):
- Full-page screenshots show the fixed nav, the skip link and the tray in mid-page. That is how a full-page capture draws fixed elements, not overlap in use.
- At 360x740 the hero URL form sits below the first screen (hero collage clamp 27-44rem). This is the frozen v1.1 layout, so I did not raise it.
- At 1024 with reduced motion, the static engine row wraps "Bing" onto a second line by itself. It is centred and readable; it is a cosmetic orphan only.
- `Access-Control-Allow-Origin: *` on HTML is Vercel's default for prerendered pages. There are no credentials involved, so no risk.

## Measured numbers

### Lighthouse mobile, live, 3 runs each, default throttling (4x CPU, slow 4G)

| Page | Perf runs | Perf median | LCP ms | TBT ms | CLS | benchmarkIndex |
|---|---|---|---|---|---|---|
| / | 60, 68, 67 | **67** | 2,922 | 1,760 | 0 | 765, 774, 672 |
| /pricing | 71, 81, 79 | **79** | 2,864 | 610 | 0 | 1776, 814, 842 |
| /sample-report | 67, 60, 62 | **62** | 3,168 | 1,524 | 0 | 722, 772, 703 |
| /audit | 83, 91, 80 | **83** | 2,434 | 346 | 0 | 819, 774, 534 |

**Noise:** benchmarkIndex was mostly 534 to 842, which is roughly half of typical desktop hardware and of PSI's servers. One run measured 1,776, so the machine load was changing during the session. With 4x throttling on top, absolute scores here run well below PSI. For example, /audit scores 83 here against 99 on PSI.

### Calibrated runs (2x CPU, about PSI-equivalent on this machine), 3 runs each

| Page | Perf runs | Median | LCP | TBT |
|---|---|---|---|---|
| / | 71, 96, 75 | **75** | 2,555 | 906 |
| /audit | 96, 98, 93 | **96** | 2,446 | 101 |
| /pricing | 79, 85, 83 | **83** | 2,844 | 485 |
| /sample-report | 73, 83, 86 | **83** | 2,993 | 454 |

Home scored 96 in the one run where the machine was quiet (benchmarkIndex 1,736).

**Comparison with LAUNCH_REPORT v1.1 PSI** (/ 98, /audit 99, /sample-report 96): /audit agrees (96 to 99). Home is now the outlier: 9x the TBT of /audit at equal settings, where in round 5 (T026 home, local) the ratio was about 2.8x. See finding 1. I could not get a PSI cross-check because the keyless quota was exhausted (HTTP 429).

### Accessibility
- Lighthouse accessibility, best practices and SEO: **100 / 100 / 100 on all 11 routes at mobile and at desktop**. The 404 cannot be run in Lighthouse (status 404 refuses it); axe covers it.
- axe-core 4.14.0 (wcag2a/aa, 21a/aa, 22aa, best-practice) at 360 and 1280 on 12 routes, plus states (mobile menu open, INR panel, sample report with all details open and the tray showing): **0 violations everywhere**. 28 to 179 contrast items per page came back "incomplete" because text sits on the paper-grain and image backgrounds that axe cannot resolve. That is the same pattern verified pixel-by-pixel in R5.

### Live flow (one real audit of https://example.com at 1280)
- POST /api/audit returned 200 in about 9.5 s, `cache-control: no-store`. The partial report showed the new front page (Report for, 52 overall, SEO 56, GEO 47, Performance "not measured", Fix first top 3, "Your quote", 17 more issues, gate).
- "Add to my fix list" changed to "On my fix list". The tray read "1 issue picked · $149 · One Fix sprint covers up to 8 of these for $149".
- Unlock with qa-test@noticr.test returned **200** with the full result. Nothing in the response mentions storage; production has no `DATABASE_URL`.
- Full report: 20 issues, collapsed by default (only the one on the fix list was open). "Copy as developer tickets" and "Copy as one prompt for a coding agent" both put real Markdown on the clipboard. "Download .md" produced `noticr-example.com-tickets.md`. Quote "From $248" = $149 Fix sprint + from $99 Content & entity.
- Tray "Request this fix" went to `/contact?service=technical-fixes`. The quote box showed Fix sprint $149 / Total $149 / taxes line. Website was prefilled as `https://example.com/`, service was Fix sprint, and the message was prefilled. I did not submit the form.
- No console errors and no page errors during the flow.

### Keyboard and motion (home, 1280 and 360, motion on and off)
- The skip link is the first Tab stop, sits on top (z-index 100, hit-tested) and lands on #main; the next Tab goes to the URL field.
- Tab order is logical: nav, URL form, the two links, marquee pause button, source link, the tablist (one stop), the tabpanel, then CTAs, the 8 service cards, the 8 FAQ summaries, the final form and the footer.
- Tabs: ArrowRight moves focus and selection (SEO to GEO), and End and Home work.
- The marquee pause button responds to Enter: animation-play-state becomes paused and the label becomes "Play scrolling logos".
- FAQ summaries open with Enter.
- URL form with an invalid value: aria-invalid=true, the error is linked through aria-describedby, and focus stays on the field.
- The URL input's ring is drawn on its wrapper (visible: `r6\flow\kbd-input.png`).
- Tray on /sample-report: 361 stops at 360 (reduced and normal motion) and at 1280. **0 focus stops fully or partly behind the tray.** The 3 "off-screen" readings at 360 with motion did not reproduce on a second pass with 2 s waits; the only off-screen stop was the wrap to `<body>` after the last footer link.
- Reduced motion: Lenis off (no `lenis` class), the marquee is static (`animation: none`) and its pause button is hidden, and reveals are settled.

### Security headers and behaviour (live, `/`)
- CSP: `default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; … object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`. 'unsafe-inline' in script-src is a known Next.js inline-bootstrap trade-off.
- Other headers: HSTS `max-age=63072000; includeSubDomains`; `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY`; `Referrer-Policy: strict-origin-when-cross-origin`; Permissions-Policy set.
- `/admin` and `/admin/login` return 404.
- `POST /api/audit`: 422 `blocked_host` for 169.254.169.254, localhost, 127.0.0.1, [::1], 0x7f000001, 2130706433, [::ffff:169.254.169.254] and 10.0.0.1. 400 `invalid_url` for :8080, file: and javascript:. These match docs/QA.md.
- Client bundles (21 chunks, 1.1 MB): no secrets. The only `NEXT_PUBLIC_` value is `NEXT_PUBLIC_SITE_URL`.

## What passed

- **Prices identical everywhere** (/, /pricing USD and INR, /services, the /sample-report quote, JSON-LD offers, llms.txt): Full audit $39 / ₹2,999; Fix sprint $149 for up to 8 fixes, larger jobs from $249 / ₹17,999; Monitoring $19/month / ₹999; AI fact-check $59 / ₹3,999; Local AI $99 per location / ₹3,999 per location; AI crawler unblock $49 / ₹2,999; Content & entity from $99 / from ₹6,999. Exception: the hero "from $149" (finding 3).
- No old prices ($199, $29, $79) and no "50 pages". Scope is "up to 15 pages" and "up to 8 fixes" everywhere. Free audit scope is "homepage and up to five more pages" / "six pages" everywhere, including /bot and llms.txt.
- Reply time is "two working days" on /about, /contact (twice), /pricing and the /sample-report quote. No other reply-time claims exist.
- Canonical and og:url on every page use https://seenhq.vercel.app. No "localhost" anywhere in the 12 HTML documents, sitemap.xml (11 URLs), robots.txt or llms.txt.
- All JSON-LD blocks parse.
- Every internal link and #anchor in the 12 pages resolves, including the 8 /services#slug anchors. External links (OneCity, BrightLocal) return 200.
- Titles are 41 to 60 characters and descriptions 133 to 153 on all 11 routes.
- No horizontal overflow (scrollWidth equals viewport width) on any of the 13 page states at 360, 768, 1024, 1100, 1280 or 1920.
- Restored home sections: the tabs bar fits at 360; the 8 service cards run 4 columns at 1280 and above and 2 columns at 768 to 1279 with equal-height rows; the pricing teaser prices are correct; the FAQ (8 items) is fine; the marquee runs at all widths and pauses on button, hover and focus-within.
- **Home vs inner pages:** same floating nav pill, same Contact and Free audit buttons, same pill buttons and link-arrow style, same serif display and sans body type, same kicker style, same paper and torn-edge treatment, same footer. They feel like one site; the only differences are finding 6.
