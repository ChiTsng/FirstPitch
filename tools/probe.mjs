// 在无头 Chrome 里跑一段 JS 并打印结果 —— 用来验证布局问题，
// 比如 elementsFromPoint 谁盖在谁上面、getBoundingClientRect 到底多宽。
// 用法: node tools/probe.mjs <url> <表达式> [--w=390 --h=844 --mobile --to=<选择器> --wait=1500]

import { connect, evaluate, sleep } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split('=').slice(1).join('=') : d;
};
const has = (n) => args.includes(`--${n}`);

const [url, expr] = args;
if (!url || !expr) {
  console.error('用法: node tools/probe.mjs <url> <表达式> [选项]');
  process.exit(1);
}

const { send, close } = await connect();
await send('Emulation.setDeviceMetricsOverride', {
  width: Number(opt('w', 1440)),
  height: Number(opt('h', 900)),
  deviceScaleFactor: 1,
  mobile: has('mobile'),
});
await send('Page.navigate', { url });
await sleep(Number(opt('wait', 1500)));

const to = opt('to', '');
if (to) {
  await evaluate(
    send,
    `document.querySelector(${JSON.stringify(to)})?.scrollIntoView({block:'start',behavior:'instant'});window.scrollBy(0,-90);`,
  );
  await sleep(700);
}

console.log(JSON.stringify(await evaluate(send, expr), null, 2));
close();
process.exit(0);
