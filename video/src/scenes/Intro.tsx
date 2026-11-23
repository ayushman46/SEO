import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import T from '../timeline.json';
import { C, SERIF } from '../theme';
import { Center, Grain, Handles, Pop, Words, lerp, prog } from '../kit';

const ENGINES = ['Google', 'ChatGPT', 'Gemini', 'Perplexity'];

type Variant = { base: string; img: string; x: number; y: number; flip: number; blobs: [number, number, string, number][] };

/** One blurred sky colour field per title; the field hard-cuts with the words. */
const VARIANTS: Variant[] = [
  {
    base: 'linear-gradient(165deg,#08256e 0%,#1e7bf5 58%,#b9dcff 100%)',
    img: 'blur-a.jpg', x: 0, y: -6, flip: 1,
    blobs: [[8, 78, '#ffffff', 0.75], [86, 16, '#7cc0ff', 0.6], [60, 96, '#dff0ff', 0.6]],
  },
  {
    base: 'linear-gradient(200deg,#0d3aa6 0%,#2a86ff 60%,#eaf4ff 100%)',
    img: 'blur-b.jpg', x: 10, y: 12, flip: -1,
    blobs: [[90, 84, '#ffffff', 0.8], [10, 12, '#0a2f8a', 0.7], [44, 100, '#9fd0ff', 0.6]],
  },
  {
    base: 'linear-gradient(140deg,#0a1f5c 0%,#1766dd 50%,#8ec5ff 100%)',
    img: 'blur-a.jpg', x: -14, y: 8, flip: -1,
    blobs: [[14, 20, '#ffffff', 0.65], [92, 60, '#5aa9ff', 0.7], [30, 98, '#061a4d', 0.6]],
  },
  {
    base: 'linear-gradient(180deg,#1259d0 0%,#3d95ff 55%,#f1f8ff 100%)',
    img: 'blur-b.jpg', x: -8, y: -10, flip: 1,
    blobs: [[50, 104, '#ffffff', 0.9], [4, 40, '#0b3394', 0.6], [96, 30, '#0b3394', 0.55]],
  },
  {
    base: 'linear-gradient(215deg,#061747 0%,#134fc0 52%,#6fb4ff 100%)',
    img: 'blur-a.jpg', x: 12, y: 4, flip: 1,
    blobs: [[84, 90, '#e8f3ff', 0.7], [20, 86, '#2a86ff', 0.6], [70, 6, '#ffffff', 0.4]],
  },
  {
    base: 'linear-gradient(170deg,#0a2b82 0%,#1e7bf5 55%,#d4e9ff 100%)',
    img: 'blur-a.jpg', x: 0, y: 0, flip: -1,
    blobs: [[6, 92, '#ffffff', 0.85], [94, 92, '#ffffff', 0.8], [50, -4, '#061a4d', 0.6]],
  },
];

const Field: React.FC<{ v: Variant; local: number }> = ({ v, local }) => {
  const drift = local * 0.35;
  return (
    <AbsoluteFill style={{ background: v.base, overflow: 'hidden' }}>
      <Img
        src={staticFile(v.img)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.55,
          filter: 'blur(28px) saturate(1.25)',
          transform: `scale(${1.5 * v.flip}, 1.5) translate(${v.x + drift * 0.12}%, ${v.y - drift * 0.06}%)`,
          mixBlendMode: 'screen',
        }}
      />
      {v.blobs.map(([x, y, color, o], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 1300,
            height: 1300,
            left: `calc(${x}% - 650px + ${Math.sin((local + i * 40) / 22) * 34 + drift * (i % 2 ? 1 : -1)}px)`,
            top: `calc(${y}% - 650px + ${Math.cos((local + i * 25) / 26) * 26}px)`,
            background: `radial-gradient(circle, ${color} 0%, transparent 62%)`,
            opacity: o,
            filter: 'blur(30px)',
          }}
        />
      ))}
      {/* keeps the title readable wherever the clouds drift */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 62% 42% at 50% 50%, rgba(6,26,90,0.55), transparent 72%)' }} />
      <Grain opacity={0.35} blend="overlay" />
    </AbsoluteFill>
  );
};

export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { swaps, final } = T.intro;
  const cuts = [0, ...swaps, final];
  let k = 0;
  for (let i = 0; i < cuts.length; i++) if (f >= cuts[i]) k = i;
  const local = f - cuts[k];
  const punch = prog(f, cuts[k], 6);
  const grow = k === 5 ? 1 + local * 0.0012 : 1;

  return (
    <AbsoluteFill>
      <Field v={VARIANTS[k]} local={f} />
      <Center
        style={{
          fontFamily: SERIF,
          color: C.white,
          fontSize: 164,
          lineHeight: 1,
          letterSpacing: '-0.025em',
          transform: `scale(${lerp(1.06, 1, punch) * grow})`,
          textShadow: '0 4px 40px rgba(6,26,90,0.45)',
        }}
      >
        {k === 0 ? (
          <Handles at={2} color={C.white}>
            <Words at={3} stagger={8} parts={[{ t: 'Introducing' }, { t: 'noticr', i: true }]} />
          </Handles>
        ) : k < 5 ? (
          <Handles at={-20} color={C.white}>
            <span style={{ fontStyle: 'italic' }}>noticr</span> for{' '}
            <Pop key={k} at={cuts[k]} dur={5} y={40} blur={14}>
              {ENGINES[k - 1]}
            </Pop>
          </Handles>
        ) : (
          <Handles key="final" at={final} color={C.white} padX={56} padY={20}>
            <span style={{ fontStyle: 'italic' }}>noticr</span> for{' '}
            <Words at={final} stagger={5} parts={[{ t: 'every answer.', i: true }]} />
          </Handles>
        )}
      </Center>
    </AbsoluteFill>
  );
};
