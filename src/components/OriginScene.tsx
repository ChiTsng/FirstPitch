import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { usePrefersReducedMotion } from '../hooks/useLocalStorage';
import { PLANS, type FigureId, type Frame } from './originChoreography';
import { Puppet, type PuppetHandle } from './puppet/Puppet';

const STEPS = [
  {
    short: '一个人',
    title: '一个人：扔出去，再自己捡回来',
    description: '球扔出去，落地滚远，还得自己跑去捡回来。现在只有动作，还没有队友，也没有攻守。',
  },
  { short: '两个人', title: '两个人：让球来回', description: '有人接住，再传回来。两个人合作，让抛接持续下去。' },
  {
    short: '三个人',
    title: '三个人：有人想把球打走',
    description: '投手和捕手合作，打者想把球打走。第三个人，让合作变成了攻守对抗。',
  },
];

/** 新的人出场要先淡入（见 teaching.css），等他站稳了才开始 */
const ENTRANCE_MS = 380;

const move = (x: number, y: number) => `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;

/**
 * 第 00 章的观察室：一个人 → 两个人 → 三个人。
 *
 * 选中人数就开始循环播放；离开视野就停，回到视野从头播；开着「减少动态效果」时只显示静止画面。
 * 同一个人数再点一次，从头播。
 *
 * 节拍由一个 Web Animations 的「时钟」提供（无限循环、什么也不画），
 * 每一帧读它的进度，交给 originChoreography 算出整个画面再画上去：
 * 球、人的姿势、闪光全部出自同一个函数，所以永远对得上；整个过程不经过 React 渲染。
 * 时钟用 WAAPI 而不是自己记时间，是因为它能暂停、能拖到任意时刻 —— 录屏和回归检查都靠这一点。
 */
export function OriginScene() {
  const uid = useId().replace(/:/g, '');
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  // 每次点人数都加一：同一个人数再点一次也会从头播
  const [take, setTake] = useState(0);
  const [visible, setVisible] = useState(false);
  const figure = useRef<HTMLElement>(null);
  const clock = useRef<SVGGElement>(null);
  const ball = useRef<SVGGElement>(null);
  const popA = useRef<SVGGElement>(null);
  const popB = useRef<SVGGElement>(null);
  const thrower = useRef<PuppetHandle>(null);
  const partner = useRef<PuppetHandle>(null);
  const batter = useRef<PuppetHandle>(null);
  const catcher = useRef<PuppetHandle>(null);
  const handles: Record<FigureId, RefObject<PuppetHandle | null>> = { thrower, partner, batter, catcher };

  // 在视野里才播：省电，也让人每次滚回来都能从头看到
  useEffect(() => {
    const el = figure.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const plan = PLANS[step];
  const rest = plan.at(0);

  const shownStep = useRef(step);
  useLayoutEffect(() => {
    const entering = step > shownStep.current;
    shownStep.current = step;
    const draw = (f: Frame) => {
      if (ball.current) {
        ball.current.style.transform = move(f.ball.x, f.ball.y);
        ball.current.style.opacity = String(f.ball.o);
      }
      for (const g of f.figs) handles[g.id].current?.draw(g.pose, g.x, g.y, g.facing, g.scale);
      for (const p of f.pops) {
        const el = p.id === 'a' ? popA.current : popB.current;
        if (!el) continue;
        el.style.opacity = String(p.o);
        el.style.transform = `${move(p.x, p.y)} scale(${p.s.toFixed(3)}, ${(p.s * p.flat).toFixed(3)})`;
      }
    };
    if (reduced || !visible || !clock.current) {
      draw(plan.at(0));
      return;
    }
    const tick = clock.current.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: plan.duration,
      iterations: Infinity,
      delay: entering ? ENTRANCE_MS : 0,
    });
    let raf = 0;
    const frame = () => {
      const progress = tick.effect?.getComputedTiming().progress;
      draw(plan.at(progress == null ? 0 : progress * plan.duration));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      tick.cancel();
      draw(plan.at(0));
    };
    // handles 里全是 ref，引用稳定，不需要进依赖
  }, [step, take, reduced, visible, plan]);

  const selected = STEPS[step];
  const choose = (i: number) => {
    setStep(i);
    setTake((t) => t + 1);
  };
  const restFig = (id: FigureId) => rest.figs.find((f) => f.id === id)!;

  return (
    <figure ref={figure} className="chapter-scene origin-scene" data-step={step + 1}>
      <div className="chapter-scene__top">
        <span>
          <i /> 观察室
        </span>
        <span>00 / 05</span>
      </div>
      <div className="scene-steps" aria-label="参与人数">
        {STEPS.map((s, i) => (
          <button key={s.title} aria-pressed={step === i} onClick={() => choose(i)}>
            <b>0{i + 1}</b>
            {s.short}
          </button>
        ))}
      </div>
      <svg
        className="origin-scene__drawing"
        viewBox="0 0 560 335"
        role="img"
        aria-labelledby={`${uid}-title`}
      >
        <title id={`${uid}-title`}>
          {selected.title}。{selected.description}
        </title>
        <defs>
          <radialGradient id={`${uid}-floor`}>
            <stop stopColor="#68b99a" stopOpacity=".25" />
            <stop offset="1" stopColor="#68b99a" stopOpacity="0" />
          </radialGradient>
          <marker
            id={`${uid}-arrow`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 10 5 0 10Z" fill="#e6c98b" />
          </marker>
        </defs>
        {/* 节拍器：什么也不画，只给动画一个可以暂停、可以拖动的时钟 */}
        <g ref={clock} className="origin-scene__clock" />
        <ellipse cx="280" cy="265" rx="275" ry="60" fill={`url(#${uid}-floor)`} />
        <path d="M40 267H520" stroke="#acd5bd" strokeOpacity=".2" />

        {plan.paths.map((d) => (
          <path key={d} d={d} className="origin-scene__path" />
        ))}
        {plan.hit && <path d={plan.hit} className="origin-scene__hit" markerEnd={`url(#${uid}-arrow)`} />}

        {plan.figures.map(({ id, look }) => {
          const f = restFig(id);
          const puppet = (
            <Puppet
              key={id}
              look={look}
              pose={f.pose}
              x={f.x}
              y={f.y}
              facing={f.facing}
              scale={f.scale}
              handle={handles[id]}
              className={id === 'thrower' ? 'origin-scene__solo' : id === 'batter' ? 'origin-scene__batter' : undefined}
            />
          );
          // 新出场的人淡入；外面包一层，免得入场动画的 transform 和人自己的位置打架
          return id === 'thrower' ? (
            puppet
          ) : (
            <g key={id} className="origin-scene__enter">
              {puppet}
            </g>
          );
        })}

        {step === 2 && (
          <>
            <text x="196" y="66" className="origin-scene__flight-label">
              击向场内 ↖
            </text>
            <text x="226" y="203" className="origin-scene__flight-label">
              投球 →
            </text>
          </>
        )}

        {/* 球被碰到的那一下：接住、击中、落地 */}
        <g ref={popA} className="origin-scene__pop" style={{ opacity: 0 }}>
          <circle r="13" />
        </g>
        <g ref={popB} className="origin-scene__pop" style={{ opacity: 0 }}>
          <circle r="13" />
        </g>

        <g
          ref={ball}
          className="origin-scene__ball"
          style={{ transform: move(rest.ball.x, rest.ball.y), opacity: rest.ball.o }}
        >
          <circle r="12" fill="#f5d796" opacity=".14" />
          <circle r="5.5" fill="#fff4d5" />
          <path d="M-2-4Q2 0-2 4" stroke="#a94743" fill="none" strokeWidth="1.1" />
        </g>

        <g className="origin-scene__labels">
          <text x="130" y="298">
            {step < 2 ? '抛球的人' : '投手 · 防守'}
          </text>
          {step >= 1 && <text x="435" y="298">{step === 2 ? '捕手 · 防守' : '接球的伙伴'}</text>}
          {step === 2 && (
            <text x="329" y="288" className="origin-scene__attack">
              打者 · 进攻
            </text>
          )}
        </g>
        <text x="280" y="28" className="origin-scene__view">
          侧面关系示意 · 不按距离比例
        </text>
      </svg>
      <figcaption>
        <span className="chapter-scene__index" aria-hidden="true">
          {step + 1}
        </span>
        <div>
          <strong>{selected.title}</strong>
          <p>{selected.description}</p>
        </div>
      </figcaption>
    </figure>
  );
}
