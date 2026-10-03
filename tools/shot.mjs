// 截一张图。
// 用法: node tools/shot.mjs <url> <out.png> [选项]
//   --w=1440 --h=900       视口尺寸
//   --scheme=dark|light    模拟 prefers-color-scheme
//   --motion=reduce        模拟 prefers-reduced-motion
//   --mobile               按手机视口渲染
//   --to=<CSS 选择器>      滚到这个元素（注意是选择器，不是 URL 锚点）
//   --click=<CSS 选择器>   截图前点一下
//   --wait=1400            导航后等待毫秒数
//   --full                 整页长截图

import { writeFileSync } from 'node:fs';
import { connect, capture } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : dflt;
};
const has = (name) => args.includes(`--${name}`);

const url = args[0];
const out = args[1];
if (!url || !out) {
  console.error('用法: node tools/shot.mjs <url> <out.png> [选项]');
  process.exit(1);
}

const { send, close } = await connect();
const png = await capture(send, {
  url,
  w: Number(opt('w', 1440)),
  h: Number(opt('h', 900)),
  scheme: opt('scheme', 'dark'),
  motion: opt('motion', 'no-preference'),
  mobile: has('mobile'),
  to: opt('to', ''),
  click: opt('click', ''),
  wait: Number(opt('wait', 1400)),
  full: has('full'),
});

writeFileSync(out, png);
console.log(`${out}  ${(png.length / 1024).toFixed(0)} KB`);
close();
process.exit(0);
