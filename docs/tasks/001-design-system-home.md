# T001 — Design system, collage imagery, components, /design-preview, Home page
**Agent:** frontend-designer · **Priority:** 1 (the face of the company) · **Depends on:** contracts only

## Goal
A premium "classical renaissance meets modern SaaS" design system and a finished Home page at `/`.

## Inputs
- `.claude/agents/frontend-designer.md` (your brief, aesthetic and rules)
- `src/content/types.ts` — copy shapes. content-seo is writing `src/content/home.ts` (`export const home: HomeContent`) and `src/content/site.ts` (`export const site: SiteConfig`) **in parallel**. If they don't exist yet when you need them, create the page against the types and import from those paths; until the files land, keep a local fallback object in `src/components/home/_fallback.ts` with "[COPY]" strings and delete it once real copy exists.
- `src/lib/audit/types.ts` — for the sample-report UI card (render an *illustrative* sample, clearly labelled "Illustrative sample").
- The reference screenshot vibe (founder supplied): floating pill nav with logo left + blue square menu button, full-bleed sky collage hero with a torn-paper hole revealing a classical eye/hand, serif centered headline below, bordered logo-strip row, segmented blue tab bar with feature grid + collage card with floating chart UI, dark night-sky section. **Do not copy it**; use it as a mood reference and make seenhq's own composition.

## Deliverables
1. **Tokens** in `src/app/globals.css` (Tailwind v4 `@theme`): surfaces (white, off-white #F7F6F2-ish paper), ink (near-black), muted, border hairlines, accent #1E7BF5 (+ hover/pressed, + a text-safe variant meeting 4.5:1 on white), night palette for the dark section, radii, shadows (paper-like, soft), spacing scale, type scale (display sizes clamp() large with tight tracking).
2. **Fonts** via `next/font/google`: Instrument Serif (display) + Inter (UI/body). `display: swap`, subsets latin.
3. **Imagery (≤ 90 min total):** 3–5 public-domain/CC0 sources (sky/cloud photo, marble statue(s), a Renaissance eye and/or hand fragment) downloaded into `public/images/source/` (gitignored if > 1 MB) and optimized webp derivatives into `public/images/` (each < 250 KB; use `sharp`, which ships with Next). Prefer Wikimedia Commons PD / Met Open Access / AIC CC0 / NASA. Log every file in `docs/ASSETS.md` (title, artist, date, source page URL, license). Composite in code: SVG torn-paper masks (`<clipPath>` with jagged path), layered paper edges with subtle shadow, parallax layers.
4. **Components** (`src/components/`): `ui/Button` (primary blue, secondary, ghost; link variant), `ui/Badge`, `ui/Container`, `ui/SectionHeading` (kicker + serif title), `ui/Tabs` (segmented blue bar, WAI-ARIA tabs with arrow keys), `ui/Accordion` (FAQ, native `<details>` ok), `ui/Input` + `ui/Field`, `site/Nav` (floating pill; mobile menu sheet via blue button; keyboard + focus-trap-lite + Esc), `site/Footer`, `collage/TornFrame`, `collage/HeroCollage`, `collage/Parallax` (client, reduced-motion aware), `ui/ScoreRing` (SVG ring + count-up, reduced-motion aware), `ui/IssueRow` (severity pill + title + effort), `ui/EngineStrip` (bordered horizontal grid of TEXT wordmarks, horizontal scroll-snap on mobile without page overflow), `ui/Reveal` (paper-tear/fade-up on scroll via IntersectionObserver; no-op for reduced motion).
   Motion: use the `motion` package only if needed for a specific effect; CSS + IntersectionObserver preferred. If you add `motion`, pin exact version.
5. **`/design-preview`** page (`robots: noindex`) showing tokens, type scale, every component and state.
6. **Home `/`** sections in order: Nav · Hero (full-bleed collage, then centered serif H1 + subtitle + URL input that routes to `/audit?url=…` + secondary CTA) · proof line (honest, no fake counts) · EngineStrip ("Checks how you show up in:" ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews, Copilot, Google Search, Bing — text only) · Problem section · Tabbed features (SEO / GEO / Performance / Fixes) with collage card + floating score UI card · How it works (3 steps) · Sample report preview (illustrative, labelled) · Services teaser (5 services, cards linking to `/services#slug`) · Pricing teaser · Night-sky dark section with CTA · FAQ · Final CTA · Footer.
   The hero URL form is a tiny client component: validates "looks like a domain/URL", then `router.push('/audit?url=' + encodeURIComponent(v))`.
7. Root `src/app/layout.tsx`: `<html lang="en">`, fonts, skip link, `<Nav/>` + `<main id="main">` + `<Footer/>`. Leave `metadata` export importing from `@/lib/seo` if it exists, else a minimal placeholder `metadata` that content-seo will replace (coordinate: content-seo owns `src/lib/seo/**`).
   Use route group `src/app/(marketing)/` for marketing pages; `page.tsx` for home lives at `src/app/(marketing)/page.tsx` (delete the scaffold `src/app/page.tsx`).

## Acceptance criteria
- `npm run typecheck && npm run lint && npm run build` pass.
- No horizontal scroll at 360/768/1280/1920. Hero LCP image is `priority` with correct `sizes`; no CLS from fonts/images.
- Keyboard: skip link, nav menu, tabs (arrows/Home/End), FAQ all operable; visible focus rings.
- `prefers-reduced-motion: reduce` disables parallax, count-ups and reveals.
- Every image logged in ASSETS.md with a verifiable PD/CC0 license.
- Contrast AA for all text, including text over imagery (use scrims if needed).
- Does not look like default shadcn/Tailwind UI.

## Out of scope
/audit page (T005), other pages (T006), dark mode.
