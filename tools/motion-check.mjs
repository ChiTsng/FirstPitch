// Integration checks for the cinematic opening and chapter controls in isolated Chrome.
import assert from 'node:assert/strict';
import { connect, evaluate, sleep } from './cdp.mjs';
const base = process.argv.find(a => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:5175/';
const { send, close } = await connect();
const probe = expression => evaluate(send, expression);
const phase = () => probe('document.querySelector(".opening").dataset.phase');
async function load(motion = 'no-preference', width = 1440) {
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }, { name: 'prefers-color-scheme', value: 'dark' }] });
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
  await send('Page.navigate', { url: `${base}?motion-check=${Date.now()}#/` });
  await sleep(1400);
  assert.equal(await phase(), 'ready');
  assert.equal(await probe('document.querySelectorAll(".chapter").length'), 6);
  assert.equal(await probe('getComputedStyle(document.querySelector(".opening h1")).opacity'), '1');
}
try {
  await load();
  const idle = await probe(`new Promise(resolve => {
    const values = new Set(); let frames = 0;
    const tick = () => { values.add(getComputedStyle(document.querySelector('.opening__ball')).transform); if (++frames < 35) requestAnimationFrame(tick); else resolve(values.size); };
    requestAnimationFrame(tick);
  })`);
  assert.ok(idle > 15, 'Foreground ball should float continuously');
  await probe('document.querySelector(".opening__swing").click()');
  assert.equal(await phase(), 'flight');
  await sleep(310); // Bat windup and hit stop precede the ball's continuous flight.
  const flight = await probe(`new Promise(resolve => {
    const values = new Set(); let frames = 0;
    const tick = () => { values.add(getComputedStyle(document.querySelector('.opening__ball')).transform); if (++frames < 35) requestAnimationFrame(tick); else resolve(values.size); };
    requestAnimationFrame(tick);
  })`);
  assert.ok(flight > 15, 'Hit should follow a continuous curve');
  await sleep(1950);
  assert.equal(await phase(), 'landed');
  assert.match(await probe('document.querySelector(".opening__status").textContent'), /一记平射/);
  await probe('document.querySelector(".opening__swing").click()');
  assert.equal(await phase(), 'flight');
  await sleep(1750);
  assert.equal(await phase(), 'landed');
  assert.match(await probe('document.querySelector(".opening__status").textContent'), /高飞长打/);
  console.log(`ok visible headline, floating ball (${idle} poses), hit (${flight} poses), landing and replay`);

  await probe('document.querySelector("#layer-0 .origin-scene").scrollIntoView({block:"center",behavior:"instant"})');
  await sleep(250);
  assert.equal(await probe('document.querySelector(".opening").classList.contains("is-visible")'), false);
  assert.equal(await probe('getComputedStyle(document.querySelector(".opening__atmosphere i")).animationPlayState'), 'paused');
  // 第 00 章观察室：滚到眼前就开始循环播放，没有播放按钮
  const clock = 'document.querySelector(".origin-scene__clock").getAnimations()';
  assert.equal(await probe('document.querySelector(".origin-play")'), null);
  assert.equal(await probe(`${clock}.length`), 1, 'Origin scene should start playing when it comes into view');
  // Infinity 过不了 CDP 的 JSON 序列化，在页面里比较完再把布尔值拿回来
  assert.equal(await probe(`${clock}[0].effect.getTiming().iterations === Infinity`), true, 'Origin scene should loop');
  // 读计算后的样式，和开场球的检查一致：不管动画由谁驱动都成立
  const poses = (selector, read = 'getComputedStyle(el).transform') => probe(`new Promise(resolve => {
    const el = document.querySelector('${selector}'); const seen = new Set(); let frames = 0;
    const tick = () => { seen.add(${read}); if (++frames < 24) requestAnimationFrame(tick); else resolve(seen.size); };
    requestAnimationFrame(tick);
  })`);
  for (let n = 0; n < 3; n++) {
    // 选中人数就播放；新出场的人先淡入 380 ms，所以等一会儿再采样
    await probe(`document.querySelectorAll('.origin-scene .scene-steps button')[${n}].click()`);
    await sleep(700);
    // 数「人」：一个 data-person 就是一个人
    assert.equal(await probe(`document.querySelectorAll('.origin-scene [data-person]').length`), n + 1);
    assert.ok(await poses('.origin-scene__ball') > 10, `Origin step ${n + 1} should play as soon as it is chosen`);
    // 人是真的在动：投球人的身体（不只是整个人平移）每一帧都在变
    assert.ok(await poses('.origin-scene__solo .person path', 'el.getAttribute("d")') > 10, `Thrower's body should move in step ${n + 1}`);
  }
  // 一个人：扔出去之后要自己跑去捡 —— 人本身必须移动
  await probe(`document.querySelectorAll('.origin-scene .scene-steps button')[0].click()`);
  await sleep(1700);
  assert.ok(await poses('.origin-scene__solo') > 10, 'The lone thrower should run to fetch the ball');
  // 再点同一个人数：从头播
  await probe(`document.querySelectorAll('.origin-scene .scene-steps button')[0].click()`);
  await sleep(30);
  assert.ok(await probe(`${clock}[0].currentTime`) < 400, 'Clicking the active step should restart from the beginning');
  // 离开视野就停，回来接着播
  await probe('document.querySelector("#layer-3").scrollIntoView({behavior:"instant"})');
  await sleep(300);
  assert.equal(await probe(`${clock}.length`), 0, 'Origin scene should stop when scrolled away');
  await probe('document.querySelector("#layer-0 .origin-scene").scrollIntoView({block:"center",behavior:"instant"})');
  await sleep(300);
  assert.equal(await probe(`${clock}.length`), 1, 'Origin scene should resume when scrolled back');
  for (let n = 0; n < 3; n++) {
    await probe(`document.querySelectorAll('.zone-choices button')[${n}].click()`);
    await sleep(60);
    assert.equal(await probe('document.querySelector(".zone-verdict").textContent'), n === 2 ? 'B' : 'S');
  }
  for (let n = 2; n < 6; n++) {
    await probe(`document.querySelector('#layer-${n} .scene-trigger').click()`);
    assert.equal(await probe(`document.querySelector('#layer-${n} .chapter-scene__field').classList.contains('is-expanded')`), true);
  }
  console.log('ok offscreen pause, origin loop / moving bodies / fetch run / restart / offscreen stop, strike-zone center/edge/outside and four field demonstrations');

  await load('reduce', 390);
  assert.equal(await probe('getComputedStyle(document.querySelector(".opening__ball")).animationName'), 'none');
  await probe('document.querySelector(".opening__swing").click()');
  assert.equal(await phase(), 'landed');
  await probe('document.querySelector(".nav__menu").click()');
  assert.equal(await probe('getComputedStyle(document.querySelector(".nav__links")).display'), 'grid');
  await send('Input.dispatchKeyEvent', {type:'keyDown', key:'Escape', code:'Escape', windowsVirtualKeyCode:27});
  assert.equal(await probe('document.querySelector(".nav__menu").getAttribute("aria-expanded")'), 'false');
  await probe('document.querySelector(".nav__menu").click();document.querySelector(".nav__link[href=\\"#/lab\\"]").click()');
  await sleep(250);
  assert.equal(await probe('document.querySelector("h1").textContent'), '情境模拟器');
  assert.equal(await probe('document.querySelector(".nav__menu").getAttribute("aria-expanded")'), 'false');
  console.log('ok reduced-motion interaction, mobile menu, Escape, navigation and cleanup');
} finally { close(); }
