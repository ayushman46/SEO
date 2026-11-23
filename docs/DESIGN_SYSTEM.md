# seenhq design system

"Classical renaissance meets modern SaaS." Editorial serif, white paper, one electric blue, and surreal collages of sky,
marble and painted fragments seen through torn paper. Theme: *being seen*. Live showcase: `/design-preview` (noindex).

## Tokens (`src/app/globals.css`, Tailwind v4 `@theme`)
All colors are CSS variables (light mode only in v1; dark is a palette swap later).

| Group | Tokens | Notes |
|---|---|---|
| Surfaces | `white` #fff, `paper` #F7F6F2, `paper-2` #EFEDE6, `paper-edge` #FBFAF6 | Paper sections get `.paper-grain` (a 128 px pre-rendered WebP noise tile, never an SVG filter). |
| Ink | `ink` #121212, `ink-2` #2B2B29, `muted` #5F5E58, `faint` #8B8A83 | `muted` is 6.3:1 on paper. `faint` is for placeholders/icons only, never body text. |
| Lines | `line` #E4E1D8, `line-strong` #CFCBC0 | Hairlines, 1px. |
| Accent | `accent` #1E7BF5, `accent-600` #1A6FE8, `accent-700` #155FCC, `accent-800` #114FAD, `accent-ink` #1360D6, `accent-soft` #E6F0FE | `accent` = brand blue for fills, rings, data, focus. White text sits on `accent-600` (4.7:1). Blue text uses `accent-ink` (5.7:1 white, 5.3:1 paper). Never use `accent` for small text. |
| Night | `night` #070B19, `night-2`, `night-3`, `night-ink` #F3F1EA, `night-muted` #B9BCCB, `night-line` | Dark "night sky" section only. |
| Status | `critical`/`high`/`medium`/`low`/`pass` + `-soft` | Report UI only. Each text color is AA on its soft fill. |
| Type | `font-serif` Instrument Serif 400 (+italic), `font-sans` Inter | `text-display-xl/lg/md/sm` are clamp() with tight tracking; `text-kicker` 12px / 0.14em uppercase. |
| Radii | `rounded-pill`, `rounded-card` 20px, `rounded-panel` 28px, `rounded-control` 14px | |
| Shadows | `shadow-paper`, `shadow-float`, `shadow-pill` | Warm, low, wide. No hard drop shadows. |
| Motion | `ease-paper` cubic-bezier(.22,1,.36,1) | Everything off under `prefers-reduced-motion`. |

Sky blues come from photography, never from UI fills.

## Layout
- `Container`: max 1240px, gutters 16 / 24 / 32 px (360 / 640 / 1024+). `size="wide"` 1440px for the nav.
- Sections alternate white and paper; paper sections open and close with a `SectionTear`.
- Every section that holds collage layers uses `overflow-clip`; `body` has `overflow-x: clip`. No horizontal scroll at 360–1920.
- Header is sticky and transparent (`--nav-h` = 5rem); the home hero pulls up under it with `-mt-(--nav-h)`.
- `html` has `scroll-padding-top: calc(var(--nav-h) + 1rem)`, so every anchor jump (skip link, `#id` links, find-in-page) lands below the nav. Do not add `scroll-mt-*` on top of it (they add up). Sticky side columns use `lg:top-28`.
- Route layouts: `src/app/layout.tsx` is the bare root (html, body, fonts, `rootMetadata`, Organization + WebSite JSON-LD). `src/app/(marketing)/layout.tsx` adds the chrome via `site/SiteChrome` (skip link, Nav, the single `<main id="main">`, Footer). `/admin` lives outside the group and gets no chrome; the root `not-found.tsx` wraps itself in `SiteChrome`. Pages must not render their own `<main>`.

