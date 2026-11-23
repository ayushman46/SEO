import React from 'react';
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from 'remotion';
import T from '../timeline.json';
import { C, SANS, SERIF } from '../theme';
import { Center, EyeMark, Pop, Punch, Words, lerp, prog } from '../kit';

const WORD = 'noticr';

const Stars: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: 170 }, (_, i) => {
        const x = random(`sx${i}`) * 1920;
        const y = random(`sy${i}`) * 1080;
        const r = 0.6 + random(`sr${i}`) * 1.9;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(f / (9 + random(`st${i}`) * 14) + i));
        return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={tw * (0.35 + random(`so${i}`) * 0.65)} />;
      })}
    </svg>
  );
};

export const End: React.FC = () => {
  const f = useCurrentFrame();
  const { typeStart, typeEvery, tagline, button } = T.end;
  const typed = Math.max(0, Math.min(WORD.length, Math.floor((f - typeStart) / typeEvery) + 1));
  const cursorOn = typed < WORD.length || Math.floor((f - typeStart) / 9) % 2 === 0;
  const moon = prog(f, 0, 40);
  const btn = prog(f, button, 9);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 80% at 50% 110%, ${C.night3} 0%, ${C.night2} 45%, ${C.night} 100%)` }}>
      <Punch from={1.1} dur={9}>
        <Stars />
        <div
          style={{
            position: 'absolute',
            right: -110,
            top: lerp(-60, -150, moon),
            width: 520,
            height: 520,
            borderRadius: 260,
            boxShadow: '0 0 140px 30px rgba(120,170,255,0.28)',
            opacity: 0.92,
          }}
        >
          <Img src={staticFile('moon.webp')} style={{ width: '100%', height: '100%' }} />
        </div>
        <Center style={{ paddingBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <Pop at={3} scale={0.5} y={0}>
              <EyeMark size={168} tile={C.night3} />
            </Pop>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 300,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: C.nightInk,
                whiteSpace: 'nowrap',
                paddingBottom: 30,
              }}
            >
              {WORD.split('').map((ch, i) => (
                <span key={i} style={{ position: 'relative', opacity: i < typed ? 1 : 0 }}>
                  {ch}
                  {i === typed - 1 ? (
                    <span style={{ position: 'absolute', right: -16, top: 70, width: 7, height: 210, background: C.accent, opacity: cursorOn ? 1 : 0 }} />
                  ) : null}
                </span>
              ))}
            </div>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1, letterSpacing: '-0.015em', color: C.nightInk, marginTop: 26 }}>
            <Words at={tagline} stagger={3} parts={[{ t: 'Get seen by search' }, { t: 'and by AI.', i: true }]} />
          </div>
          <div
            style={{
              marginTop: 64,
              height: 100,
              padding: '0 56px',
              borderRadius: 50,
              background: C.white,
              color: C.ink,
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              opacity: btn,
              transform: `translateY(${(1 - btn) * 30}px) scale(${lerp(0.85, 1, btn)})`,
              boxShadow: '0 0 0 10px rgba(30,123,245,0.28), 0 20px 60px -10px rgba(30,123,245,0.6)',
            }}
          >
            Run your free audit
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke={C.accent600} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ marginTop: 34, fontFamily: SANS, fontWeight: 500, fontSize: 30, color: C.nightMuted }}>
            <Pop at={button + 10} y={12}>
              Free audit. About a minute. No signup to see your score.
            </Pop>
          </div>
        </Center>
      </Punch>
    </AbsoluteFill>
  );
};
