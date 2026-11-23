import React from 'react';
import { Composition } from 'remotion';
import { Launch } from './Launch';
import { loadFonts } from './fonts';
import T from './timeline.json';

loadFonts();

export const Root: React.FC = () => (
  <Composition id="Launch" component={Launch} durationInFrames={T.total} fps={T.fps} width={1920} height={1080} />
);
