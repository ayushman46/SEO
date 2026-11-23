# Scroll performance (T025)

What smooth scrolling and the scroll-linked polish cost, measured on 2026-11-23 against local production builds (`npm run build` + `npx next start -p 3311`) with headless Chrome 157. This laptop is noisy (earlier QA measured mobile Performance anywhere from 57 to 79 on the same page), so every Lighthouse figure is the **median of 3 runs**, and all runs are listed. Lighthouse cannot judge feel or real-GPU frame rate; that needs a real browser (see the end of this page).

## What was measured

- **Before:** the committed tree (commit at HEAD, before any T025 change; `lenis` installed but not imported).
- **After:** the T025 tree. Note: content-seo was rewriting copy in `src/content/**` while these runs were made, so the "after" pages also carry some copy changes. That is a confound for small differences.
- Tools: Lighthouse 13.6.0 Node API (from the npx cache), `chrome-launcher`, and the `puppeteer-core` that ships inside Lighthouse (not a project dependency). Scripts are reproduced at the end.

## 1. Page load (Lighthouse navigation, median of 3)

| Page | Form factor | Perf before → after | TBT ms | CLS | Main thread ms | "Other" ms | Script eval ms | JS transferred |
|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 63 → 58 | 1070 → 1959 | 0 → 0 | 4521 → 5622 | 1579 → 2339 | 1222 → 1350 | 215.7 → 218.1 KB |
| `/` | desktop | 75 → 86 | 556 → 292 | 0 → 0 | 1716 → 1460 | 778 → 581 | 449 → 399 | 284.1 → 295.8 KB |
| `/methodology` | mobile | 68 → 75 | 1341 → 732 | 0 → 0 | 3874 → 3231 | 1447 → 1082 | 1174 → 1081 | 249.5 → 252.7 KB |
| `/methodology` | desktop | 83 → 91 | 371 → 240 | 0 → 0 | 1278 → 1134 | 554 → 495 | 401 → 336 | 292.4 → 304.4 KB |

All runs (Perf/TBT): before `/` mobile 64/977, 57/2301, 63/1070; after 58/1959, 53/3289, 60/1576. Before `/` desktop 75/556, 68/944, 76/501; after 80/404, 93/192, 86/292. Before `/methodology` mobile 68/1341, 77/637, 61/3003; after 75/725, 75/732, 73/802. Before `/methodology` desktop 83/371, 79/468, 97/122; after 91/240, 91/239, 86/319.

Reading:
- CLS stays 0 everywhere. LCP is unchanged within noise (`/` mobile 4035 → 4094 ms, desktop 965 → 911 ms).
- JS: mobile pages gain about 2 to 3 KB (the `SmoothScroll` island and the shared loop). Desktop pages gain about 12 KB more, because the Lenis chunk (21.5 KB raw, about 7 KB gzip, plus 0.3 KB CSS) is fetched after `load` + idle **only where the gate allows it**.
- Three of four rows improved; `/` mobile got worse in the medians. To check whether the new CSS scroll-driven effects caused that, the same build was re-run with each effect switched off by an injected stylesheet (mobile, Lighthouse flow navigation, median of 3, Perf/TBT/"Other"):

  | Variant | Perf | TBT ms | "Other" ms |
  |---|---|---|---|
  | everything on | 55 | 2527 | 3153 |
  | no hero depth | 53 | 3559 | 4334 |
  | no scroll-driven reveals | 56 | 2712 | 3108 |
  | no nav settle | 53 | 3698 | 4015 |
  | all scroll-driven effects off | 53 | 2478 | 2836 |

  Switching the effects off made no measurable difference; the spread between identical runs (for example "all off": 53/2478, 51/4182, 58/1878) is larger than any difference between variants. The `/` mobile drop is therefore not attributable to T025 on this machine. The machine was also visibly slower by then (the "everything on" variant measured 55 against 58 an hour earlier on the same build). **Re-check `/` mobile on the Vercel preview with PageSpeed Insights**, which has far lower variance.

## 2. Scroll itself (Lighthouse user flow, timespan mode)

Timespan mode works with the installed tooling. Script: desktop window 1350x940, page loaded and idle for 2.5 s (so the lazy Lenis island is in), then inside the timespan: 30 wheel notches of 120 px every 60 ms, a pause, 12 notches back up, `PageDown`, `End`. Real wheel events via CDP, so Lenis really handles them. An in-page probe records every rAF interval, `longtask` and `layout-shift` entries. "CPU 4x" adds DevTools CPU throttling, a stand-in for a weak laptop.

| Page | CPU | Build | Lenis active at end | TBT ms | CLS | Long tasks (count / ms) | Frames | p50 / p95 frame ms | Frames > 33 ms | Main thread ms (other / script) |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 1x | before | no | 0 | 0 | 0 / 0 | 387 | 16.7 / 17.0 | 9 | 1453 (640 / 226) |
| `/` | 1x | after | yes | 0 | 0 | 0 / 0 | 449 | 16.7 / 16.9 | 7 | 2633 (1310 / 437) |
| `/` | 4x | before | no | 3595 | 0 | 76 / 7302 | 172 | 50 / 183 | 114 | 11171 (5499 / 2286) |
| `/` | 4x | after | no (guard) | 5529 | 0 | 88 / 9759 | 173 | 66.6 / 250 | 114 | 13557 (7303 / 2913) |
| `/methodology` | 1x | before | no | 0 | 0 | 0 / 0 | 398 | 16.7 / 16.9 | 3 | 542 (278 / 152) |
| `/methodology` | 1x | after | yes | 0 | 0 | 0 / 0 | 473 | 16.7 / 16.9 | 2 | 1204 (514 / 354) |
| `/methodology` | 4x | before | no | 834 | 0 | 17 / 1602 | 327 | 16.7 / 49.9 | 21 | 6469 (3464 / 2146) |
| `/methodology` | 4x | after | no (guard) | 919 | 0 | 34 / 2507 | 298 | 16.7 / 83.2 | 46 | 7402 (3870 / 2343) |

