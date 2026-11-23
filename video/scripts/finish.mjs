// Finishing pass: Remotion's raw render (full-range yuvj420p) -> broadcast-safe H.264 yuv420p BT.709, faststart.
// Also writes a silent copy. Usage: node scripts/finish.mjs
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
const raw = join(out, '_raw.mp4');
const final = join(out, 'noticr-launch.mp4');
const silent = join(out, 'noticr-launch-silent.mp4');
const run = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

run([
  '-i', raw,
  '-vf', 'scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-r', '30',
  '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final,
]);
run(['-i', final, '-an', '-c:v', 'copy', '-movflags', '+faststart', silent]);
console.log('wrote', final, 'and', silent);
