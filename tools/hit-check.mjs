// Contact alignment, front-loaded speed, replay and lifecycle of the title hit.
import assert from 'node:assert/strict';
import { connect, evaluate, sleep } from './cdp.mjs';
const base = process.argv.find(a => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:5176/';
const { send, close } = await connect();
const run = code => evaluate(send, code);
const phase = () => run('document.querySelector(".opening").dataset.phase');
async function load(width) {
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Page.navigate', { url: `${base}?hit-check=${Date.now()}#/` });
  await sleep(1400);
}
async function seek(t) {
  await run(`hitEffects.forEach(a => a.currentTime = ${t})`);
  await sleep(25);
  return run(`(() => { const r = document.querySelector('.opening__ball').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
}
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
try {
  for (const width of [1440,390]) {
    await load(width);
    // The same hit works with keyboard focus, not just a pointer.
    await run(`document.querySelector('.opening__ball').focus()`);
    await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});
    await send('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await sleep(35);
    assert.equal(await phase(),'flight');
    await run(`window.hitEffects = document.getAnimations().filter(a => !(a instanceof CSSAnimation)); hitEffects.forEach(a => a.pause())`);
    const before = await seek(120), contact = await seek(220);
    assert.ok(distance(before,contact)<1, 'Ball must wait for the bat');
    const sweet = await run(`(() => { const p = new DOMPoint(90,55).matrixTransform(document.querySelector('.opening__bat').getScreenCTM()); return {x:p.x,y:p.y}; })()`);
    assert.ok(distance(contact,sweet)<2, 'Bat sweet spot meets the ball');
    const stopped = await seek(245);
    assert.ok(distance(contact,stopped)<1, 'Contact has a short hit stop');
    const fast = await seek(415), far = await seek(1000), last = await seek(1150);
    assert.ok(distance(contact,fast) > distance(far,last)*4, 'Departure must be much faster than the distant flight');
    await run('hitEffects.forEach(a => a.finish())');
    await sleep(60);
    assert.equal(await phase(),'landed');
    for (const title of ['高飞长打','直奔深处','一记平射']) {
      await run(`document.querySelector('.opening__swing').click()`);
      await sleep(25);
      assert.equal(await phase(),'flight','One click starts the next hit');
      await run(`document.getAnimations().filter(a => !(a instanceof CSSAnimation)).forEach(a => a.finish())`);
      await sleep(60);
      assert.equal(await run(`document.querySelector('.opening__status strong').textContent`),title);
    }
    assert.equal(await run('document.documentElement.scrollWidth > innerWidth'),false);
    console.log(`ok ${width}px keyboard hit, contact, hit stop, speed profile, 3 routes and single-click replay`);
  }
  await load(1440);
  await run(`document.querySelector('.opening__swing').click()`);
  await sleep(700);
  await run(`window.hitClock = document.querySelector('.opening__ball').getAnimations()[0]; document.querySelector('#layer-1').scrollIntoView({behavior:'instant'})`);
  await sleep(250);
  const paused = await run('hitClock.currentTime');
  await sleep(200);
  assert.equal(await run('hitClock.currentTime'),paused);
  await run('window.scrollTo({top:0,behavior:"instant"})');
  await sleep(80);
  assert.equal(await run('hitClock.playState'),'running');
  assert.equal(await run(`document.querySelector('.opening__bat').getAnimations()[0].playState`),'finished','Finished bat must not swing again when returning');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await sleep(100);
  assert.equal(await phase(),'landed');
  assert.equal(await run(`document.querySelector('.opening__swing').disabled`),false);
  await run(`document.querySelector('.opening__swing').click()`);
  assert.equal(await phase(),'landed');
  console.log('ok offscreen pause/resume and motion preference change mid-flight');
} finally { close(); }
