// 滚动帧率实测。视觉重做里滤镜是掉帧的头号嫌疑，所以每批之后都要量一次。
// 用法: node tools/scrollperf.mjs [路由] [--w=1440] [--h=900] [--px=14]
//   路由写成 lab / quiz / 空（首页），不要带 # ——
//   Git Bash 会把 '#/lab' 当成路径去转换。
//
// 无头 Chrome 的 rAF 不锁 vsync，所以这里量到的是**每帧的工作量**，
// 不是真机帧率。足以发现「某一层一挂滤镜就翻几倍」这一类问题。

import { connect, evaluate, sleep } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=').slice(1).join('=') : d;
};
const route = '#/' + (args.find((a) => !a.startsWith('--')) ?? '').replace(/^[#/]+/, '');
const BASE = opt('url', 'http://127.0.0.1:5175/');
const PX = Number(opt('px', 14));

const RUN = `(async () => {
  // scroll-behavior: smooth 会把每帧的 scrollBy 变成一次重新瞄准，页面几乎不动
  const root = document.documentElement;
  const prev = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  const deltas = [];
  await new Promise((done) => {
    let last = performance.now();
    let n = 0;
    const step = (now) => {
      deltas.push(now - last);
      last = now;
      window.scrollBy(0, ${PX});
      if (++n < 180) requestAnimationFrame(step);
      else done();
    };
    requestAnimationFrame(step);
  });
  root.style.scrollBehavior = prev;
  const d = deltas.slice(5).sort((a, b) => a - b);
  const q = (p) => d[Math.floor(d.length * p)];
  return {
    frames: d.length,
    scrolled: Math.round(window.scrollY),
    p50: +q(0.5).toFixed(1),
    p95: +q(0.95).toFixed(1),
    worst: +d[d.length - 1].toFixed(1),
    over20ms: d.filter((x) => x > 20).length,
  };
})()`;

const { send, close } = await connect();
await send('Emulation.setDeviceMetricsOverride', {
  width: Number(opt('w', 1440)),
  height: Number(opt('h', 900)),
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url: `${BASE}?_=${Date.now()}${route}` });
await sleep(2000);

const r = await evaluate(send, RUN);
console.log(
  `${route}  帧 ${r.frames}  滚动 ${r.scrolled}px\n` +
    `  中位 ${r.p50}ms   p95 ${r.p95}ms   最差 ${r.worst}ms   超过 20ms 的帧 ${r.over20ms}`,
);
close();
process.exit(0);