Reading:
- **At normal speed, smooth scrolling holds 60 fps** (p95 16.9 ms on both pages), with no long tasks and no layout shift during scroll.
- Lenis does add main-thread work: it moves wheel scrolling onto the main thread (non-passive wheel listener, one `window.scrollTo` per frame). On `/` at 1x the main thread during the 6 s scroll went from 1.45 s to 2.63 s. Part of that is simply more frames (a glide lasts about 0.45 s longer than an instant native jump). A CPU profile at 4x put most of the extra time in native `window.scrollTo` (about 260 ms over 5.4 s) and Lenis' own handlers (about 80 ms); the remaining script was React and Next's link prefetching, which runs in both builds.
- **The first "after" build (no guard) made weak machines worse:** at 4x on `/methodology`, frames went from p50 16.7 ms to 33.3 ms (73 of 276 frames over 33 ms, against 21 of 327 before). That is why the frame-budget guard exists (`createFrameBudget` in `components/scroll/gate.ts`): once more than a quarter of at least 30 glide frames miss 34 ms, Lenis removes itself for the page life. With the guard, the 4x runs end with Lenis off and `/methodology` is back to native behaviour (p50 16.7 ms). Some extra cost remains for the first second or so before it gives up. `/` at 4x is heavy with or without Lenis (the baseline already had 76 long tasks); its "after" numbers are worse, but the machine was also slower at that point (see section 1). Treat that row as inconclusive.
- Phones and tablets never load Lenis (coarse pointer / no hover), so the 4x numbers do not describe mobile users. Their scroll is native, plus the CSS scroll-driven effects, which run on the compositor.

## 3. Functional checks (headless, scripted)

All pass on the final build: Lenis initialises on desktop; an in-page nav link glides (y 0 → 4328 after 120 ms → 6403), updates the hash and `:target`, and lands exactly at `scroll-padding-top` + `scroll-margin-top` (104 px); `PageDown` / `End` / `Home` work right after a wheel glide; the skip link moves focus to `<main>`; Tab keeps the focused element in view; `/pricing#india-pricing` on load shows the INR panel and scrolls to it; the mobile-menu `<dialog>` stops Lenis (`lenis-stopped`), the page does not move under wheel input, and Lenis resumes on Esc; Lenis never initialises with `prefers-reduced-motion: reduce` or with touch emulation (`pointer: coarse`); the nav-settle, hero-depth and reveal animations and the reading-progress bar are active where supported. Back after an anchor jump restores the pre-click position, which is identical with Lenis off (the script's first assertion compared the wrong position: puppeteer scrolls a link into view before clicking it).

## 4. Not verifiable here (Fable, in a real browser)

- Feel: is `lerp` 0.13 "weighted, not floaty" on a mouse wheel and on a macOS trackpad (trackpads already have momentum; Lenis smooths on top)?
- Real-GPU frame rate during scroll on a mid-range Windows laptop and in Safari (Lenis is capped to 60 fps in Safari), with DevTools Performance and the FPS meter.
- Nested scrollers: wheel inside a long `<pre>` (/bot), the affected-URL list in an issue card and the fix tray should scroll natively.
- Find-in-page (Ctrl/Cmd+F) jumping while a glide is running.
- That the nav pill tightening and the hero push-in read as subtle, not as zoom.
- Firefox: no scroll-driven animations by default, so it should show the IntersectionObserver reveals and no nav/hero/progress effects.

## How to reproduce

Scripts live outside the repo (they use the Lighthouse in the npx cache; `LH_DIR` points at its folder, which contains `node_modules/lighthouse`, `chrome-launcher` and `puppeteer-core`):

```js
// lh.mjs <label> <runs> <url...>: navigation runs, mobile + desktop, median
const r = await lighthouse(url, { port, output: "json", onlyCategories: ["performance"] },
                           formFactor === "desktop" ? desktopConfig : undefined);
// read: categories.performance.score, audits["total-blocking-time"|"cumulative-layout-shift"|
// "largest-contentful-paint"|"mainthread-work-breakdown"|"bootup-time"|"resource-summary"]

// flow.mjs <label> <url...>: timespan around a real wheel scroll
const flow = await startFlow(page, { flags: { formFactor: "desktop", screenEmulation: { disabled: true },
  throttlingMethod: cpu === 1 ? "provided" : "devtools", throttling: { cpuSlowdownMultiplier: cpu } } });
await flow.startTimespan();
await page.evaluate(PROBE);        // rAF intervals + PerformanceObserver longtask / layout-shift
for (...) await page.mouse.wheel({ deltaY: 120 });  // 30 down, 12 up, then PageDown, End
await flow.endTimespan();
```

`variants.mjs` repeats a Lighthouse flow navigation with `page.evaluateOnNewDocument` injecting a stylesheet that sets `animation: none` on one effect at a time.