## Components (`src/components`)
| Component | Type | Notes |
|---|---|---|
| `ui/Button` | server | `primary` / `secondary` / `ghost` / `link` / `night`; `sm` / `md` / `lg`; `href` renders `next/link`; optional trailing icon. `buttonClass()` for custom elements. |
| `ui/Badge` | server | neutral, accent, outline, night, severities, pass. |
| `ui/Container`, `ui/SectionHeading` | server | Kicker (hairline + uppercase) + serif title + body; `tone="night"`. |
| `ui/Tabs` | client | Segmented blue bar, white active pill. WAI-ARIA tabs, automatic activation, ←/→ wrap, Home/End, roving tabindex. All panels SSR'd (inactive `hidden`). `layout="split"` adds a per-tab aside (illustration) on the right from lg. |
| `ui/Accordion` | server | Native `<details>`; optional `name` for exclusive groups. |
| `ui/Field` + `ui/Input` | shared | `Field` renders label/error/help with ids; wire the input with `describedBy(id, {help, error})`. `invalid` sets `aria-invalid`. |
| `ui/ScoreRing` | client | SVG ring; SSR shows the final value; count-up only when it starts below the fold and motion is allowed, and it snaps to the final value when reached by a scroll jump (shares the `Reveal` watcher). `role="img"` with "X out of 100". `null` = unavailable. |
| `ui/IssueRow` | server | Severity pill + title + category + effort dots (+ impact). `locked` for gated teasers. Exports label maps for severity/effort/category. |
| `ui/EngineStrip` + `ui/EngineStripToggle` | server + client | Hairline band of official engine logos (24 px tall, explicit width/height) each next to its product name, plus the `enginesDisclaimer` line. CSS-only marquee: one track, list duplicated once (copy `aria-hidden`), `transform` keyframe `engine-marquee` (48 s), static gradient edge fades, paused on hover / focus-within and by the pause/play button (WCAG 2.2.2; the button is the only client code). Reduced motion: no animation, no copy, no button, names wrap into a centred static row. |
| `ui/Reveal` | client | `variant="fade"` (default) or `"settle"` (paper lift + slight tilt; `"tear"` is an alias, the clip-path wipe is retired). `delay` (ms) staggers siblings, `stagger` staggers its own children. T025: where `animation-timeline: view()` is supported, fades are pure CSS, scrubbed over the first 240 px after entry with fill `none` (no script, nothing stays hidden or composited); otherwise the script path below. Script path: only hides elements that are below the fold at mount (and only with IntersectionObserver + motion allowed), so no flash, no LCP delay, no hidden content without JS. One shared watcher (`watchReveal`): animated reveal starts 12% of a viewport before entry; anything found already in the top 65% of the viewport or above it (anchor jump, `scrollTo`, find-in-page, restored scroll) is shown at once with no transition; scroll, resize, `hashchange`, `pageshow` and a 900 ms failsafe sweep make sure nothing stays hidden. |
| `ui/PlaceholderText` | server | Renders `[PLACEHOLDER…]` markers from content as a small dashed tag. |
| `ui/Icon` | server | Hand-drawn 24px line icons; keys match `FeatureItem.icon`. |
| `site/Nav` + `site/MobileMenu` | server + client | Floating white pill (logo, links lg+, blue square menu button < lg) + Contact + "Free audit". Mobile sheet is a native modal `<dialog>` (focus trap, Esc, inert page, focus return) + backdrop click, link click, auto-close at lg, scroll lock. No sign-in in v1. |
| `scroll/SmoothScroll` (+ `gate`, `loop`, `smooth`, `lenis-controller`) | client | T025. Lazy Lenis island in the marketing layout; see "Scroll motion". `scroll/smooth` exports `scrollToElement(el, block)` (use it instead of `scrollIntoView`) and `lockSmoothScroll()` (call while any modal is open). |
| `pages/ReadingProgress` | server | 3 px accent hairline at the top of long documents (`DocBody`, `LegalBody`), CSS scroll-driven `scaleX`; hidden without scroll timelines and under reduced motion. |
| `site/Footer`, `site/Logo` | server | Eye mark on ink tile + lowercase serif wordmark "seenhq". |
| `site/SiteChrome` | server | Skip link + Nav + `<main id="main">` + Footer. Used by the `(marketing)` layout and the root 404. |
| `collage/torn.ts` | util | Seeded torn outlines as CSS `polygon()`: `tornRectPair`, `tornEllipsePair` (rim + cut-out share one tear), `tornBand`, `tornRect`. |
| `collage/TornFrame` | server | Torn cut-out on a paper rim with grain and paper/float drop-shadow. `shape="rect" | "ellipse"`, `rotate`, `edges`. |
| `collage/Parallax` | client | Moves an inner layer by `speed` × scroll offset. One shared controller for every instance (one IntersectionObserver; a read/write subscription to the shared scroll frame in `scroll/loop`, held only while a layer is on screen). No `will-change`; the at-rest offset is a 2D translate (no layer), 3D only once the user scrolls. Off under reduced motion. |
| `collage/HeroCollage`, `collage/FeatureCollage` (+ `FloatingCard`), `collage/SectionTear` | server | Compositions. Mock UI cards are labelled "Illustrative" and `aria-hidden`. |
| `audit/AiReading` | shared (inside the client audit flow) | T017. `AiPartialCard` (readback, business type, clarity `ScoreRing`, fact-count chips, 2 sample questions, locked list linking to the email gate; never draft text), `AiFullSection` (facts `<dl>`, questions with http(s)-only source links, drafts in `<pre><code>` as plain React text + `CopyButton`), `HonestyLabel` (required on every AI surface, shows the model id), `AiUnavailableNote` (one quiet line, no card, no reserved space when `ai` is null). Fact/answer chips use `Badge` with dot + text: clear/answered = pass, vague/partly = medium, missing/not answered = high. |
| `audit/CopyButton`, `audit/ExportBar` | client | Clipboard API with a hidden-textarea fallback; own polite live region; Copy/Copied share one grid cell (no width jump). `ExportBar` copies `toTicketsMarkdown` / `toAgentPrompt` and downloads tickets via a Blob URL; buttons wrap below `sm`. |
| `audit/CheckGrid` | shared | Groups by category plus a trailing "Other" group for unknown categories; empty engine labels fall back to `auditUi.checkLabelFallback`, then to the humanized id; `unavailable` (or an unknown status) reads "Not run". |

