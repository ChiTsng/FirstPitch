// 横向溢出验收：9 条路由在 390px 下都不能出现横向滚动。
// 顺便把溢出的元素点出来，省得对着截图猜。
// 用法: node tools/overflow.mjs [--url=http://127.0.0.1:5175/] [--w=390]

import { connect, evaluate, sleep } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=').slice(1).join('=') : d;
};
const BASE = opt('url', 'http://127.0.0.1:5175/');
const W = Number(opt('w', 390));

const ROUTES = [
  '#/',
  '#/live-dead',
  '#/people',
  '#/timing',
  '#/principles',
  '#/lab',
  '#/quiz',
  '#/glossary',
  '#/stories',
];

const PROBE = `(() => {
  const doc = document.documentElement;
  const over = doc.scrollWidth - doc.clientWidth;
  const bad = [];
  if (over > 0) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > doc.clientWidth + 1 || r.left < -1) {
        bad.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]
          + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
      }
      if (bad.length >= 6) break;
    }
  }
  return { over, bad };
})()`;

const { send, close } = await connect();
await send('Emulation.setDeviceMetricsOverride', {
  width: W,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});

let failed = 0;
for (const route of ROUTES) {
  await send('Page.navigate', { url: `${BASE}?_=${Date.now()}${route}` });
  await sleep(1500);
  const { over, bad } = await evaluate(send, PROBE);
  if (over > 0) {
    failed++;
    console.log(`FAIL  ${route.padEnd(14)} 溢出 ${over}px`);
    bad.forEach((b) => console.log(`        ${b}`));
  } else {
    console.log(` ok   ${route.padEnd(14)} 0px`);
  }
}

console.log(failed ? `\n${failed} 条路由横向溢出` : `\n${W}px 下 9 条路由全部无横向溢出`);
close();
process.exit(failed ? 1 : 0);
