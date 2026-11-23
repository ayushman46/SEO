// Synthesizes the music bed for the launch video into public/bed.wav.
// Everything is generated here from sine waves and seeded noise: no samples, no downloads.
// Cue frames mirror src/timeline.json so hits land on the cuts.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(readFileSync(join(root, 'src/timeline.json'), 'utf8'));
const SR = 44100;
const FPS = T.fps;
const N = Math.ceil((T.total / FPS) * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const sec = (frame) => frame / FPS;
const BEAT = 0.5; // 120 BPM: one beat is 15 frames, so every cut sits on a beat

// seeded noise (mulberry32) so the file is byte-identical on every run
let seed = 0x9e3779b9;
const rnd = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = () => rnd() * 2 - 1;

const put = (t0, dur, fn, pan = 0) => {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(dur * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) {
    const idx = s0 + i;
    if (idx < 0 || idx >= N) continue;
    const v = fn(i / SR, i);
    L[idx] += v * gl;
    R[idx] += v * gr;
  }
};

const kick = (t0, gain = 1) => {
  let ph = 0;
  put(t0, 0.32, (t) => {
    const fq = 44 + 110 * Math.exp(-t * 34);
    ph += (2 * Math.PI * fq) / SR;
    return gain * (Math.sin(ph) * Math.exp(-t * 11) + 0.25 * noise() * Math.exp(-t * 320));
  });
};

const boom = (t0, gain = 1) => {
  let ph = 0;
  put(t0, 1.6, (t) => {
    const fq = 36 + 50 * Math.exp(-t * 9);
    ph += (2 * Math.PI * fq) / SR;
    return gain * Math.sin(ph) * Math.exp(-t * 2.6) * Math.min(1, t * 400);
  });
};

const hat = (t0, gain = 0.1, pan = 0.2) => {
  let prev = 0;
  put(
    t0,
    0.06,
    (t) => {
      const n = noise();
      const hp = n - prev; // crude high-pass
      prev = n;
      return gain * hp * Math.exp(-t * 85);
    },
    pan,
  );
};

const tick = (t0, gain = 0.16, pan = 0, pitch = 2400) => {
  let prev = 0;
  put(
    t0,
    0.035,
    (t) => {
      const n = noise();
      const hp = n - prev;
      prev = n;
      return gain * (0.6 * hp + 0.5 * Math.sin(2 * Math.PI * pitch * t)) * Math.exp(-t * 260);
    },
    pan,
  );
};

const pluck = (t0, freq, gain = 0.12, pan = 0, decay = 9, dur = 0.5) =>
  put(
    t0,
    dur,
    (t) => gain * Math.min(1, t * 500) * Math.exp(-t * decay) * (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t) + 0.12 * Math.sin(6 * Math.PI * freq * t)),
    pan,
  );

const pad = (t0, dur, freqs, gain = 0.05) => {
  freqs.forEach((fq, i) => {
    const pan = ((i % 3) - 1) * 0.5;
    const det = 1 + (i % 2 ? 0.0025 : -0.0025);
    put(
      t0,
      dur + 0.5,
      (t) => {
        const env = Math.min(1, t / 0.25) * Math.min(1, Math.max(0, (dur + 0.5 - t) / 0.5));
        // duck under the kick so the bed breathes with the beat
        const sinceBeat = (t0 + t) % BEAT;
        const duck = 1 - 0.45 * Math.exp(-sinceBeat * 9);
        return gain * env * duck * (Math.sin(2 * Math.PI * fq * t) + 0.5 * Math.sin(2 * Math.PI * fq * det * t) + 0.18 * Math.sin(4 * Math.PI * fq * t));
      },
      pan,
    );
  });
};

const riser = (t0, t1, gain = 0.2) => {
  const dur = t1 - t0;
  let lp = 0;
  let bp = 0;
  put(t0, dur, (t) => {
    const x = t / dur;
    const fc = 300 * Math.pow(22, x); // 300 Hz → 6.6 kHz
    const f = 2 * Math.sin((Math.PI * fc) / SR);
    const hp = noise() - lp - 0.6 * bp; // state-variable band-pass
    bp += f * hp;
    lp += f * bp;
    return gain * x * x * bp;
  });
};

// --- harmony: IV V vi I in C, one chord per bar (2 s) ---------------------------------------
const NOTE = { C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99 };
const CHORDS = [
  { root: 87.31, tones: [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.E4], arp: [NOTE.A4, NOTE.C5, NOTE.E5, NOTE.C5] },
  { root: 98.0, tones: [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.G4], arp: [NOTE.B4, NOTE.D5, NOTE.G5, NOTE.D5] },
  { root: 110.0, tones: [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4], arp: [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5] },
  { root: 130.81, tones: [NOTE.G3, NOTE.C4, NOTE.E4, NOTE.G4], arp: [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5] },
];

const S = T.scenes;
const endStart = sec(S.end[0]);
const total = sec(T.total);
const inRange = (t, [a, b]) => t >= sec(a) - 1e-6 && t < sec(b) - 1e-6;