## Imagery rules
Public domain / CC0 only, logged in `docs/ASSETS.md`, optimized by `scripts/optimize-images.mjs` (< 300 KB each,
exported at >= 2x their largest rendered CSS width; next/image re-encodes to AVIF/WebP).
Every raster goes through `next/image` with `sizes` that describe the real rendered width, including object-cover boxes that are
height-bound (the hero sky renders ~1060-1240 CSS px wide on phones). The hero sky is the only `preload` image; decorative layers use `alt=""`.

## Brand assets
Generated by the same script from the `LogoMark` geometry (`site/Logo.tsx`): `public/logo.png` (512, full-bleed ink, used by
Organization JSON-LD), `src/app/icon.svg` (rounded tile), `src/app/apple-icon.png` (180, full-bleed) and `src/app/favicon.ico` (32 + 16).

## Accessibility checklist
Skip link → `#main`; landmarks (header/nav/main/footer, labelled sections); visible focus ring (2px accent, 3px offset);
targets ≥ 36px; AA contrast for all text including text near imagery (no text sits on photos except white pills);
reduced motion disables parallax, reveals, count-ups, twinkle, smooth scroll (Lenis is never loaded), nav settle, hero depth and the reading-progress bar.

## Don'ts
No customer logos, testimonials, user counts or "most popular" badges. Engine logos only in `ui/EngineStrip` (T015, founder decision), always with the product name and the not-affiliated disclaimer; never framed as partners or "trusted by". No Sign in. No sky-blue UI fills.
No default shadcn look: no gray-50 cards with 1px gray-200 borders and Inter-only headings.

