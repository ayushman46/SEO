import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import T from '../timeline.json';
import { C, SANS, SERIF, SHADOW_FLOAT } from '../theme';
import { Chip, Handles, Kicker, Paper, Pop, Ring, SampleBadge, Words, lerp, prog } from '../kit';

const ENDINGS = ['readable by GPTBot?', 'quoted with the right number?', 'answering real questions?', 'fast on mobile?'];

const Card: React.FC<{ title: string; width?: number; children: React.ReactNode }> = ({ title, width = 980, children }) => {
  const f = useCurrentFrame();
  const p = prog(f, 0, 8);
  return (
    <div
      style={{
        position: 'absolute',
        top: 84,
        left: (1920 - width) / 2,
        width,
        background: C.white,
        borderRadius: 28,
        border: `1px solid ${C.line}`,
        boxShadow: SHADOW_FLOAT,
        padding: '34px 40px 30px',
        opacity: p,
        transformOrigin: 'top center',
        transform: `translateY(${(1 - p) * 50}px) scale(${lerp(0.93, 1, p) * 1.16}) rotate(${lerp(-1.5, 0, p)}deg)`,
        filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <Kicker size={19}>{title}</Kicker>
        <SampleBadge size={19} text="Sample report · Marigold Dental" />
      </div>
      {children}
    </div>
  );
};

const Row: React.FC<{ at: number; left: React.ReactNode; right: React.ReactNode; mono?: boolean; last?: boolean }> = ({ at, left, right, last }) => (
  <Pop at={at} inline={false} y={18}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 92,
        borderTop: `1px solid ${C.line}`,
        borderBottom: last ? `1px solid ${C.line}` : undefined,
        fontFamily: SANS,
        fontWeight: 500,
        fontSize: 34,
        color: C.ink,
        letterSpacing: '-0.01em',
      }}
    >
      <span>{left}</span>
      <span style={{ display: 'flex', alignItems: 'center' }}>{right}</span>
    </div>
  </Pop>
);

const Crawlers: React.FC = () => (
  <Card title="AI crawler access">
    <Row at={6} left="GPTBot" right={<Chip tone="critical" size={24}>Refused by Cloudflare</Chip>} />
    <Row at={13} left="ClaudeBot" right={<Chip tone="critical" size={24}>Refused by Cloudflare</Chip>} />
    <Row at={20} left="PerplexityBot" right={<Chip tone="high" size={24}>Blocked in robots.txt</Chip>} last />
  </Card>
);

const Phones: React.FC = () => (
  <Card title="Facts AI would quote">
    <Row at={5} left="Phone in the footer" right={<span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>0113 496 0418</span>} />
    <Row at={11} left="Phone on the contact page" right={<span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>0113 496 0952</span>} last />
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 24 }}>
      <Pop at={18} scale={0.7} y={10}>
        <Chip tone="medium" size={26}>Different phone numbers across your site</Chip>
      </Pop>
    </div>
  </Card>
);

const Questions: React.FC = () => (
  <Card title="Questions customers ask AI">
    <Row at={5} left="What are your opening hours?" right={<Chip tone="pass" size={24}>Answered</Chip>} />
    <Row at={12} left="How much does a check-up cost?" right={<Chip tone="high" size={24}>Not answered</Chip>} last />
    <div style={{ paddingTop: 22, fontFamily: SANS, fontSize: 24, color: C.muted, textAlign: 'left' }}>
      <Pop at={19} y={10}>Prices are only in a PDF price list, so no fee appears in the page text.</Pop>
    </div>
  </Card>
);

const Speed: React.FC = () => (
  <Card title="Performance on mobile" width={900}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 56, borderTop: `1px solid ${C.line}`, paddingTop: 30 }}>
      <Ring value={44} size={250} at={4} dur={34} />
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontFamily: SERIF, fontSize: 72, lineHeight: 1, color: C.ink, letterSpacing: '-0.02em' }}>
          <Pop at={6}>out of 100</Pop>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 26 }}>
          <Pop at={24} scale={0.7} y={10}>
            <Chip tone="high" size={24}>Main content appears in 4.6 s</Chip>
          </Pop>
        </div>
      </div>
    </div>
  </Card>
);

const VIGNETTES = [Crawlers, Phones, Questions, Speed];

export const Stem: React.FC = () => {
  const f = useCurrentFrame();
  const { swaps } = T.stem;
  let k = 0;
  for (let i = 0; i < swaps.length; i++) if (f >= swaps[i]) k = i;
  const ends = [...swaps.slice(1), 210];

  return (
    <Paper>
      {VIGNETTES.map((V, i) => (
        <Sequence key={i} from={swaps[i]} durationInFrames={ends[i] - swaps[i]}>
          <V />
        </Sequence>
      ))}
      <AbsoluteFill style={{ top: 620, height: 400, alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontFamily: SERIF, fontSize: 92, lineHeight: 1, color: C.ink, letterSpacing: '-0.02em' }}>
          <Words at={1} stagger={3} parts={[{ t: 'Is your website…' }]} />
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: 150,
            lineHeight: 1,
            color: C.accentInk,
            letterSpacing: '-0.025em',
            transform: `scale(${lerp(1.05, 1, prog(f, swaps[k], 6))})`,
          }}
        >
          <Sequence key={k} from={swaps[k]} layout="none">
            <Handles at={1} color={C.ink} padX={48} padY={18}>
              <Words at={1} stagger={3} dur={6} parts={[{ t: ENDINGS[k] }]} />
            </Handles>
          </Sequence>
        </div>
      </AbsoluteFill>
    </Paper>
  );
};
