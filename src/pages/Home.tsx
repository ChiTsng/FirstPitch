import { chapterSegments, type ReadingBlock } from './chapterSegments';
import { useEffect, useRef } from 'react';
import { CountBoard } from '../components/CountBoard';
import { DilemmaPlayer } from '../components/DilemmaPlayer';
import { ForceChain } from '../components/ForceChain';
import { HeroPrototype } from '../components/HeroPrototype';
import { LayerQuiz } from '../components/Quiz';
import { RaceTimeline } from '../components/RaceTimeline';
import { Aside, Rich, UL } from '../components/Rich';
import { ChapterScene } from '../components/ChapterScene';
import { SceneArt } from '../components/SceneArt';
import { LAYERS, LAYER_IDS, type ToolName } from '../content/layers';
import { useActiveSection } from '../hooks/useActiveSection';

export function Home() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-seen');
        observer.unobserve(entry.target);
      }
    }, { threshold: .25 });
    root.current?.querySelectorAll('.chapter__head').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <main id="main" className="home-experience" ref={root}>
      <HeroPrototype />
      <section className="journey" id="journey" aria-labelledby="journey-title">
        <div className="journey__intro"><div><span className="eyebrow">一项运动，如何长出来</span><h2 id="journey-title">每一条规则，<br/>都有一个开始。</h2></div><p>一个漏洞，长出一条规则。<br/>六个章节，把看似复杂的比赛一步步展开。</p></div>
        <div className="journey__route">
          {LAYERS.map(l => <a key={l.id} href={`#/#${l.id}`} className="journey__stop"><span className="journey__number">0{l.no}<i>↗</i></span><SceneArt chapter={l.no}/><span className="journey__name">{l.title}</span><span className="journey__dot" aria-hidden="true"/></a>)}
        </div>
      </section>
      <ChapterRail />
      <div className="chapters">
        {LAYERS.map((layer, i) => {
          const next = LAYERS[i+1];
          return <section key={layer.id} id={layer.id} className="chapter" data-no={layer.no}>
            <span id={`${layer.id}-mark`} className="layer-sentinel" aria-hidden="true"/>
            <header className="chapter__head"><div className="chapter__heading"><span className="eyebrow">第 {layer.no} 层</span><h2>{layer.title}</h2><p className="page__lede"><Rich>{layer.lede}</Rich></p></div><span className="chapter__numeral" aria-hidden="true">0{layer.no}</span><SceneArt chapter={layer.no}/></header>
            <div className="chapter__body">
              {chapterSegments(layer.blocks).map((segment, n, all) => segment.tool
                ? <div key={n} className="chapter__workshop"><div className="workshop-label"><span/> 亲手试一试 <i>INTERACTIVE</i></div><Tool name={segment.tool}/></div>
                : <div key={n} className="chapter__reading"><div className="chapter__prose"><Blocks blocks={segment.blocks}/></div>
                    {/* 观察室每章只放一次，跟着这一章的第一段阅读。后面的阅读段（被互动工具隔开的）
                        不再重复同一个面板；正文仍留在左栏，和第一段对齐。 */}
                    {all.findIndex(s => !s.tool) === n && <ChapterScene no={layer.no}/>}</div>)}
              <LayerQuiz ids={layer.quiz} nextId={next?.id} nextTitle={next ? `第 ${next.no} 层 · ${next.title}` : undefined}/>
            </div>
          </section>;
        })}
      </div>
      <section className="journey-finale"><SceneArt chapter={3}/><span className="eyebrow">现在，比赛才刚刚开始</span><h2>六层讲完了。<br/>去看懂每一球。</h2><p>把规则串起来，摆一个局面，或者检验一下直觉。</p><div className="journey-finale__links"><a href="#/principles"><span>01 / 收束</span><strong>规则背后的原理</strong><b>↗</b></a><a href="#/lab"><span>02 / 验证</span><strong>自己摆一场比赛</strong><b>↗</b></a><a href="#/quiz"><span>03 / 检验</span><strong>挑战 12 个关键局面</strong><b>↗</b></a></div></section>
    </main>
  );
}
/** Scroll updates only this rail, leaving the teaching scenes untouched. */
function ChapterRail() {
  const activeId = useActiveSection(LAYER_IDS, LAYER_IDS[0]);
  return <nav className="chapter-rail" aria-label="主线章节">{LAYERS.map(l => <a key={l.id} href={`#/#${l.id}`} aria-current={activeId === l.id ? 'step' : undefined}><span>0{l.no}</span>{l.title}</a>)}</nav>;
}

/** 把内容文件里的 Block 渲染出来。加新的块类型时改这里。 */
export function Blocks({ blocks }: { blocks: ReadingBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'rule-continuation':
            return <div key={i} className="rule-continuation"><span className="eyebrow">{b.name} · 接着看</span><Blocks blocks={b.blocks}/></div>;
          case 'p':
            return (
              <p key={i}>
                <Rich>{b.text}</Rich>
              </p>
            );
          case 'ul':
            return <UL key={i} items={b.items} />;
          case 'h':
            return <h3 key={i}>{b.text}</h3>;
          case 'aside':
            return <Aside key={i} label={b.label} text={b.text} />;
          case 'link':
            return (
              <p key={i}>
                <a href={`#${b.to}`}>{b.text}</a>
              </p>
            );
          case 'hole': {
            // ruleLabel 都写成「规则：某某」。冒号前的两个字是图例，用点阵字压在
            // 制图块的上边线上；冒号后的才是这条规则的名字，用明朝体当小标题。
            const [tag, ...rest] = (b.ruleLabel ?? '规则').split('：');
            const name = rest.join('：');
            return (
              <div key={i} className="hole">
                <Stitch />
                <span className="hole__label">{b.label}</span>
                <p className="hole__claim">
                  <Rich>{b.claim}</Rich>
                </p>
                <div className="rule">
                  <span className="rule__tag">{tag}</span>
                  {name && <p className="rule__name">{name}</p>}
                  <Blocks blocks={b.rule} />
                </div>
              </div>
            );
          }
          case 'tool':
            return <Tool key={i} name={b.name} />;
        }
      })}
    </>
  );
}

/**
 * 漏洞的记号：版心左边留白处的两针缝线。
 * 棒球的缝线针法就是一连串的 ✕，这里只取两针 —— 它是记号，不是装饰。
 */
function Stitch() {
  return (
    <span className="hole__stitch" aria-hidden="true">
      <svg viewBox="0 0 10 28" width="10" height="28">
        <path d="M2.4 3 L7.6 9 M7.6 3 L2.4 9 M2.4 19 L7.6 25 M7.6 19 L2.4 25" />
      </svg>
    </span>
  );
}

function Tool({ name }: { name: ToolName }) {
  switch (name) {
    case 'count':
      return <CountBoard />;
    case 'force':
      return <ForceChain />;
    case 'dilemma-infield':
      return <DilemmaPlayer id="infield" />;
    case 'dilemma-32':
      return <DilemmaPlayer id="count32" />;
    case 'race-steal':
      return <RaceTimeline scenarioId="steal" />;
    case 'race-sacfly':
      return <RaceTimeline scenarioId="sacfly" />;
  }
}
