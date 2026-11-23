import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import T from './timeline.json';
import { C } from './theme';
import { Intro } from './scenes/Intro';
import { Enter } from './scenes/Enter';
import { Stem } from './scenes/Stem';
import { Report } from './scenes/Report';
import { Interlude } from './scenes/Interlude';
import { Contrast } from './scenes/Contrast';
import { End } from './scenes/End';

const SCENES: [keyof typeof T.scenes, React.FC][] = [
  ['intro', Intro],
  ['enter', Enter],
  ['stem', Stem],
  ['report', Report],
  ['interlude', Interlude],
  ['contrast', Contrast],
  ['end', End],
];

export const Launch: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.night }}>
    {SCENES.map(([key, Scene]) => {
      const [from, to] = T.scenes[key];
      return (
        <Sequence key={key} from={from} durationInFrames={to - from} name={key}>
          <Scene />
        </Sequence>
      );
    })}
    <Audio src={staticFile('bed.wav')} />
  </AbsoluteFill>
);
