import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import T from '../timeline.json';
import { C, SANS, SERIF, SHADOW_BIG, SHADOW_FLOAT } from '../theme';
import { Grain, Photo, Pop, Punch, Tick, Words, lerp, prog } from '../kit';

const URL_TEXT = 'marigold-dental.example';
const SCANS = ['Reading robots.txt', 'Testing GPTBot', 'Testing ClaudeBot', 'Checking prices and hours', 'Measuring mobile speed'];

export const Enter: React.FC = () => {
  const f = useCurrentFrame();
  const { typeStart, typeEvery, press, chipStart, chipEvery } = T.enter;
  const typed = Math.max(0, Math.min(URL_TEXT.length, Math.floor((f - typeStart) / typeEvery) + 1));
  const typing = f >= typeStart && typed < URL_TEXT.length;
  const cursorOn = f < press && (typing || Math.floor(f / 8) % 2 === 0);
  const pressP = interpolate(f, [press - 3, press, press + 5], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const running = f >= press;
  const bar = interpolate(f, [press, 118], [0, 0.86], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pillIn = prog(f, 12, 9);
  const headP = prog(f, 0, 10);
  const marble = prog(f, 8, 12);

  return (
    <AbsoluteFill>
      <Punch>
        <Photo src="sky-cumulus.webp" frames={120} from={1.05} to={1.16} position="center 60%" />
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(6,26,90,0.5) 0%, rgba(6,26,90,0.08) 46%, rgba(6,26,90,0) 100%)' }} />
        <Grain opacity={0.3} blend="overlay" />

        {/* marble head in a paper-rimmed cut-out: the classical half of the look */}
        <div
          style={{
            position: 'absolute',
            left: 70,
            bottom: -150,
            width: 470,
            height: 560,
            borderRadius: '50% 50% 46% 54% / 46% 50% 50% 54%',
            background: C.paper,
            padding: 16,
            boxShadow: SHADOW_BIG,
            transform: `translateY(${(1 - marble) * 220}px) rotate(${lerp(-14, -7, marble)}deg)`,
            opacity: marble,
          }}
        >
          <div style={{ width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden' }}>
            <Img src={staticFile('marble-youth.webp')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%' }} />
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 150,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: SERIF,
            fontSize: 150,
            lineHeight: 1,
            letterSpacing: '-0.025em',
            color: C.white,
            textShadow: '0 4px 44px rgba(6,26,90,0.55)',
            transform: `translateY(${(1 - headP) * 20}px)`,
          }}
        >
          <Words at={2} stagger={3} parts={[{ t: 'Just enter your' }, { t: 'website.', i: true }]} />
        </div>

        {/* audit field */}
        <div
          style={{
            position: 'absolute',
            top: 420,
            left: 340,
            width: 1240,
            height: 132,
            borderRadius: 66,
            background: C.white,
            boxShadow: SHADOW_BIG,
            display: 'flex',
            alignItems: 'center',
            padding: '0 18px 0 52px',
            opacity: pillIn,
            transform: `translateY(${(1 - pillIn) * 40}px) scale(${lerp(0.94, 1, pillIn) * (1 - pressP * 0.015)})`,
            overflow: 'hidden',
          }}
        >
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 46, color: C.faint, letterSpacing: '-0.01em' }}>https://</span>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 46, color: C.ink, letterSpacing: '-0.01em', whiteSpace: 'pre' }}>
            {URL_TEXT.slice(0, typed)}
          </span>
          <span style={{ width: 4, height: 58, marginLeft: 4, background: C.accent, opacity: cursorOn ? 1 : 0 }} />
          <span style={{ flex: 1 }} />
          <span
            style={{
              height: 96,
              padding: '0 44px',
              borderRadius: 48,
              background: running ? C.accent800 : C.accent600,
              color: C.white,
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 32,
              display: 'flex',
              alignItems: 'center',
              transform: `scale(${1 - pressP * 0.08})`,
              boxShadow: `0 0 0 ${pressP * 18}px rgba(30,123,245,${0.25 * pressP})`,
            }}
          >
            {running ? 'Auditing…' : 'Run free audit'}
          </span>
          <span style={{ position: 'absolute', left: 0, bottom: 0, height: 8, width: `${bar * 100}%`, background: C.accent, opacity: running ? 1 : 0 }} />
        </div>

        <div style={{ position: 'absolute', top: 574, left: 0, right: 0, textAlign: 'center' }}>
          <Pop at={16} y={10}>
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 22, color: C.white, opacity: 0.92, textShadow: '0 2px 14px rgba(6,26,90,0.6)' }}>
              Sample: a fictional business on a reserved test domain
            </span>
          </Pop>
        </div>

        {/* scanning ticks */}
        <div
          style={{
            position: 'absolute',
            top: 660,
            left: 480,
            width: 1300,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          {SCANS.map((label, i) => {
            const at = chipStart + i * chipEvery;
            const done = f >= at + 6;
            return (
              <Pop key={label} at={at} dur={6} y={30} scale={0.8}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 14,
                    height: 72,
                    padding: '0 30px 0 22px',
                    borderRadius: 36,
                    background: C.white,
                    boxShadow: SHADOW_FLOAT,
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontSize: 28,
                    color: C.ink,
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: done ? C.accent : C.accentSoft,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {done ? <Tick size={22} color={C.white} /> : null}
                  </span>
                  {label}
                </span>
              </Pop>
            );
          })}
          <Pop at={chipStart + SCANS.length * chipEvery} dur={6} y={30} scale={0.8}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 72,
                padding: '0 34px',
                borderRadius: 36,
                background: C.ink,
                boxShadow: SHADOW_FLOAT,
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 28,
                color: C.white,
              }}
            >
              30+ checks. About a minute.
            </span>
          </Pop>
        </div>
      </Punch>
    </AbsoluteFill>
  );
};
