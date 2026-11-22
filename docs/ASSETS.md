# Image assets

Every raster on the site is public domain or CC0. Raw downloads live in `public/images/source/` (gitignored); the optimized
WebP derivatives in `public/images/` are built by `node scripts/optimize-images.mjs` (sharp, crop + resize, each < 300 KB, at least 2x the largest rendered CSS width).
Licenses were checked on the source page / API on 2026-11-22 (Wikimedia `extmetadata.LicenseShortName`, NASA Image Library `AVAIL:Copyright`).

| Derivative | Size | Work | Artist / creator | Date | Source page | License |
|---|---|---|---|---|---|---|
| `eye.webp` (1700×773, crop of the eyes from the 7479×11146 original; rendered up to 816 CSS px) | 167 KB | *Mona Lisa* (C2RMF retouched scan) | Leonardo da Vinci | 1503–1506 | https://commons.wikimedia.org/wiki/File:Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg (original file: https://upload.wikimedia.org/wikipedia/commons/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg) | Public domain (PD-old; faithful 2D reproduction, PD-Art) |
| `hands.webp` (720×460, crop of the hands) | 35 KB | *The Creation of Adam* (cropped), Sistine Chapel | Michelangelo | c. 1511 | https://commons.wikimedia.org/wiki/File:Michelangelo_-_Creation_of_Adam_(cropped).jpg | Public domain (PD-old; PD-Art) |
| `marble-youth.webp` (760×923) | 32 KB | *Marble head of a youth*, copy of work attributed to Polykleitos, ca. 41–54 CE (Met 247994, photo DP-14287-059) | The Metropolitan Museum of Art (Open Access) | photo 2018 | https://commons.wikimedia.org/wiki/File:Marble_head_of_a_youth_Copy_of_work_attributed_to_Polykleitos_ca._41%E2%80%9354_CE,_DP-14287-059.jpg · object: https://www.metmuseum.org/art/collection/search/247994 | CC0 1.0 |
| `moon.webp` (640×640, circular alpha) | 41 KB | "Full Moon" (LRO / LOLA visualization, SVS 4236) — NASA ID `GSFC_20171208_Archive_e000868` | NASA Goddard Space Flight Center / Scientific Visualization Studio | 2015 (archived 2017-12-08) | https://images.nasa.gov/details/GSFC_20171208_Archive_e000868 | Public domain (US Government work; NASA media guidelines; metadata `Copyright: null`, creator "NASA Goddard") |
| `sky-hero.webp` (2880×1620, top crop; full-bleed hero, up to 1920 CSS px) | 72 KB | "Bright blue sky with scenic white cloud patterns" | Trixia Lao (via Pexels, uploaded to Commons) | 2025-08-26 | https://commons.wikimedia.org/wiki/File:Bright_blue_sky_with_scenic_white_cloud_patterns.jpg | CC0 1.0 |
| `sky-hero-portrait.webp` (1080×1794, centre portrait crop of the same photo, for phones in portrait) | 33 KB | "Bright blue sky with scenic white cloud patterns" | Trixia Lao (via Pexels, uploaded to Commons) | 2025-08-26 | https://commons.wikimedia.org/wiki/File:Bright_blue_sky_with_scenic_white_cloud_patterns.jpg | CC0 1.0 |
| `sky-cumulus.webp` (1400×933) | 36 KB | "Cumulus congestus clouds (27075262952)" | HO JJ (Taipei, Taiwan) | 2016-05-22 | https://commons.wikimedia.org/wiki/File:Cumulus_congestus_clouds_(27075262952).jpg | CC0 1.0 |

## Raw sources (`public/images/source/`, not committed)
`mona-lisa-full.jpg` (7479 px Commons original, used for `eye.webp`), `mona-lisa.jpg` (3840 px Commons thumbnail, no longer used), `creation-of-adam.jpg` (original), `marble-youth.jpg` (1920 px thumbnail),
`moon-lro.jpg` (NASA `~orig`), `sky-bright.jpg` (3840 px thumbnail), `sky-cumulus.jpg` (1920 px). Re-download from the pages above to rebuild.

## Brand assets (generated, not third-party)
`public/logo.png` (512×512), `src/app/icon.svg`, `src/app/apple-icon.png` (180×180) and `src/app/favicon.ico` (32 + 16 px) are
rendered by `scripts/optimize-images.mjs` from the seenhq eye mark SVG in `src/components/site/Logo.tsx`. Original work, no license needed.

