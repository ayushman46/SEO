/**
 * Deterministic torn-paper outlines, returned as CSS `polygon()` values in
 * percentages so they scale with any box. Seeded so server and client agree.
 *
 * Shapes come in pairs: `outer` is the paper rim, `inner` the cut-out it holds.
 * Both follow the same tear (so the rim never vanishes), with independent fine
 * fibres so the white edge looks hand-torn rather than offset.
 */

/** Seeded PRNG (mulberry32). Deterministic across server and client. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number) => Math.min(100, Math.max(0, n));
const fmt = (pts: [number, number][]) => `polygon(${pts.map(([x, y]) => `${r2(clamp(x))}% ${r2(clamp(y))}%`).join(", ")})`;

/**
 * Smooth 1D noise in [-1, 1] sampled at `n` points: a few low-frequency waves
 * (the tear's wander) plus jagged fibres. `closed` makes it wrap seamlessly.
 */
function tearNoise(rand: () => number, n: number, closed: boolean): number[] {
  const knots = (count: number) => Array.from({ length: count + 1 }, () => rand() * 2 - 1);
  const coarse = knots(closed ? 7 : 6);
  const mid = knots(closed ? 19 : 16);
  if (closed) {
    coarse[coarse.length - 1] = coarse[0];
    mid[mid.length - 1] = mid[0];
  }
  const sample = (k: number[], t: number) => {
    const f = t * (k.length - 1);
    const i = Math.min(k.length - 2, Math.floor(f));
    const u = f - i;
    const s = u * u * (3 - 2 * u);
    return k[i] * (1 - s) + k[i + 1] * s;
  };
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = closed ? i / n : i / (n - 1);
    const fibre = (rand() * 2 - 1) * (rand() < 0.18 ? 0.9 : 0.35);
    out.push(sample(coarse, t) * 0.45 + sample(mid, t) * 0.3 + fibre * 0.25);
  }
  return out;
}

export type TornEdges = { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean };
export type TornPair = { outer: string; inner: string };

/**
 * Rectangle with torn edges.
 * @param amp   tear depth in % of the box
 * @param rim   white paper rim thickness in % of the box
 */
export function tornRectPair({
  seed = 1,
  steps = 26,
  amp = 2.2,
  rim = 1.8,
  edges = { top: true, right: true, bottom: true, left: true },
}: {
  seed?: number;
  steps?: number;
  amp?: number;
  rim?: number;
  edges?: TornEdges;
} = {}): TornPair {
  const rand = mulberry32(seed);
  const fibres = mulberry32(seed * 7 + 13);
  const outer: [number, number][] = [];
  const inner: [number, number][] = [];
  // Distance inward from the box edge for the outer tear (0..amp) and inner cut.
  const depth = (v: number) => amp * (0.5 + v * 0.5);
  const innerDepth = (v: number) => depth(v) + rim + (fibres() * 0.6 - 0.15) * rim;

  const side = (on: boolean | undefined, emit: (t: number, o: number, i: number) => void, last: boolean) => {
    const noise = tearNoise(rand, steps + 1, false);
    const end = last ? steps : steps - 1;
    for (let k = 0; k <= end; k++) {
      const t = k / steps;
      if (on) emit(t, depth(noise[k]), innerDepth(noise[k]));
      else emit(t, 0, 0);
    }
  };

  const push = (ox: number, oy: number, ix: number, iy: number) => {
    outer.push([ox, oy]);
    inner.push([ix, iy]);
  };

  side(edges.top, (t, o, i) => push(t * 100, o, t * 100, i), false);
  side(edges.right, (t, o, i) => push(100 - o, t * 100, 100 - i, t * 100), false);
  side(edges.bottom, (t, o, i) => push(100 - t * 100, 100 - o, 100 - t * 100, 100 - i), false);
  side(edges.left, (t, o, i) => push(o, 100 - t * 100, i, 100 - t * 100), false);

  // Pull corners inside the rim so the cut-out never pokes past the paper.
  for (const p of inner) {
    if (edges.top) p[1] = Math.max(p[1], rim);
    if (edges.bottom) p[1] = Math.min(p[1], 100 - rim);
    if (edges.left) p[0] = Math.max(p[0], rim);
    if (edges.right) p[0] = Math.min(p[0], 100 - rim);
  }
  return { outer: fmt(outer), inner: fmt(inner) };
}

/** Ellipse-ish torn hole. `radius` is % of the box on each axis (50 = touches edge). */
export function tornEllipsePair({
  seed = 7,
  steps = 96,
  amp = 3,
  radius = 47,
  rim = 2.2,
}: {
  seed?: number;
  steps?: number;
  amp?: number;
  radius?: number;
  rim?: number;
} = {}): TornPair {
  const rand = mulberry32(seed);
  const fibres = mulberry32(seed * 7 + 13);
  const noise = tearNoise(rand, steps, true);
  const outer: [number, number][] = [];
  const inner: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const ro = radius - amp + noise[i] * amp;
    const ri = ro - rim - (fibres() * 0.7 - 0.2) * rim;
    outer.push([50 + ro * Math.cos(a), 50 + ro * Math.sin(a)]);
    inner.push([50 + ri * Math.cos(a), 50 + ri * Math.sin(a)]);
  }
  return { outer: fmt(outer), inner: fmt(inner) };
}

/** A single torn horizontal edge (section dividers). The shape fills the area below the tear. */
export function tornBand({ seed = 3, steps = 64, amp = 30, base = 50 }: { seed?: number; steps?: number; amp?: number; base?: number } = {}): string {
  const rand = mulberry32(seed);
  const noise = tearNoise(rand, steps + 1, false);
  const pts: [number, number][] = [[0, 100]];
  for (let i = 0; i <= steps; i++) pts.push([(100 * i) / steps, base + noise[i] * amp]);
  pts.push([100, 100]);
  return fmt(pts);
}

/** Torn rectangle (single outline) — e.g. a torn bottom edge on a full-bleed band. */
export function tornRect(opts: Parameters<typeof tornRectPair>[0] = {}): string {
  return tornRectPair({ ...opts, rim: 0 }).outer;
}
