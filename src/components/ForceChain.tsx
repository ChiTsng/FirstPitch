import { useState } from 'react';
import {
  applyWalk,
  forceChain,
  homeRunRuns,
  withBases,
  type Bases,
} from '../engine';
import { EXPLANATIONS } from '../content/explanations';
import { FieldCanvas } from './field/FieldCanvas';
import {
  advanceArrowFor,
  runnerMarker,
  type FieldArrow,
  type FieldMarker,
} from './field/markers';
import { Rich } from './Rich';

/**
 * 强迫链。测验里最薄弱的概念，所以这个组件做得最细。
 *
 * 点垒放跑者，然后按不同的情况看链条怎么亮、怎么断：
 *   打进界内  → 从本垒开始，连续有人的垒依次被迫，链条在第一个空垒处断开
 *   保送      → 只推动被迫的跑者，满垒时挤回 1 分
 *   打者先出局 → 链条从源头断裂，所有人都只能触杀
 *   飞球被直接接住 → 打者出局，跑者必须回原垒
 */

type Mode = 'idle' | 'inPlay' | 'walk' | 'batterOut' | 'caught';

const MODE_LABEL: Record<Exclude<Mode, 'idle'>, string> = {
  inPlay: '打者把球打进界内',
  walk: '四坏球保送',
  batterOut: '打者在一垒先出局',
  caught: '飞球被直接接住',
};

export function ForceChain() {
  const [bases, setBases] = useState<Bases>(() => withBases(1, 2));
  const [mode, setMode] = useState<Mode>('idle');

  const chain = forceChain(bases, mode === 'batterOut');
  const occupied = ([1, 2, 3] as const).filter((b) => bases[b]);

  function toggle(base: 1 | 2 | 3) {
    setBases((b) => ({ ...b, [base]: !b[base] }));
    setMode('idle');
  }

  // ── 根据当前模式算出球场上要画什么 ──────────────
  const markers: FieldMarker[] = [];
  const arrows: FieldArrow[] = [];
  let explanation = '点一、二、三垒放上跑者，再选下面的情况，看谁被迫、谁不被迫。';
  const highlight: (1 | 2 | 3 | 4)[] = [];

  if (mode === 'inPlay' || mode === 'walk') {
    for (const b of occupied) {
      const forced = chain.forced.includes(b);
      markers.push(runnerMarker(b, forced ? 'runner-forced' : 'runner', forced ? '迫' : '自'));
      if (forced) {
        arrows.push(advanceArrowFor(b, 'forced'));
        highlight.push((b + 1) as 1 | 2 | 3 | 4);
      }
    }
    if (mode === 'inPlay') {
      arrows.push(advanceArrowFor('batter', 'throw'));
      highlight.push(1);
      explanation = EXPLANATIONS['force.chain'] + ' 打者自己在上一垒前出局，严格分类不叫封杀。';
      if (chain.notForced.length) {
        explanation += ` 这里 ${chain.notForced.map((b) => `${b}垒`).join('、')}的跑者**不被迫**，可以留在原垒 —— 要让他出局必须持球碰到他本人。`;
      }
    } else {
      const walk = applyWalk({ outs: 0, bases, count: { balls: 3, strikes: 0 }, runs: 0 });
      arrows.push(advanceArrowFor('batter', 'throw'));
      explanation = EXPLANATIONS[walk.reason];
      if (walk.runsScored > 0) {
        explanation += ' 三垒跑者被一路挤回本垒，**得 1 分**。';
        highlight.push(4);
      }
    }
  } else if (mode === 'batterOut') {
    for (const b of occupied) markers.push(runnerMarker(b, 'runner', '自'));
    explanation = EXPLANATIONS['force.broken'];
  } else if (mode === 'caught') {
    for (const b of occupied) markers.push(runnerMarker(b, 'runner-safe', '回'));
    for (const b of occupied) highlight.push(b);
    explanation =
      '飞球被**直接接住** → 打者出局。跑者必须**回到原垒**（不是下一个垒）才能再前进。提前离垒的人，防守方持球**踩他的原垒**就出局，不需要触杀 —— 这就是[[回垒不及被双杀]]和[[三杀]]的来源。';
  } else {
    for (const b of occupied) markers.push(runnerMarker(b, 'runner'));
  }

  // 得分潜力：顺带说明「一垒空着」的价值
  const hrRuns = homeRunRuns(bases);

  return (
    <div className="panel">
      <div className="panel__title">强迫链</div>
      <p className="panel__hint">
        打者必须上一垒，使从一垒起连续有人的跑者被迫前进。红色表示已有跑者的强迫关系；金色表示打者上一垒。
      </p>

      <div className="panel__grid">
        <div>
          <FieldCanvas
            layer={3}
            view="infield"
            markers={markers}
            arrows={arrows}
            highlightBases={highlight}
            title={`内野示意图。${occupied.length ? `${occupied.join('、')}垒有跑者` : '垒上无人'}${
              mode === 'idle' ? '' : `，情况：${MODE_LABEL[mode]}`
            }。被迫前进的跑者标红，不被迫的标白。`}
          />
          <div className="field-legend">
            <span>
              <i style={{ background: 'var(--lamp-out)' }} />
              被迫（封杀，踩垒即可）
            </span>
            <span>
              <i style={{ background: 'var(--bg-raised)', border: '1px solid var(--chalk)' }} />
              不被迫（须触杀）
            </span>
          </div>
        </div>

        <div>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)', marginBottom: 'var(--sp-2)' }}>
            放跑者
          </p>
          <div className="btn-row" style={{ marginTop: 0 }}>
            {([1, 2, 3] as const).map((b) => (
              <button
                key={b}
                className="btn btn--sm"
                aria-pressed={bases[b]}
                onClick={() => toggle(b)}
              >
                {b} 垒
              </button>
            ))}
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => {
                setBases(withBases());
                setMode('idle');
              }}
            >
              清空
            </button>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)', marginBottom: 'var(--sp-2)' }}>
            然后发生了
          </p>
          <div className="btn-row" style={{ marginTop: 0 }}>
            {(Object.keys(MODE_LABEL) as (keyof typeof MODE_LABEL)[]).map((m) => (
              <button
                key={m}
                className="btn btn--sm"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>

          <p className="explain" aria-live="polite">
            <Rich>{explanation}</Rich>
          </p>

          <p style={{ fontSize: '0.86rem', color: 'var(--ink-faint)' }}>
            顺带一提：现在这个局面被打出本垒打是 <b>{hrRuns}</b> 分（1 + 垒上跑者数）。
            {!bases[1] && occupied.length > 0 && ' 一垒空着，所以保送一个人也不会丢分 —— 这正是故意保送的前提。'}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 给别的页面用：只画一个静态局面，不带交互。 */
export function ForceSnapshot({
  bases,
  batterRetired = false,
  title,
}: {
  bases: (1 | 2 | 3)[];
  batterRetired?: boolean;
  title: string;
}) {
  const b = withBases(...bases);
  const chain = forceChain(b, batterRetired);
  return (
    <FieldCanvas
      layer={3}
      view="infield"
      title={title}
      markers={bases.map((base) =>
        runnerMarker(
          base,
          chain.forced.includes(base) ? 'runner-forced' : 'runner',
          chain.forced.includes(base) ? '迫' : '自',
        ),
      )}
      arrows={chain.forced.map((base) => advanceArrowFor(base, 'forced'))}
    />
  );
}
