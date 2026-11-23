import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

const FACES: { family: string; file: string; weight: string; style: string }[] = [
  { family: 'Instrument Serif', file: 'fonts/instrument-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
  { family: 'Instrument Serif', file: 'fonts/instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
  { family: 'Inter', file: 'fonts/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
  { family: 'Inter', file: 'fonts/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
  { family: 'Inter', file: 'fonts/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
  { family: 'Inter', file: 'fonts/inter-latin-700-normal.woff2', weight: '700', style: 'normal' },
];

let started = false;

/** Loads the woff2 files copied from @fontsource into public/fonts and blocks rendering until ready. */
export const loadFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Loading fonts');
  Promise.all(
    FACES.map(async (f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)}) format('woff2')`, {
        weight: f.weight,
        style: f.style,
      });
      document.fonts.add(await face.load());
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
};
