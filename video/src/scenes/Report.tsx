import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import T from '../timeline.json';
import { C, SANS, SERIF, SHADOW_BIG } from '../theme';
import { Chip, Grain, Kicker, Photo, Ring, SampleBadge, Tick, ease, lerp, prog } from '../kit';

// Numbers and issue titles are the site's own sample report (src/content/sample-report.json).
const SCORES = { overall: 78, seo: 86, geo: 86, performance: 44 };
const ISSUES: { sev: 'high' | 'medium' | 'low'; label: string; title: string; cat: string }[] = [
  { sev: 'high', label: 'High', title: 'Your site is slow on mobile', cat: 'Performance' },
  { sev: 'high', label: 'High', title: 'AI search assistants are blocked from your site', cat: 'GEO' },
  { sev: 'medium', label: 'Medium', title: 'Different phone numbers across your site', cat: 'GEO' },
  { sev: 'medium', label: 'Medium', title: 'Pages are missing a meta description', cat: 'SEO' },
  { sev: 'medium', label: 'Medium', title: 'Images are missing alt text', cat: 'SEO' },
  { sev: 'low', label: 'Low', title: 'No llms.txt file', cat: 'GEO' },
];
/** rows the pointer adds to the fix list, in click order */
const PICKS = [1, 2, 3];

const W = 1680;
const H = 920;
const ROW_TOP = 262;
const ROW_H = 82;

