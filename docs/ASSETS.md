# Image assets

Every raster on the site is public domain or CC0. Raw downloads live in `public/images/source/` (gitignored); the optimized
WebP derivatives in `public/images/` are built by `node scripts/optimize-images.mjs` (sharp, crop + resize, each < 250 KB).
Licenses were checked on the source page / API on 2026-11-22 (Wikimedia `extmetadata.LicenseShortName`, NASA Image Library `AVAIL:Copyright`).

| Derivative | Size | Work | Artist / creator | Date | Source page | License |
|---|---|---|---|---|---|---|
| `eye.webp` (1100×500, crop of the eyes) | 141 KB | *Mona Lisa* (C2RMF retouched scan) | Leonardo da Vinci | 1503–1506 | https://commons.wikimedia.org/wiki/File:Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg | Public domain (PD-old; faithful 2D reproduction, PD-Art) |
| `hands.webp` (720×460, crop of the hands) | 35 KB | *The Creation of Adam* (cropped), Sistine Chapel | Michelangelo | c. 1511 | https://commons.wikimedia.org/wiki/File:Michelangelo_-_Creation_of_Adam_(cropped).jpg | Public domain (PD-old; PD-Art) |
| `marble-youth.webp` (760×923) | 32 KB | *Marble head of a youth*, copy of work attributed to Polykleitos, ca. 41–54 CE (Met 247994, photo DP-14287-059) | The Metropolitan Museum of Art (Open Access) | photo 2018 | https://commons.wikimedia.org/wiki/File:Marble_head_of_a_youth_Copy_of_work_attributed_to_Polykleitos_ca._41%E2%80%9354_CE,_DP-14287-059.jpg · object: https://www.metmuseum.org/art/collection/search/247994 | CC0 1.0 |
| `moon.webp` (640×640, circular alpha) | 41 KB | "Full Moon" (LRO / LOLA visualization, SVS 4236) — NASA ID `GSFC_20171208_Archive_e000868` | NASA Goddard Space Flight Center / Scientific Visualization Studio | 2015 (archived 2017-12-08) | https://images.nasa.gov/details/GSFC_20171208_Archive_e000868 | Public domain (US Government work; NASA media guidelines; metadata `Copyright: null`, creator "NASA Goddard") |
| `sky-hero.webp` (2400×1350, top crop) | 57 KB | "Bright blue sky with scenic white cloud patterns" | Trixia Lao (via Pexels, uploaded to Commons) | 2025-08-26 | https://commons.wikimedia.org/wiki/File:Bright_blue_sky_with_scenic_white_cloud_patterns.jpg | CC0 1.0 |
| `sky-cumulus.webp` (1400×933) | 36 KB | "Cumulus congestus clouds (27075262952)" | HO JJ (Taipei, Taiwan) | 2016-05-22 | https://commons.wikimedia.org/wiki/File:Cumulus_congestus_clouds_(27075262952).jpg | CC0 1.0 |

## Raw sources (`public/images/source/`, not committed)
`mona-lisa.jpg` (3840 px Commons thumbnail), `creation-of-adam.jpg` (original), `marble-youth.jpg` (1920 px thumbnail),
`moon-lro.jpg` (NASA `~orig`), `sky-bright.jpg` (3840 px thumbnail), `sky-cumulus.jpg` (1920 px). Re-download from the pages above to rebuild.

## Not images
- Torn-paper edges, holes and section tears are CSS `clip-path` polygons generated in code (`src/components/collage/torn.ts`).
- The night-sky starfield is a seeded inline SVG (`src/components/home/NightSky.tsx`).
- The paper grain is an inline SVG `feTurbulence` data URI (`--grain` in `globals.css`).
- Engine names in the "Checks how you show up in" strip are plain text, never logos.

## Sources tried and skipped
- Met Collection API image host and the Art Institute of Chicago API both answered with bot-protection challenges; we did not attempt to get around them and used the Met's own CC0 uploads on Wikimedia Commons instead.
