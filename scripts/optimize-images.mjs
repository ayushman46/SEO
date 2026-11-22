// Builds the optimized collage derivatives in public/images/ from the raw
// public-domain / CC0 sources in public/images/source/ (gitignored).
// Every source is logged with its license in docs/ASSETS.md.
//
// Usage: node scripts/optimize-images.mjs
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("public/images/source");
const OUT = path.resolve("public/images");
const MAX_BYTES = 300 * 1024;

/** @type {{ out: string; src: string; extract?: sharp.Region; width: number; quality?: number; circle?: boolean; modulate?: sharp.Modulate }[]} */
const jobs = [
  // Hero sky: landscape crop from the top of a tall CC0 sky photo. The hero box is
  // full-bleed and 120% tall (parallax), so on phones it renders ~1100 CSS px wide.
  { out: "sky-hero.webp", src: "sky-bright.jpg", extract: { left: 0, top: 250, width: 3840, height: 2160 }, width: 2880, quality: 74 },
  // Phone-portrait art direction of the same hero sky (T011): the slice a portrait phone
  // actually sees (centre ~1300 px of the 3840 px crop), so phones decode ~1.9 Mpx, not 4.7.
  { out: "sky-hero-portrait.webp", src: "sky-bright.jpg", extract: { left: 1270, top: 250, width: 1300, height: 2160 }, width: 1080, quality: 74 },
  // Sizes below are >= 2x the largest rendered CSS width (see docs/ASSETS.md).
  // Collage card sky: deep blue cumulus (max 576 px rendered).
  { out: "sky-cumulus.webp", src: "sky-cumulus.jpg", width: 1400, quality: 64 },
  // The eye: both eyes of the Mona Lisa, cropped tight from the full 7479 px original
  // (rendered up to 816 CSS px in the hero, so 1700 covers 2x screens).
  { out: "eye.webp", src: "mona-lisa-full.jpg", extract: { left: 2435, top: 2162, width: 2142, height: 974 }, width: 1700, quality: 62 },
  // Hands: the near-touch from The Creation of Adam.
  { out: "hands.webp", src: "creation-of-adam.jpg", extract: { left: 990, top: 480, width: 720, height: 460 }, width: 720, quality: 72 },
  // Marble head of a youth (Met, CC0), cropped to the head.
  { out: "marble-youth.webp", src: "marble-youth.jpg", extract: { left: 260, top: 120, width: 1400, height: 1700 }, width: 760, quality: 70 },
  // Moon (NASA Goddard SVS), circular alpha so it floats on sky or night.
  { out: "moon.webp", src: "moon-lro.jpg", extract: { left: 240, top: 242, width: 2760, height: 2760 }, width: 640, quality: 72, circle: true },
];

await mkdir(OUT, { recursive: true });

