import React from 'react';
import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import T from '../timeline.json';
import { C, SANS, SERIF } from '../theme';
import { Handles, Paper, Pop, Punch, Words, prog } from '../kit';

const COLS = 24;
const ROWS = 9;
const CELL = 28;
const GAP = 8;
const GRID_W = COLS * (CELL + GAP) - GAP;

const Grid: React.FC<{ seed: string; at: number; fillAt?: number }> = ({ seed, at, fillAt }) => {
  const f = useCurrentFrame();
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = `${seed}-${r}-${c}`;
      const strength = 0.3 + 0.7 * random(k);
      const gap = random(`${k}-gap`) < 0.07;
      const early = random(`${k}-early`) < 0.13;
      const jitter = random(`${k}-j`) * 6;
      const appear = prog(f, at + c * 0.9 + jitter, 6);
      let fill = gap ? 0 : strength;
      if (fillAt !== undefined) {
        const filled = prog(f, fillAt + c * 1.5 + jitter, 7);
        fill = gap ? 0 : early ? strength * (0.45 + 0.55 * filled) : strength * filled;
      }
      cells.push(
        <span
          key={k}
          style={{
            width: CELL,
            height: CELL,
            borderRadius: 6,
            boxSizing: 'border-box',
            border: `1.5px solid ${C.lineStrong}`,
            background: C.paper2,
            position: 'relative',
            opacity: appear,
            transform: `scale(${0.4 + 0.6 * appear})`,
          }}
        >
          <span style={{ position: 'absolute', inset: -1.5, borderRadius: 6, background: C.accent, opacity: fill }} />
        </span>,
      );
    }
  }
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`, gap: GAP, width: GRID_W }}>{cells}</div>;
};

const Panel: React.FC<{ x: number; at: number; em: string; sub: string; children: React.ReactNode }> = ({ x, at, em, sub, children }) => (
  <div style={{ position: 'absolute', left: x, top: 96, width: GRID_W, textAlign: 'left' }}>
    <div style={{ fontFamily: SERIF, fontSize: 112, lineHeight: 1, letterSpacing: '-0.02em', color: C.ink, whiteSpace: 'nowrap' }}>
      <Words at={at} stagger={3} parts={[{ t: 'What' }, { t: em, i: true, color: C.accentInk }]} />
    </div>
    <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 30, color: C.muted, margin: '18px 0 34px' }}>
      <Pop at={at + 8} y={10}>
        {sub}
      </Pop>
    </div>
    {children}
  </div>
);

export const Contrast: React.FC = () => {
  const { left, right, fill, line } = T.contrast;
  const margin = (1920 - GRID_W * 2) / 3;
  return (
    <Paper>
      <Punch>
        <Panel x={margin} at={left} em="Google sees" sub="Titles, links, pages, speed.">
          <Grid seed="google" at={left + 4} />
        </Panel>
        <Panel x={margin * 2 + GRID_W} at={right} em="AI sees" sub="Crawler access, readable facts, answers.">
          <Grid seed="ai" at={right + 4} fillAt={fill} />
        </Panel>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontFamily: SANS, fontSize: 20, color: C.faint }}>
          <Pop at={right + 10} y={0}>
            Illustration, not data.
          </Pop>
        </div>
        <AbsoluteFill style={{ top: 760, height: 300, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontFamily: SERIF, fontSize: 124, lineHeight: 1, letterSpacing: '-0.025em', color: C.ink }}>
            <Handles at={line} color={C.ink} padX={52} padY={20}>
              <Words at={line} stagger={3} parts={[{ t: 'Google is one answer.' }, { t: 'AI is the other.', i: true, color: C.accentInk }]} />
            </Handles>
          </div>
        </AbsoluteFill>
      </Punch>
    </Paper>
  );
};
