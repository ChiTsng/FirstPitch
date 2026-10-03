import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/useLocalStorage';
import { HeroBall } from './SceneArt';
import { HitBat } from './HitBat';
import { CONTACT, HIT_STOP, HIT_DURATION, HITS, hitFlight, stadiumPoint } from './heroHit';

function releaseScene(el: HTMLElement | null) {
  el?.querySelectorAll<HTMLElement>('.opening__image, .opening__playfield').forEach(layer => {
    layer.style.removeProperty('transform');
    layer.style.removeProperty('transition');
  });
}

/** Cinematic opening. Per-frame motion stays on composited layers, outside React. */
export function HeroPrototype() {
  const root = useRef<HTMLElement>(null);
  const animations = useRef<Animation[]>([]);
  const busy = useRef(false);
  const take = useRef(0);
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<'ready' | 'flight' | 'landed'>('ready');
  const [visible, setVisible] = useState(true);
  const [shot, setShot] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let inView = true;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!inView || document.hidden || reduced) return;
      const depth = Math.min(el.offsetHeight, Math.max(0, -el.getBoundingClientRect().top));
      el.style.setProperty('--scroll-depth', `${depth * .16}px`);
    };
    const scroll = () => { if (!frame && inView) frame = requestAnimationFrame(update); };
    const visibility = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      visibility();
      scroll();
    });
    observer.observe(el);
    window.addEventListener('scroll', scroll, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scroll);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [reduced]);
  useEffect(() => () => { animations.current.forEach(a => a.cancel()); }, []);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let width = el.clientWidth, height = el.clientHeight;
    const observer = new ResizeObserver(() => {
      if (width === el.clientWidth && height === el.clientHeight) return;
      width = el.clientWidth; height = el.clientHeight;
      animations.current.forEach(a => a.cancel());
      busy.current = false;
      releaseScene(el);
      setPhase('ready');
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (reduced) {
      animations.current.forEach(a => a.cancel());
      releaseScene(root.current);
      busy.current = false;
      setPhase(previous => previous === 'flight' ? 'landed' : previous);
    }
  }, [reduced]);
  useEffect(() => {
    if (phase !== 'flight' || reduced) return;
    animations.current.forEach(a => {
      if (visible && a.playState === 'paused') a.play();
      else if (!visible && a.playState === 'running') a.pause();
    });
  }, [visible, phase, reduced]);

  const hit = () => {
    if (busy.current) return;
    animations.current.forEach(a => a.cancel());
    animations.current = [];
    releaseScene(root.current);
    const nextShot = take.current++ % HITS.length;
    setShot(nextShot);
    if (reduced) { setPhase('landed'); return; }
    const ball = root.current?.querySelector<HTMLButtonElement>('.opening__ball');
    const stage = root.current?.querySelector<HTMLDivElement>('.opening__playfield');
    const trail = root.current?.querySelector<SVGSVGElement>('.opening__trajectory');
    const stadium = root.current?.querySelector<HTMLDivElement>('.opening__image');
    if (ball && stage && trail && stadium) {
      busy.current = true;
      // Freeze the current camera, including any in-progress parallax transition.
      // Pointer/scroll updates must not move the scenery away from the flight target.
      for (const layer of [stadium, stage]) {
        const transform = getComputedStyle(layer).transform;
        layer.style.transition = 'none';
        layer.style.transform = transform;
      }
      const matrix = new DOMMatrixReadOnly(phase === 'ready' ? getComputedStyle(ball).transform : undefined);
      const w = stage.clientWidth, h = stage.clientHeight;
      const origin = { x: ball.offsetLeft + ball.offsetWidth / 2, y: ball.offsetTop + ball.offsetHeight / 2 };
      const start = { x: origin.x + matrix.m41, y: origin.y + matrix.m42 };
      const background = getComputedStyle(stadium);
      const target = stadiumPoint(HITS[nextShot], stadium.getBoundingClientRect(), {
        x: parseFloat(background.backgroundPositionX) / 100,
        y: parseFloat(background.backgroundPositionY) / 100,
      });
      const stageRect = stage.getBoundingClientRect();
      const end = { x: target.x - stageRect.left, y: target.y - stageRect.top };
      const plan = hitFlight(start, origin, end, h, nextShot, Math.atan2(matrix.b, matrix.a) * 180 / Math.PI);
      trail.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const path = trail.querySelector('path')!;
      path.setAttribute('d', plan.path);
      const bat = stage.querySelector<SVGSVGElement>('.opening__bat')!;
      const impact = stage.querySelector<HTMLElement>('.opening__impact')!;
      const landing = stage.querySelector<HTMLElement>('.opening__landing')!;
      const scale = Math.min(1.5, ball.offsetWidth * 1.65 / 440);
      Object.assign(bat.style, { width: `${440 * scale}px`, left: `${start.x - 90 * scale}px`, top: `${start.y - 55 * scale}px` });
      Object.assign(impact.style, { left: `${start.x}px`, top: `${start.y}px`, width: `${ball.offsetWidth * 1.25}px` });
      Object.assign(landing.style, { left: `${plan.end.x}px`, top: `${plan.end.y}px` });
      // Every effect shares the same document timeline, including pause/resume offscreen.
      const epoch = document.timeline.currentTime;
      const animate = (el: Element, frames: Keyframe[], duration: number, delay = 0) => {
        const a = el.animate(frames, { duration, delay, fill: 'both', easing: 'linear' });
        if (typeof epoch === 'number') a.startTime = epoch;
        animations.current.push(a);
        return a;
      };
      const clock = animate(ball, plan.ball, HIT_DURATION);
      animate(path, plan.wake, HIT_DURATION);
      animate(bat, [
        { offset: 0, transform: 'rotate(-64deg)', opacity: 0 },
        { offset: .16, transform: 'rotate(-60deg)', opacity: 1 },
        { offset: .34, transform: 'rotate(-40deg)', opacity: 1 },
        { offset: CONTACT / 525, transform: 'rotate(0deg)', opacity: 1 },
        { offset: (CONTACT + HIT_STOP) / 525, transform: 'rotate(0deg)', opacity: 1 },
        { offset: .74, transform: 'rotate(75deg)', opacity: .9 },
        { offset: 1, transform: 'rotate(118deg)', opacity: 0 },
      ], 525);
      animate(impact, [
        { transform: 'translate(-50%, -50%) scale(.35)', opacity: 0 },
        { offset: .1, transform: 'translate(-50%, -50%) scale(.8)', opacity: 1 },
        { offset: .3, transform: 'translate(-50%, -50%) scale(.95)', opacity: .8 },
        { transform: 'translate(-50%, -50%) scale(1.4)', opacity: 0 },
      ], 240, CONTACT);
      animate(stadium, [
        { translate: '0 0' }, { translate: '-6px 3px' }, { translate: '4px -2px' }, { translate: '-2px 1px' }, { translate: '0 0' },
      ], 190, CONTACT);
      const landingEffect = animate(landing, [
        { transform: 'translate(-50%, -50%) scale(.1)', opacity: 0 },
        { offset: .22, transform: 'translate(-50%, -50%) scale(.8)', opacity: .9 },
        { transform: 'translate(-50%, -50%) scale(2)', opacity: 0 },
      ], 650, HIT_DURATION - 180);
      landingEffect.onfinish = () => releaseScene(root.current);
      clock.onfinish = () => { busy.current = false; setPhase('landed'); };
      setPhase('flight');
    }
  };

  return (
    <section ref={root} className={`opening ${visible ? 'is-visible' : ''}`} data-phase={phase} aria-label="棒球，是从这里长出来的"
      onPointerMove={e => {
        if (reduced || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--look-x', `${(e.clientX / r.width - .5) * 12}px`);
        e.currentTarget.style.setProperty('--look-y', `${((e.clientY - r.top) / r.height - .5) * 10}px`);
      }} onPointerLeave={e => { e.currentTarget.style.setProperty('--look-x', '0px'); e.currentTarget.style.setProperty('--look-y', '0px'); }}>
      <div className="opening__image" aria-hidden="true" />
      <div className="opening__atmosphere" aria-hidden="true"><i/><i/><i/></div>
      <div className="opening__grain" aria-hidden="true" />
      <div className="opening__copy">
        <div className="opening__eyebrow"><span/> 第一球 · FIRST PITCH</div>
        <h1>棒球，<br/>是从这里<br/><em>长出来的。</em></h1>
        <p>不必先背规则。<br/>从一个人抛出的一颗球，走进整座球场。</p>
        <div className="opening__actions">
          <a className="opening__enter" href="#/#layer-0">走进第一球 <span aria-hidden="true">↗</span></a>
          <button className="opening__swing" onClick={hit} disabled={phase === 'flight'}>{phase === 'landed' ? '再来一球' : phase === 'flight' ? '这一棒，打远点！' : '试着挥棒'} <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      <div className="opening__playfield">
        <svg className="opening__trajectory" viewBox="0 0 700 600" fill="none" aria-hidden="true"><path pathLength="1"/></svg>
        <div className="opening__orbit" aria-hidden="true"/>
        <button className="opening__ball" aria-label="挥棒，将棒球打向球场" onClick={hit} disabled={phase !== 'ready'}><HeroBall/></button>
        <HitBat/>
        <div className="opening__impact" aria-hidden="true"><svg viewBox="-100 -100 200 200" fill="none"><path d="M0-22 5-6 23-3 7 5 10 22 -2 8 -21 12 -8-2 -18-18 -4-8Z" fill="currentColor" stroke="none"/>{Array.from({length:9},(_,i)=><path key={i} d={`M45 0H${i%2 ? 69 : 88}`} transform={`rotate(${i*40+10})`}/>)}</svg><span>咔！</span></div>
        <span className="opening__ball-note" aria-hidden="true">一颗球。一个世界。<i/></span>
        <div className="opening__landing" aria-hidden="true"/>
      </div>
      <div className="opening__status" role="status">{phase === 'landed' && <><strong>{HITS[shot].name}</strong><span>{HITS[shot].note}</span><small>再来一球，换个方向 ↗</small></>}</div>
      <div className="opening__bottom"><span>六层演化 <i/> 一场比赛</span><a href="#/#journey">向下探索 <b aria-hidden="true">↓</b></a><span className="opening__edition">棒球的起点 / 00</span></div>
    </section>
  );
}