## Performance rules (T011)

Measured on mobile Lighthouse: most main-thread "Other" time was the renderer waiting on GPU raster, not JS. Keep it that way:

- No `will-change` on large layers; no `backdrop-filter` on sticky/fixed chrome.
- No SVG `feTurbulence` (or other SVG filters) as CSS backgrounds; use small raster tiles.
- Animate only `opacity`/`transform` on whole layers (the night-sky twinkle animates three star layers, not 40 SVG circles).
- Batch decorative SVG into a few `<path>`s instead of hundreds of nodes; every DOM node is also hydrated.
- Shared illustrations across tabs: one collage, swap only the card (`Tabs` `asideFrame` + `TabsAsideSlot`).
- Read all layout first, then write (see `whenBelowFold` in `ui/Reveal`), never per-element read/write during hydration.
- Hero sky is art-directed: phones in portrait get `sky-hero-portrait.webp`; LCP images use `fetchPriority="high"`.
- Marquees (T015 engine strip): animate one track's `transform` with a CSS keyframe, no `will-change`, no `mask-image` on the moving layer (edge fades are static gradient pseudo-elements), stop entirely under reduced motion.
- No `backdrop-filter` anywhere, including `::backdrop` (the menu scrim is a flat 50% night tint).

## Scroll motion (T025)

Fewer, better effects; all transform/opacity, all off under reduced motion. Measured in `docs/SCROLL_PERF.md`.

- **Smooth scroll (Lenis 1.3.27, ADR-020):** wheel/trackpad only, `lerp` 0.13 (settles in about 0.45 s: weighted, not floaty). No snapping, no scroll-jacking, no horizontal handling, touch never synced. Loaded lazily after `load` + idle, only when `scroll/gate` allows it (not reduced motion, not coarse pointer, not `hover: none`, not Save-Data). Keys are always native; a navigation key cancels a running glide. A frame-budget guard turns it off for the page life on machines that miss frames while gliding.
- **One loop:** `scroll/loop` owns the only rAF for scroll work. Per frame: Lenis advances, then every subscriber `read`s, then every subscriber `write`s. It idles when nothing moves and stops while the tab is hidden. New scroll-linked JS must subscribe with `onScrollFrame({ read, write })`; never add another scroll listener or rAF.
- **Anchors:** same-page `#id` links do a real fragment navigation (history, `:target`, `hashchange`, focus starting point) and then glide; offsets come from `scroll-padding-top` / `scroll-margin-top` as before. Focusable targets (`<main tabindex=-1>`, tab panels) receive focus. `html.lenis` sets `scroll-behavior: auto`, so route changes and back/forward restoration are instant.
- **Nested scrollers:** wheel inside `pre`, `textarea`, `select`, `dialog`, iframes and any `overflow-*-auto|scroll` element stays native; add `data-lenis-prevent` to any other fixed or scrollable panel (the fix tray has it). Modals call `lockSmoothScroll()`.
- **CSS scroll-driven effects** (inside `@supports (animation-timeline: view())` + `prefers-reduced-motion: no-preference`; simply absent elsewhere):
  - Reveal fades (`reveal-rise`, 28 px rise, fill `none`).
  - Nav settle: over the first 30vh the nav rises 6 px, the main pill paper (`.nav-pill-bg`, a separate layer so text is never scaled) tightens to 96.5% x 90%, and a deeper shadow fades in.
  - Hero depth: the torn hole with the eye scales to 1.06 and lifts 3% across the hero exit (`view-timeline: --hero` on the collage).
  - Reading progress on `DocBody` / `LegalBody` pages.
- Tailwind v4 `scale-*`, `translate-*`, `rotate-*` utilities set the individual `scale`/`translate`/`rotate` properties; scroll keyframes animate `transform`, so they compose. Never put a `scale-*` utility on an element whose keyframe starts from it (set the start value in CSS).
