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
| `ui/Reveal` | client | Fade-up or `variant="tear"` wipe. Only hides elements that are below the fold at mount (and only with IntersectionObserver + motion allowed), so no flash, no LCP delay, no hidden content without JS. One shared watcher (`watchReveal`): animated reveal starts 12% of a viewport before entry; anything found already in the top 65% of the viewport or above it (anchor jump, `scrollTo`, find-in-page, restored scroll) is shown at once with no transition; scroll, resize, `hashchange`, `pageshow` and a 900 ms failsafe sweep make sure nothing stays hidden. |
| `ui/PlaceholderText` | server | Renders `[PLACEHOLDER…]` markers from content as a small dashed tag. |
| `ui/Icon` | server | Hand-drawn 24px line icons; keys match `FeatureItem.icon`. |
| `site/Nav` + `site/MobileMenu` | server + client | Floating white pill (logo, links lg+, blue square menu button < lg) + Contact + "Free audit". Mobile sheet is a native modal `<dialog>` (focus trap, Esc, inert page, focus return) + backdrop click, link click, auto-close at lg, scroll lock. No sign-in in v1. |
| `site/Footer`, `site/Logo` | server | Eye mark on ink tile + lowercase serif wordmark "seenhq". |
| `site/SiteChrome` | server | Skip link + Nav + `<main id="main">` + Footer. Used by the `(marketing)` layout and the root 404. |
| `collage/torn.ts` | util | Seeded torn outlines as CSS `polygon()`: `tornRectPair`, `tornEllipsePair` (rim + cut-out share one tear), `tornBand`, `tornRect`. |
| `collage/TornFrame` | server | Torn cut-out on a paper rim with grain and paper/float drop-shadow. `shape="rect" | "ellipse"`, `rotate`, `edges`. |
| `collage/Parallax` | client | Moves an inner layer by `speed` × scroll offset. One shared controller for every instance (one IntersectionObserver, one passive scroll listener only while a layer is on screen, one rAF that reads all rects then writes all transforms). No `will-change`; the at-rest offset is a 2D translate (no layer), 3D only once the user scrolls. Off under reduced motion. |
| `collage/HeroCollage`, `collage/FeatureCollage` (+ `FloatingCard`), `collage/SectionTear` | server | Compositions. Mock UI cards are labelled "Illustrative" and `aria-hidden`. |

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
reduced motion disables parallax, reveals, count-ups, twinkle and smooth scroll.

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