const Cursor: React.FC<{ x: number; y: number; down: number }> = ({ x, y, down }) => (
  <svg
    width={44}
    height={44}
    viewBox="0 0 24 24"
    style={{ position: 'absolute', left: x, top: y, transform: `scale(${1 - down * 0.18})`, transformOrigin: '4px 3px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
  >
    <path d="M4 3l15 8.2-6.6 1.7L9.6 20 4 3z" fill={C.ink} stroke={C.white} strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export const Report: React.FC = () => {
  const f = useCurrentFrame();
  const { rowStart, rowEvery, zoomIn, buttons, clicks, zoomOut } = T.report;

  const enter = prog(f, 0, 10);
  const zin = prog(f, zoomIn, 22);
  const zout = interpolate(f, [zoomOut, 210], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => t * t * t });
  // camera: push in on the issue list, then fly through the quote price
  const scale = lerp(lerp(1, 1.3, zin), 9, zout);
  const aim = prog(f, zoomOut - 8, 16); // pan to the price just before flying through it
  const fx = lerp(1180, 1634, aim);
  const fy = lerp(590, 908, aim);
  const tx = (960 - fx) * Math.max(zin, zout) + 0;
  const ty = (540 - fy) * Math.max(zin, zout);

  const picked = clicks.filter((c) => f >= c).length;
  const tray = prog(f, clicks[0] + 2, 9);

  // pointer path in window coordinates
  const btnX = 1552;
  const rowY = (i: number) => ROW_TOP + ROW_H * i + ROW_H / 2;
  const keys = [buttons + 4, clicks[0], clicks[1], clicks[2], clicks[2] + 14];
  const cx = interpolate(f, keys, [1780, btnX, btnX + 6, btnX - 4, 1300], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const cy = interpolate(f, keys, [980, rowY(PICKS[0]), rowY(PICKS[1]), rowY(PICKS[2]), 730], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const down = Math.max(...clicks.map((c) => interpolate(f, [c - 2, c, c + 4], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));

  return (
    <AbsoluteFill style={{ backgroundColor: C.accent }}>
      <Photo src="sky-hero.webp" frames={210} from={1.06} to={1.2} />
      <Grain opacity={0.25} blend="overlay" />
      <AbsoluteFill
        style={{
          transformOrigin: `${fx}px ${fy}px`,
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          filter: zout > 0.02 ? `blur(${zout * 10}px)` : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: (1920 - W) / 2,
            top: (1080 - H) / 2,
            width: W,
            height: H,
            background: C.white,
            borderRadius: 30,
            boxShadow: SHADOW_BIG,
            overflow: 'hidden',
            opacity: enter,
            transform: `translateY(${(1 - enter) * 120}px) scale(${lerp(0.86, 1, enter)})`,
            filter: enter < 1 ? `blur(${(1 - enter) * 14}px)` : undefined,
          }}
        >
          {/* browser bar */}
          <div style={{ height: 64, background: C.paper, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 14, height: 14, borderRadius: 7, background: C.lineStrong }} />
            ))}
            <span
              style={{
                margin: '0 auto',
                width: 520,
                height: 38,
                borderRadius: 19,
                background: C.white,
                border: `1px solid ${C.line}`,
                fontFamily: SANS,
                fontSize: 18,
                color: C.muted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Audit of marigold-dental.example
            </span>
            <span style={{ width: 62 }} />
          </div>

          {/* report header */}
          <div style={{ position: 'absolute', left: 44, right: 44, top: 92, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
              <span style={{ fontFamily: SERIF, fontSize: 60, lineHeight: 1, color: C.ink, letterSpacing: '-0.02em' }}>Marigold Dental</span>
              <span style={{ fontFamily: SANS, fontSize: 22, color: C.muted }}>a fictional business</span>
            </div>
            <SampleBadge size={24} />
          </div>

          {/* scores */}
          <div style={{ position: 'absolute', left: 44, top: 188, width: 384, height: 688, background: C.paper, borderRadius: 22, border: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '34px 0 0' }}>
            <Kicker>Overall</Kicker>
            <div style={{ marginTop: 20 }}>
              <Ring value={SCORES.overall} size={232} at={6} dur={36} color={C.accent} />
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 44, lineHeight: 1, color: C.ink, marginTop: 22 }}>In good shape</div>
            <div style={{ fontFamily: SANS, fontSize: 19, color: C.muted, marginTop: 10 }}>out of 100</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 44 }}>
              {(
                [
                  ['SEO', SCORES.seo],
                  ['GEO', SCORES.geo],
                  ['Performance', SCORES.performance],
                ] as [string, number][]
              ).map(([label, v], i) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: 104 }}>
                  <Ring value={v} size={100} at={12 + i * 6} dur={30} stroke={10} />
                  <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 18, color: C.ink2 }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 18, color: C.muted, marginTop: 34 }}>One audit. Three scores. 30+ checks.</div>
          </div>

          {/* issues */}
          <div style={{ position: 'absolute', left: 476, top: 196, fontFamily: SERIF, fontSize: 44, lineHeight: 1, color: C.ink }}>Fix first</div>
          {ISSUES.map((issue, i) => {
            const p = prog(f, rowStart + i * rowEvery, 8);
            const b = prog(f, buttons + i * 3, 7);
            const pickIdx = PICKS.indexOf(i);
            const on = pickIdx >= 0 && f >= clicks[pickIdx];
            const flash = pickIdx >= 0 ? interpolate(f, [clicks[pickIdx], clicks[pickIdx] + 10], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
            return (
              <div
                key={issue.title}
                style={{
                  position: 'absolute',
                  left: 476,
                  top: ROW_TOP + i * ROW_H,
                  width: 1160,
                  height: ROW_H,
                  borderTop: `1px solid ${C.line}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  opacity: p,
                  transform: `translateX(${(1 - p) * 60}px)`,
                  background: on ? `rgba(230,240,254,${0.55 + flash * 0.45})` : undefined,
                  padding: '0 14px',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ width: 124, flexShrink: 0 }}>
                  <Chip tone={issue.sev} size={19}>{issue.label}</Chip>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: SANS, fontWeight: 600, fontSize: 25, color: C.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{issue.title}</span>
                  <span style={{ display: 'block', marginTop: 6 }}>
                    <Kicker size={14}>{issue.cat}</Kicker>
                  </span>
                </span>
                <span
                  style={{
                    opacity: b,
                    transform: `scale(${lerp(0.8, 1, b)})`,
                    height: 46,
                    padding: '0 20px',
                    borderRadius: 23,
                    border: `1.5px solid ${C.lineStrong}`,
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontSize: 19,
                    color: C.ink,
                    display: 'flex',
                    alignItems: 'center',
                    background: C.white,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Fix it myself
                </span>
                <span
                  style={{
                    opacity: b,
                    transform: `scale(${lerp(0.8, 1, b) * (1 + flash * 0.06)})`,
                    height: 46,
                    width: 196,
                    borderRadius: 23,
                    background: on ? C.ink : C.accent600,
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontSize: 19,
                    color: C.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {on ? (
                    <>
                      <Tick size={18} color={C.white} /> On my fix list
                    </>
                  ) : (
                    'Have us fix this'
                  )}
                </span>
              </div>
            );
          })}

          {/* instant quote */}
          <div
            style={{
              position: 'absolute',
              left: 476,
              top: 772,
              width: 1160,
              height: 112,
              borderRadius: 22,
              background: C.ink,
              color: C.white,
              display: 'flex',
              alignItems: 'center',
              padding: '0 34px',
              boxSizing: 'border-box',
              gap: 28,
              opacity: tray,
              transform: `translateY(${(1 - tray) * 60}px)`,
            }}
          >
            <div style={{ flex: 1 }}>
              <Kicker color={C.nightMuted} size={15}>
                Your fix list · {picked} {picked === 1 ? 'issue' : 'issues'} picked
              </Kicker>
              <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 25, marginTop: 12, letterSpacing: '-0.01em' }}>
                One Fix sprint covers up to 8 of these. Fixed price.
              </div>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1, letterSpacing: '-0.02em' }}>$149</div>
          </div>

          <Cursor x={cx} y={cy} down={down} />
        </div>
      </AbsoluteFill>
      {/* the zoom lands in the flat blue of the next shot */}
      <AbsoluteFill style={{ backgroundColor: C.accent, opacity: interpolate(f, [zoomOut + 16, 209], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />
    </AbsoluteFill>
  );
};
