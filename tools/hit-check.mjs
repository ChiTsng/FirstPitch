// Contact alignment, front-loaded speed, replay and lifecycle of the title hit.
import assert from 'node:assert/strict';
import { connect, evaluate, sleep } from './cdp.mjs';
const base = process.argv.find(a => a.startsWith('--url='))?.slice(6) ?? 'http://127.0.0.1:5176/';
const { send, close } = await connect();
const run = code => evaluate(send, code);
const phase = () => run('document.querySelector(".opening").dataset.phase');
async function load(width, height = 900) {
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
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
async function checkLanding(shot) {
  await run(`window.hitEffects = document.getAnimations().filter(a => !(a instanceof CSSAnimation)); hitEffects.forEach(a => a.pause())`);
  const ball = await seek(1514);
  const scene = await run(`(() => {
    const image = document.querySelector('.opening__image'), style = getComputedStyle(image), r = image.getBoundingClientRect();
    const ring = document.querySelector('.opening__landing').getBoundingClientRect();
    const actions = document.querySelector('.opening__actions').getBoundingClientRect();
    const scale = Math.max(r.width/1672,r.height/941);
    return { left:r.left+(r.width-1672*scale)*parseFloat(style.backgroundPositionX)/100,
      top:r.top+(r.height-941*scale)*parseFloat(style.backgroundPositionY)/100,
      width:1672*scale,height:941*scale,viewport:innerWidth,actionsBottom:actions.bottom,
      ring:{x:ring.x+ring.width/2,y:ring.y+ring.height/2} };
  })()`);
  // Independently annotated landmarks on the actual artwork: grass, stands, grass.
  const anchor = [[.708,.555],[.775,.455],[.805,.57]][shot];
  const target = {x:scene.left+scene.width*anchor[0],y:scene.top+scene.height*anchor[1]};
  assert.ok(distance(ball,target)<2,'The flight must reach its named artwork landmark');
  assert.ok(distance(scene.ring,target)<1,'The arrival ring must mark the same landmark');
  assert.ok(target.x>12 && target.x<scene.viewport-12,'All destinations must stay in frame');
  if(scene.viewport<=640) assert.ok(target.y>scene.actionsBottom+8,'Mobile controls must not cover the destination');
}
try {
  for (const [width,height] of [[1440,900],[320,740],[390,844],[430,932],[768,1024],[1024,1366]]) {
    await load(width,height);
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
    await checkLanding(0);
    await run('hitEffects.forEach(a => a.finish())');
    await sleep(60);
    assert.equal(await phase(),'landed');
    for (const [shot,title] of [[1,'高飞长打'],[2,'直奔深处'],[0,'一记平射']]) {
      await run(`document.querySelector('.opening__swing').click()`);
      await sleep(25);
      assert.equal(await phase(),'flight','One click starts the next hit');
      await checkLanding(shot);
      await run(`document.getAnimations().filter(a => !(a instanceof CSSAnimation)).forEach(a => a.finish())`);
      await sleep(60);
      assert.equal(await run(`document.querySelector('.opening__status strong').textContent`),title);
    }
    assert.equal(await run('document.documentElement.scrollWidth > innerWidth'),false);
    console.log(`ok ${width}x${height} contact, speed, 3 artwork-aligned destinations, visible landings and replay`);
  }
  await load(1440);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1050,y:240});
  await sleep(70); // Hit while the parallax transition is still moving.
  await run(`document.querySelector('.opening__swing').click()`);
  await sleep(35);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1350,y:380});
  await checkLanding(0);
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await sleep(150);
  assert.equal(await phase(),'ready','Resizing mid-flight resets the old camera and unlocks the ball');
  await run(`document.querySelector('.opening__swing').click()`);
  await sleep(30);
  await checkLanding(1);
  console.log('ok moving camera stays aligned; resizing resets and recalculates the next destination');
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
