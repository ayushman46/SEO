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
const MAX_BYTES = 250 * 1024;

/** @type {{ out: string; src: string; extract?: sharp.Region; width: number; quality?: number; circle?: boolean; modulate?: sharp.Modulate }[]} */
const jobs = [
  // Hero sky: landscape crop from the top of a tall CC0 sky photo.
  { out: "sky-hero.webp", src: "sky-bright.jpg", extract: { left: 0, top: 250, width: 3840, height: 2160 }, width: 2400, quality: 74 },
  // Collage card sky: deep blue cumulus.
  { out: "sky-cumulus.webp", src: "sky-cumulus.jpg", width: 1400, quality: 64 },
  // The eye: both eyes of the Mona Lisa, cropped tight.
  { out: "eye.webp", src: "mona-lisa.jpg", extract: { left: 1250, top: 1110, width: 1100, height: 500 }, width: 1100, quality: 70 },
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
  const flag = size > MAX_BYTES ? "  <-- OVER 250 KB" : "";
  console.log(`${job.out.padEnd(20)} ${meta.width}x${meta.height}  ${(size / 1024).toFixed(1)} KB${flag}`);
}
