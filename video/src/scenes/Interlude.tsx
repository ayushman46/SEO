import React from 'react';
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import T from '../timeline.json';
import { C, SANS, SERIF, SHADOW_BIG } from '../theme';
import { Center, Handles, Kicker, Pop, Punch, Words, lerp } from '../kit';
import type { Part } from '../kit';

const LINES: Part[][] = [[{ t: 'No retainer.' }], [{ t: 'No contract.' }], [{ t: 'Just the' }, { t: 'fix.', i: true }]];

const PRICES: { name: string; price: string; unit?: string; note: string }[] = [
  { name: 'Free audit', price: '$0', note: 'Your score in about a minute. No signup.' },
  { name: 'Full audit', price: '$39', note: 'SEO, GEO and Performance. 30+ checks.' },
  { name: 'Fix sprint', price: '$149', note: 'Fixed price. Up to 8 fixes. Before/after proof.' },
  { name: 'Monitoring', price: '$19', unit: '/month', note: 'No contract.' },
];

const TILT_FROM = [-7, 5, -4, 6];
const TILT_TO = [-1.5, 1, -1, 1.5];

const Card: React.FC<{ i: number; at: number }> = ({ i, at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 190, mass: 0.7 } });
  const item = PRICES[i];
  const hero = i === 2;
  return (
    <div
      style={{
        width: 408,
        height: 470,
        borderRadius: 28,
        background: hero ? C.ink : C.white,
        color: hero ? C.white : C.ink,
        boxShadow: SHADOW_BIG,
        padding: '40px 38px',
        boxSizing: 'border-box',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        opacity: Math.max(0, Math.min(1, s * 1.6)),
        transform: `translateY(${(1 - s) * 220}px) rotate(${lerp(TILT_FROM[i], TILT_TO[i], s)}deg) scale(${lerp(0.7, 1, s)})`,
      }}
    >
      <Kicker color={hero ? C.nightMuted : C.muted} size={20}>
        {item.name}
      </Kicker>
      <div style={{ fontFamily: SERIF, fontSize: 176, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 44, whiteSpace: 'nowrap' }}>
        {item.price}
        {item.unit ? (
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 30, letterSpacing: 0, marginLeft: 8, opacity: 0.7 }}>{item.unit}</span>
        ) : null}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 25, lineHeight: 1.3, color: hero ? C.white : C.ink2 }}>{item.note}</div>
    </div>
  );
};

export const Interlude: React.FC = () => {
  const { lines, cards, cardEvery } = T.interlude;
  const ends = [...lines.slice(1), cards];
  return (
    <AbsoluteFill style={{ backgroundColor: C.accent }}>
      {LINES.map((parts, i) => (
        <Sequence key={i} from={lines[i]} durationInFrames={ends[i] - lines[i]}>
          <Punch from={1.12} blur={8} dur={6}>
            <Center style={{ fontFamily: SERIF, fontSize: 250, lineHeight: 1, letterSpacing: '-0.03em', color: C.white }}>
              <Handles at={0} color={C.white} padX={64} padY={24} size={18}>
                <Words at={0} stagger={4} dur={6} parts={parts} />
              </Handles>
            </Center>
          </Punch>
        </Sequence>
      ))}
      <Sequence from={cards}>
        <div
          style={{
            position: 'absolute',
            top: 118,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: SERIF,
            fontSize: 88,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: C.white,
          }}
        >
          <Words at={0} stagger={2} parts={[{ t: 'Agencies charge a retainer.' }, { t: 'We charge for the fix.', i: true }]} />
        </div>
        <div style={{ position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 36 }}>
          {PRICES.map((_, i) => (
            <Card key={i} i={i} at={4 + i * cardEvery} />
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 868,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 30,
            color: C.white,
          }}
        >
          <Pop at={40}>Next to every issue: fix it yourself for free, or have us fix it.</Pop>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
