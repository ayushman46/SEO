# seenhq design system

"Classical renaissance meets modern SaaS." Editorial serif, white paper, one electric blue, and surreal collages of sky,
marble and painted fragments seen through torn paper. Theme: *being seen*. Live showcase: `/design-preview` (noindex).

## Tokens (`src/app/globals.css`, Tailwind v4 `@theme`)
All colors are CSS variables (light mode only in v1; dark is a palette swap later).

| Group | Tokens | Notes |
|---|---|---|
| Surfaces | `white` #fff, `paper` #F7F6F2, `paper-2` #EFEDE6, `paper-edge` #FBFAF6 | Paper sections get `.paper-grain`. |
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

## Components (`src/components`)
| Component | Type | Notes |
|---|---|---|
| `ui/Button` | server | `primary` / `secondary` / `ghost` / `link` / `night`; `sm` / `md` / `lg`; `href` renders `next/link`; optional trailing icon. `buttonClass()` for custom elements. |
| `ui/Badge` | server | neutral, accent, outline, night, severities, pass. |
| `ui/Container`, `ui/SectionHeading` | server | Kicker (hairline + uppercase) + serif title + body; `tone="night"`. |
| `ui/Tabs` | client | Segmented blue bar, white active pill. WAI-ARIA tabs, automatic activation, ←/→ wrap, Home/End, roving tabindex. All panels SSR'd (inactive `hidden`). `layout="split"` adds a per-tab aside (illustration) on the right from lg. |
| `ui/Accordion` | server | Native `<details>`; optional `name` for exclusive groups. |
| `ui/Field` + `ui/Input` | shared | `Field` renders label/error/help with ids; wire the input with `describedBy(id, {help, error})`. `invalid` sets `aria-invalid`. |
| `ui/ScoreRing` | client | SVG ring; SSR shows the final value; count-up only when it starts below the fold and motion is allowed. `role="img"` with "X out of 100". `null` = unavailable. |
| `ui/IssueRow` | server | Severity pill + title + category + effort dots (+ impact). `locked` for gated teasers. Exports label maps for severity/effort/category. |
| `ui/EngineStrip` | server | Hairline grid of TEXT names (4 cols md, 8 xl); horizontal scroll-snap in its own keyboard-focusable region below md. |
| `ui/Reveal` | client | Fade-up or `variant="tear"` wipe. Only hides elements that are below the fold at mount, so no flash, no LCP delay, no hidden content without JS. |
| `ui/PlaceholderText` | server | Renders `[PLACEHOLDER…]` markers from content as a small dashed tag. |
| `ui/Icon` | server | Hand-drawn 24px line icons; keys match `FeatureItem.icon`. |
| `site/Nav` + `site/MobileMenu` | server + client | Floating white pill (logo, links lg+, blue square menu button < lg) + Contact + "Free audit". Mobile sheet is a native modal `<dialog>` (focus trap, Esc, inert page, focus return) + backdrop click, link click, auto-close at lg, scroll lock. No sign-in in v1. |
| `site/Footer`, `site/Logo` | server | Eye mark on ink tile + lowercase serif wordmark "seenhq". |
| `collage/torn.ts` | util | Seeded torn outlines as CSS `polygon()`: `tornRectPair`, `tornEllipsePair` (rim + cut-out share one tear), `tornBand`, `tornRect`. |
| `collage/TornFrame` | server | Torn cut-out on a paper rim with grain and paper/float drop-shadow. `shape="rect" | "ellipse"`, `rotate`, `edges`. |
| `collage/Parallax` | client | Moves an inner layer by `speed` × scroll offset; listens only while on screen; off under reduced motion. |
| `collage/HeroCollage`, `collage/FeatureCollage` (+ `FloatingCard`), `collage/SectionTear` | server | Compositions. Mock UI cards are labelled "Illustrative" and `aria-hidden`. |

## Imagery rules
Public domain / CC0 only, logged in `docs/ASSETS.md`, optimized by `scripts/optimize-images.mjs` (< 250 KB each).
Every raster goes through `next/image` with `sizes`; the hero sky is the only `preload` image; decorative layers use `alt=""`.

## Accessibility checklist
Skip link → `#main`; landmarks (header/nav/main/footer, labelled sections); visible focus ring (2px accent, 3px offset);
targets ≥ 36px; AA contrast for all text including text near imagery (no text sits on photos except white pills);
reduced motion disables parallax, reveals, count-ups, twinkle and smooth scroll.

## Don'ts
No customer logos, testimonials, user counts or "most popular" badges. No engine logos. No Sign in. No sky-blue UI fills.
No default shadcn look: no gray-50 cards with 1px gray-200 borders and Inter-only headings.