for (const job of jobs) {
  let img = sharp(path.join(SRC, job.src)).rotate();
  if (job.extract) img = img.extract(job.extract);
  img = img.resize({ width: job.width, withoutEnlargement: true });
  if (job.modulate) img = img.modulate(job.modulate);

  if (job.circle) {
    const buf = await img.toBuffer();
    const { width = job.width, height = job.width } = await sharp(buf).metadata();
    const r = Math.min(width, height) / 2 - 1;
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="g"><stop offset="0.985" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="${width / 2}" cy="${height / 2}" r="${r}" fill="url(#g)"/></svg>`,
    );
    img = sharp(buf).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]);
  }

  const file = path.join(OUT, job.out);
  await img.webp({ quality: job.quality ?? 70, effort: 6, smartSubsample: true, alphaQuality: 80 }).toFile(file);
  const { size } = await stat(file);
  const meta = await sharp(file).metadata();
  const flag = size > MAX_BYTES ? "  <-- OVER 300 KB" : "";
  console.log(`${job.out.padEnd(20)} ${meta.width}x${meta.height}  ${(size / 1024).toFixed(1)} KB${flag}`);
}

// ---------------------------------------------------------------------------
// Paper grain tile (T011): seeded two-octave noise in warm brown with 0-21/255 alpha,
// 128 px, lossless WebP. Replaces an SVG feTurbulence data URI (expensive to raster).
// ---------------------------------------------------------------------------
{
  const W = 128;
  const buf = Buffer.alloc(W * W * 4);
  let s = 20261122 >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const coarse = Float32Array.from({ length: (W / 2) * (W / 2) }, () => rnd());
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const v = rnd() * 0.67 + coarse[(y >> 1) * (W / 2) + (x >> 1)] * 0.33;
      const o = (y * W + x) * 4;
      buf[o] = 77;
      buf[o + 1] = 64;
      buf[o + 2] = 38;
      buf[o + 3] = Math.round(v * 7) * 3;
    }
  }
  const file = path.join(OUT, "grain.webp");
  await sharp(buf, { raw: { width: W, height: W, channels: 4 } }).webp({ lossless: true, effort: 6 }).toFile(file);
  console.log(`${"grain.webp".padEnd(20)} ${W}x${W}  ${((await stat(file)).size / 1024).toFixed(1)} KB`);
}

// ---------------------------------------------------------------------------
// Brand assets: the seenhq eye mark (same geometry as src/components/site/Logo.tsx),
// rendered from inline SVG. Outputs public/logo.png (512, used by Organization
// JSON-LD), src/app/icon.svg, src/app/apple-icon.png (180) and src/app/favicon.ico
// (32 + 16 px PNGs in an ICO container, for clients that only ask for /favicon.ico).
// ---------------------------------------------------------------------------
const INK = "#121212";
const ACCENT = "#1e7bf5";
const markSvg = ({ size, rx }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">` +
  `<rect width="32" height="32" rx="${rx}" fill="${INK}"/>` +
  `<path d="M5 16.2c2.9-5 6.7-7.6 11-7.6s8.1 2.6 11 7.6c-2.9 5-6.7 7.4-11 7.4s-8.1-2.4-11-7.4Z" fill="#fff"/>` +
  `<circle cx="16" cy="16.1" r="5" fill="${ACCENT}"/>` +
  `<circle cx="16" cy="16.1" r="2.1" fill="${INK}"/>` +
  `<circle cx="17.7" cy="14.4" r="1" fill="#fff"/>` +
  `</svg>`;

const { writeFile } = await import("node:fs/promises");
const APP = path.resolve("src/app");
const png = (size, rx) => sharp(Buffer.from(markSvg({ size, rx })), { density: 72 * (size / 32) }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

// Full-bleed square for logo.png and the apple icon (platforms apply their own mask).
await writeFile(path.resolve("public/logo.png"), await png(512, 0));
await writeFile(path.join(APP, "apple-icon.png"), await png(180, 0));
// Rounded tile for the browser tab icon.
await writeFile(path.join(APP, "icon.svg"), markSvg({ size: 32, rx: 9 }).replace(` width="32" height="32" viewBox`, ` viewBox`) + "\n");

// ICO container holding PNG frames (supported by every current browser).
const frames = [await png(32, 9), await png(16, 5)];
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((buf, i) => {
  const size = i === 0 ? 32 : 16;
  const o = 6 + i * 16;
  header.writeUInt8(size, o);
  header.writeUInt8(size, o + 1);
  header.writeUInt8(0, o + 2);
  header.writeUInt8(0, o + 3);
  header.writeUInt16LE(1, o + 4);
  header.writeUInt16LE(32, o + 6);
  header.writeUInt32LE(buf.length, o + 8);
  header.writeUInt32LE(offset, o + 12);
  offset += buf.length;
});
await writeFile(path.join(APP, "favicon.ico"), Buffer.concat([header, ...frames]));
console.log("brand: public/logo.png, src/app/icon.svg, src/app/apple-icon.png, src/app/favicon.ico");
