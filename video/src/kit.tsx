import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, SANS, SERIF } from './theme';

export const ease = Easing.bezier(0.22, 1, 0.36, 1);

/** 0 → 1 between `start` and `start + dur`, eased, clamped. */
export const prog = (frame: number, start: number, dur = 8) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Pops its children in: fade, rise, de-blur, slight overshoot-free scale. */
export const Pop: React.FC<{
  at: number;
  dur?: number;
  y?: number;
  blur?: number;
  scale?: number;
  inline?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, dur = 7, y = 26, blur = 10, scale = 0.96, inline = true, style, children }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur);
  return (
    <span
      style={{
        display: inline ? 'inline-block' : 'block',
        opacity: p,
        transform: `translateY(${(1 - p) * y}px) scale(${lerp(scale, 1, p)})`,
        filter: p < 1 ? `blur(${(1 - p) * blur}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export type Part = { t: string; i?: boolean; color?: string };

/** Kinetic line: every word pops in one after another. */
export const Words: React.FC<{ parts: Part[]; at: number; stagger?: number; dur?: number }> = ({
  parts,
  at,
  stagger = 3,
  dur = 7,
}) => {
  let n = 0;
  return (
    <>
      {parts.map((part, pi) =>
        part.t.split(' ').map((w, wi) => {
          const idx = n++;
          return (
            <React.Fragment key={`${pi}-${wi}`}>
              {idx > 0 ? ' ' : null}
              <Pop
                at={at + idx * stagger}
                dur={dur}
                style={{ fontStyle: part.i ? 'italic' : 'normal', color: part.color, paddingRight: part.i ? '0.06em' : 0 }}
              >
                {w}
              </Pop>
            </React.Fragment>
          );
        }),
      )}
    </>
  );
};

/** Design-tool selection box: hairline plus four square handles. */
export const Handles: React.FC<{
  at: number;
  color: string;
  padX?: number;
  padY?: number;
  size?: number;
  children: React.ReactNode;
}> = ({ at, color, padX = 44, padY = 14, size = 14, children }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 9);
  const sq = (pos: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    width: size,
    height: size,
    background: color,
    transform: `scale(${p})`,
    ...pos,
  });
  const o = -size / 2;
  return (
    <span style={{ position: 'relative', display: 'inline-block', padding: `${padY}px ${padX}px` }}>
      <span
        style={{
          position: 'absolute',
          inset: lerp(-18, 0, p),
          border: `2px solid ${color}`,
          opacity: 0.38 * p,
        }}
      />
      <span style={sq({ left: o, top: o })} />
      <span style={sq({ right: o, top: o })} />
      <span style={sq({ left: o, bottom: o })} />
      <span style={sq({ right: o, bottom: o })} />
      {children}
    </span>
  );
};

/** Scale/blur punch at local frame `at` (used on every hard cut). */
export const Punch: React.FC<{ at?: number; from?: number; blur?: number; dur?: number; children: React.ReactNode }> = ({
  at = 0,
  from = 1.07,
  blur = 12,
  dur = 7,
  children,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur);
  return (
    <AbsoluteFill
      style={{ transform: `scale(${lerp(from, 1, p)})`, filter: p < 1 ? `blur(${(1 - p) * blur}px)` : undefined }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Grain: React.FC<{ opacity?: number; blend?: React.CSSProperties['mixBlendMode'] }> = ({
  opacity = 0.5,
  blend = 'multiply',
}) => (
  <AbsoluteFill
    style={{
      backgroundImage: `url(${staticFile('grain.webp')})`,
      backgroundSize: '256px 256px',
      opacity,
      mixBlendMode: blend,
      pointerEvents: 'none',
    }}
  />
);

export const Paper: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: C.paper }}>
    <Grain opacity={0.55} />
    {children}
  </AbsoluteFill>
);

/** Full-bleed photo with a slow push-in. */
export const Photo: React.FC<{ src: string; from?: number; to?: number; frames: number; position?: string; style?: React.CSSProperties }> = ({
  src,
  from = 1.04,
  to = 1.12,
  frames,
  position = 'center',
  style,
}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, frames], [from, to]);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={staticFile(src)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, transform: `scale(${s})`, ...style }}
      />
    </AbsoluteFill>
  );
};

type Tone = 'critical' | 'high' | 'medium' | 'low' | 'pass' | 'accent' | 'neutral';
const TONES: Record<Tone, [string, string]> = {
  critical: [C.criticalSoft, C.critical],
  high: [C.highSoft, C.high],
  medium: [C.mediumSoft, C.medium],
  low: [C.lowSoft, C.low],
  pass: [C.passSoft, C.pass],
  accent: [C.accentSoft, C.accentInk],
  neutral: [C.paper2, C.muted],
};

export const Chip: React.FC<{ tone: Tone; size?: number; dot?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({
  tone,
  size = 22,
  dot = true,
  children,
  style,
}) => {
  const [bg, fg] = TONES[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.4,
        background: bg,
        color: fg,
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        padding: `${size * 0.42}px ${size * 0.8}px`,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot ? <span style={{ width: size * 0.38, height: size * 0.38, borderRadius: 99, background: fg }} /> : null}
      {children}
    </span>
  );
};

/** The on-screen honesty label. */
export const SampleBadge: React.FC<{ size?: number; text?: string }> = ({ size = 20, text = 'Sample report' }) => (
  <Chip tone="accent" size={size} dot={false} style={{ border: `1.5px solid ${C.accent}33`, letterSpacing: '0.02em' }}>
    {text}
  </Chip>
);

export const Kicker: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({
  children,
  color = C.muted,
  size = 18,
}) => (
  <span
    style={{
      fontFamily: SANS,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color,
      lineHeight: 1,
    }}
  >
    {children}
  </span>
);

export const scoreColor = (v: number) => (v >= 80 ? C.pass : v >= 60 ? C.accent : v >= 40 ? C.high : C.critical);

/** Score ring that counts up from 0 between `at` and `at + dur`. */
export const Ring: React.FC<{
  value: number;
  size: number;
  at: number;
  dur?: number;
  stroke?: number;
  color?: string;
  track?: string;
  numberColor?: string;
}> = ({ value, size, at, dur = 30, stroke, color, track = C.line, numberColor = C.ink }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const sw = stroke ?? size * 0.09;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const shown = Math.round(value * p);
  const col = color ?? scoreColor(value);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${(circ * value * p) / 100} ${circ}`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: SERIF,
          fontSize: size * 0.42,
          lineHeight: 1,
          color: numberColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {shown}
      </div>
    </div>
  );
};

/** The brand mark: an open eye on an ink tile (same geometry as the site logo). */
export const EyeMark: React.FC<{ size: number; tile?: string }> = ({ size, tile = C.ink }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <rect width="32" height="32" rx="9" fill={tile} />
    <path d="M5 16.2c2.9-5 6.7-7.6 11-7.6s8.1 2.6 11 7.6c-2.9 5-6.7 7.4-11 7.4s-8.1-2.4-11-7.4Z" fill="#fff" />
    <circle cx="16" cy="16.1" r="5" fill={C.accent} />
    <circle cx="16" cy="16.1" r="2.1" fill={C.ink} />
    <circle cx="17.7" cy="14.4" r="1" fill="#fff" />
  </svg>
);

export const Tick: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Cross: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** Centered full-frame flex column. */
export const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...style }}>{children}</AbsoluteFill>
);