## Engine logos (`public/logos/`, T015)

Founder decision (T015) replaced the text-only engine strip with the official marks, each shown next to the product name.
Fetched 2026-11-23 with curl, then minified by a small script (comments, `<title>`, `<style>` inlined into `fill`, `class`/`data-*`/ids on the root removed; no scripts, no external references). Paths, colours and proportions are untouched.
Every file is a trademark of its owner; we use it only to identify the product we check against (nominative use). The strip carries the
`enginesDisclaimer` line from `src/content/site.ts`. Never label these "partners", "trusted by" or similar, and never recolour, crop, combine or distort them.

| File | Size | Mark | Owner | Source | Licence / trademark note |
|---|---|---|---|---|---|
| `chatgpt.svg` (used for ChatGPT) | 1.9 KB | OpenAI "blossom" symbol (2025) | OpenAI | https://commons.wikimedia.org/wiki/File:OpenAI_logo_2025_(symbol).svg | Commons: public domain (PD-textlogo / too simple for copyright), tagged trademarked. Trademark of OpenAI; used to identify the product we check against. |
| `perplexity.svg` | 0.6 KB | Perplexity symbol, brand colour #1FB8CD | Perplexity AI | https://cdn.simpleicons.org/perplexity (simple-icons, https://github.com/simple-icons/simple-icons) | simple-icons data is CC0; the mark itself is a trademark of Perplexity AI, Inc.; used to identify the product we check against. |
| `claude.svg` | 1.1 KB | Claude symbol (spark, brand orange) | Anthropic | https://commons.wikimedia.org/wiki/File:Claude_AI_symbol.svg (credit: anthropic.com) | Commons: CC0. Trademark of Anthropic; used to identify the product we check against. |
| `gemini.svg` | 8.5 KB | Gemini sparkle, full-colour 2025 icon | Google LLC | https://commons.wikimedia.org/wiki/File:Google_Gemini_icon_2025.svg (extracted from gemini.google/about) | Commons: public domain (PD-textlogo), tagged trademarked. Trademark of Google LLC; used to identify the product we check against. Contains internal SVG blur filters (rasterised once inside an `<img>`, never animated itself). |
| `google.svg` (used for Google AI Overviews and Google Search) | 0.7 KB | Google "G", four-colour | Google LLC | https://commons.wikimedia.org/wiki/File:Google_%22G%22_logo.svg (credit: google.com) | Commons: public domain (PD-textlogo), tagged trademarked. Trademark of Google LLC; used to identify the product we check against. |
| `copilot.svg` (used for Microsoft Copilot) | 2.3 KB | Copilot icon (brand refresh) | Microsoft | https://commons.wikimedia.org/wiki/File:Microsoft-copilot-2026-seeklogo.svg (Commons credits seeklogo; visually checked against Microsoft's own `copilot-mobile-logo-static` PNG served on copilot.com) | Commons: public domain (PD-textlogo), tagged trademarked. Trademark of Microsoft Corporation; used to identify the product we check against. |
| `bing.svg` | 1.4 KB | Bing "b", Fluent | Microsoft | https://commons.wikimedia.org/wiki/File:Bing_Fluent_Logo.svg (credit: bing.com) | Commons: public domain (PD-textlogo), tagged trademarked. Trademark of Microsoft Corporation; used to identify the product we check against. |

Not used: simple-icons no longer serves OpenAI, Microsoft Copilot or Bing (CDN 404). Company brand kits were not fetched (no direct public SVG links); the Commons files above credit the official sites and were visually checked (rendered side by side) before use.

## Not images
- Torn-paper edges, holes and section tears are CSS `clip-path` polygons generated in code (`src/components/collage/torn.ts`).
- The night-sky starfield is a seeded inline SVG (`src/components/home/NightSky.tsx`).
- The paper grain is `public/images/grain.webp` (128×128, 5 KB), seeded noise generated by `scripts/optimize-images.mjs`. Original work, no license needed.

## Sources tried and skipped
- Met Collection API image host and the Art Institute of Chicago API both answered with bot-protection challenges; we did not attempt to get around them and used the Met's own CC0 uploads on Wikimedia Commons instead.