// pad + bass, bar by bar, until the end card
for (let bar = 0; bar * 2 < endStart; bar++) {
  const t0 = bar * 2;
  const ch = CHORDS[bar % 4];
  const dur = Math.min(2, endStart - t0);
  pad(t0, dur, ch.tones, 0.05);
  for (let e = 0; e < 4; e++) {
    const t = t0 + e * BEAT + BEAT / 2; // off-beat bass
    if (t >= endStart || t < sec(S.enter[0])) continue;
    if (inRange(t, [S.interlude[0], S.interlude[0] + T.interlude.cards])) continue;
    pluck(t, ch.root, 0.22, 0, 7, 0.4);
  }
}

// kick on every beat, with gaps where the picture breathes
const strong = new Set([0, ...T.intro.swaps, T.intro.final, S.enter[0], ...T.stem.swaps.map((x) => x + S.stem[0]), S.report[0], S.contrast[0]]);
for (let frame = 0; frame < S.end[0]; frame += 15) {
  const t = sec(frame);
  const isStrong = strong.has(frame);
  if (frame < S.enter[0] && !isStrong) continue; // intro: only the title swaps
  if (frame >= S.report[1] - 30 && frame < S.report[1]) continue; // air before the drop
  if (frame >= S.interlude[0] && frame < S.interlude[0] + T.interlude.cards) continue; // three big hits instead
  kick(t, isStrong ? 0.95 : 0.6);
  const busy = frame >= S.stem[0];
  if (busy) hat(t + BEAT / 2, 0.11, 0.25);
  if (frame >= S.report[0] && frame < S.report[1]) hat(t + BEAT / 4, 0.05, -0.3), hat(t + (3 * BEAT) / 4, 0.05, -0.3);
}

// "No retainer. / No contract. / Just the fix."
T.interlude.lines.forEach((l) => {
  const t = sec(S.interlude[0] + l);
  boom(t, 0.8);
  kick(t, 1);
});
kick(sec(S.interlude[0] + T.interlude.cards), 0.95);

// arpeggio over the report and the dot grids
const arpSpan = (from, to, gain) => {
  for (let t = sec(from), i = 0; t < sec(to); t += BEAT / 2, i++) {
    const ch = CHORDS[Math.floor(t / 2) % 4];
    pluck(t, ch.arp[i % 4], gain, i % 2 ? 0.45 : -0.45, 10, 0.35);
  }
};
arpSpan(S.report[0], S.report[1] - 30, 0.055);
arpSpan(S.interlude[0] + T.interlude.cards, S.interlude[1], 0.05);
arpSpan(S.contrast[0] + T.contrast.fill, S.contrast[1], 0.06);

// typing ticks
for (let i = 0; i < 23; i++) tick(sec(S.enter[0] + T.enter.typeStart + i * T.enter.typeEvery), 0.13, (i % 3) * 0.2 - 0.2, 2200 + (i % 4) * 180);
for (let i = 0; i < 6; i++) tick(sec(S.end[0] + T.end.typeStart + i * T.end.typeEvery), 0.2, 0, 1900 + i * 90);

// UI pops
pluck(sec(S.enter[0] + T.enter.press), NOTE.G4, 0.16, 0, 14, 0.3);
for (let i = 0; i < 6; i++) pluck(sec(S.enter[0] + T.enter.chipStart + i * T.enter.chipEvery), [NOTE.C5, NOTE.D5, NOTE.E5, NOTE.G5, NOTE.E5, NOTE.G5][i], 0.07, 0.3, 16, 0.25);
for (let i = 0; i < 6; i++) pluck(sec(S.report[0] + T.report.rowStart + i * T.report.rowEvery), NOTE.E5, 0.05, 0.35, 18, 0.2);
T.report.clicks.forEach((c, i) => {
  tick(sec(S.report[0] + c), 0.22, 0.3, 1500);
  pluck(sec(S.report[0] + c), [NOTE.E5, NOTE.G5, 1046.5][i], 0.1, 0.3, 12, 0.35);
});
for (let i = 0; i < 4; i++) pluck(sec(S.interlude[0] + T.interlude.cards + 4 + i * T.interlude.cardEvery), [NOTE.C5, NOTE.E5, NOTE.G5, 1046.5][i], 0.11, -0.45 + i * 0.3, 11, 0.4);

// zoom-through riser into the drop
riser(sec(S.report[0] + T.report.zoomOut - 15), sec(S.report[1]), 0.22);

// end card: one long C add9, a soft boom, then fade
boom(endStart, 0.7);
pad(endStart, total - endStart - 0.5, [NOTE.C3, NOTE.G3, NOTE.C4, NOTE.E4, NOTE.G4, NOTE.D5], 0.05);
pluck(endStart, NOTE.C5, 0.12, -0.3, 3, 1.6);
pluck(sec(S.end[0] + T.end.tagline), NOTE.G5, 0.08, 0.3, 3, 1.6);
pluck(sec(S.end[0] + T.end.button), 1046.5, 0.09, 0, 3, 1.8);

// --- master: fades, soft clip, normalise to a modest peak ------------------------------------
let peak = 0;
const fadeOut = 1.3;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 0.01) * Math.min(1, Math.max(0, (total - t) / fadeOut));
  L[i] = Math.tanh(L[i] * 1.4) * g;
  R[i] = Math.tanh(R[i] * 1.4) * g;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const TARGET_PEAK = 0.42; // about -7.5 dBFS: a bed, not a banger
const norm = TARGET_PEAK / peak;

const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
}
mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'public/bed.wav'), buf);
console.log(`bed.wav written: ${(N / SR).toFixed(2)} s, pre-normalise peak ${peak.toFixed(3)}`);
