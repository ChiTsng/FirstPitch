// 一次连接截完整套基线图，用来做视觉回归比对。
// 用法: node tools/shots.mjs <输出目录> [--only=03,07] [--url=http://127.0.0.1:5175/]
//
// 每改完一批视觉就跑一次，和上一批的目录并排看。

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { connect, capture } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=').slice(1).join('=') : d;
};

const dir = args.find((a) => !a.startsWith('--'));
if (!dir) {
  console.error('用法: node tools/shots.mjs <输出目录> [--only=03,07]');
  process.exit(1);
}
const BASE = opt('url', 'http://127.0.0.1:5175/');
const only = opt('only', '')
  .split(',')
  .filter(Boolean);

const MOBILE = { w: 390, h: 844, mobile: true };

// to 是 CSS 选择器（本站是 hash 路由，锚点不能走 URL）。
const SHOTS = [
  { name: '01-hero', hash: '#/' },
  { name: '02-hero-landed', hash: '#/', click: '.opening__swing' },
  { name: '03-layer1', hash: '#/', to: '#layer-1' },
  { name: '04-layer3', hash: '#/', to: '#layer-3' },
  { name: '05-layer5', hash: '#/', to: '#layer-5' },
  { name: '06-live-dead', hash: '#/live-dead' },
  { name: '07-people', hash: '#/people' },
  { name: '08-timing', hash: '#/timing' },
  { name: '09-principles', hash: '#/principles' },
  { name: '10-lab', hash: '#/lab' },
  { name: '11-quiz', hash: '#/quiz' },
  { name: '12-glossary', hash: '#/glossary' },
  { name: '13-stories', hash: '#/stories' },
  { name: '14-day-hero', hash: '#/', scheme: 'light' },
  { name: '15-day-layer3', hash: '#/', to: '#layer-3', scheme: 'light' },
  { name: '16-day-principles', hash: '#/principles', scheme: 'light' },
  { name: '17-mobile-layer3', hash: '#/', to: '#layer-3', ...MOBILE },
  { name: '18-mobile-quiz', hash: '#/quiz', ...MOBILE },
  { name: '19-mobile-lab', hash: '#/lab', ...MOBILE },
  { name: '20-reduced-hero', hash: '#/', motion: 'reduce' },
  { name: '21-day-people', hash: '#/people', scheme: 'light' },
  { name: '22-day-mobile-layer3', hash: '#/', to: '#layer-3', scheme: 'light', ...MOBILE },
  { name: '23-mobile-hero', hash: '#/', ...MOBILE },
  { name: '24-journey', hash: '#/', to: '#journey' },
  { name: '25-force-workshop', hash: '#/', to: '#layer-3 .chapter__workshop' },
  { name: '26-chapter-expanded', hash: '#/', to: '#layer-3 .chapter__reading', click: '#layer-3 .scene-trigger' },
];

mkdirSync(dir, { recursive: true });
const { send, close } = await connect();

for (const s of SHOTS) {
  if (only.length && !only.some((p) => s.name.startsWith(p))) continue;
  const { name, hash, ...rest } = s;
  const png = await capture(send, { url: BASE + hash, ...rest });
  const file = join(dir, `${name}.png`);
  writeFileSync(file, png);
  console.log(`${name.padEnd(20)} ${(png.length / 1024).toFixed(0)} KB`);
}

close();
process.exit(0);
