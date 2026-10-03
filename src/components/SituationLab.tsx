import { useState } from 'react';
import { PRESET, RESULT_LABEL, describePlay, type BattedResult } from '../content/lab';
import { initialState, withBases, type Count, type HalfInningState } from '../engine';
import { FieldCanvas } from './field/FieldCanvas';
import { runnerMarker } from './field/markers';
import { Rich } from './Rich';

/**
 * 情境模拟器。
 *
 * 输入一个局面（出局数、垒上跑者、球数）和一种击球结果，
 * 输出按时间顺序的「可能发生的事」，以及每个**决策点**。
 *
 * 不做物理模拟：合法性和强迫关系全部交给规则引擎，
 * 文字来自 src/content/lab.ts。
 */

const RESULTS: BattedResult[] = [
  'foul',
  'infieldGrounder',
  'grounderThrough',
  'linerCaught',
  'linerDrops',
  'flyCaught',
  'flyDrops',
  'homeRun',
  'bunt',
];

export function SituationLab() {
  const [outs, setOuts] = useState<0 | 1 | 2>(PRESET.state.outs);
  const [bases, setBases] = useState<(1 | 2 | 3)[]>(PRESET.state.bases);
  const [count, setCount] = useState<Count>({
    balls: PRESET.state.balls,
    strikes: PRESET.state.strikes,
  });
  const [result, setResult] = useState<BattedResult | null>(null);

  const state: HalfInningState = {
    ...initialState(),
    outs,
    bases: withBases(...bases),
    count,
  };

  const play = result ? describePlay(state, result) : null;

  function toggleBase(b: 1 | 2 | 3) {
    setBases((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b].sort()));
    setResult(null);
  }

  function loadPreset() {
    setOuts(PRESET.state.outs);
    setBases(PRESET.state.bases);
    setCount({ balls: PRESET.state.balls, strikes: PRESET.state.strikes });
    setResult(null);
  }

  // 球场上画的是「一种典型结果」，不是唯一可能
  const shownBases = play ? play.typical.bases : bases;

  return (
    <div>
      <div className="panel">
        <div className="panel__title">设定局面</div>

        <div className="btn-row" style={{ marginTop: 0 }}>
          <span className="panel-row__label">
            出局数
          </span>
          {([0, 1, 2] as const).map((o) => (
            <button
              key={o}
              className="btn btn--sm"
              aria-pressed={outs === o}
              onClick={() => {
                setOuts(o);
                setResult(null);
              }}
            >
              {o}
            </button>
          ))}
        </div>

        <div className="btn-row">
          <span className="panel-row__label">
            垒上
          </span>
          {([1, 2, 3] as const).map((b) => (
            <button
              key={b}
              className="btn btn--sm"
              aria-pressed={bases.includes(b)}
              onClick={() => toggleBase(b)}
            >
              {b} 垒
            </button>
          ))}
        </div>

        <div className="btn-row">
          <span className="panel-row__label">
            球数
          </span>
          <label className="control-label">
            坏球
            <select
              value={count.balls}
              onChange={(e) =>
                setCount((c) => ({ ...c, balls: Number(e.target.value) as Count['balls'] }))
              }
              className="select"
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="control-label">
            好球
            <select
              value={count.strikes}
              onChange={(e) =>
                setCount((c) => ({ ...c, strikes: Number(e.target.value) as Count['strikes'] }))
              }
              className="select"
            >
              {[0, 1, 2].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn--sm btn--ghost" onClick={loadPreset}>
            载入预设示例
          </button>
        </div>

        <div className="btn-row">
          <span className="panel-row__label">
            击球结果
          </span>
          {RESULTS.map((r) => (
            <button
              key={r}
              className="btn btn--sm"
              aria-pressed={result === r}
              onClick={() => setResult(r)}
            >
              {RESULT_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="panel__grid">
        <div>
          <FieldCanvas
            layer="full"
            view="infield"
            title={
              play
                ? `一种典型结果：${play.typical.caption}`
                : `局面：${outs} 出局，${bases.length ? `${bases.join('、')}垒有人` : '垒上无人'}。`
            }
            markers={shownBases.map((b) => runnerMarker(b, play ? 'runner-safe' : 'runner'))}
            highlightBases={shownBases}
            celebrate={!!play && play.typical.runs > 0}
          />
          {play && (
            <p className="explain">
              <strong>一种典型结果：</strong>
              {play.typical.caption}　出局 +{play.typical.outsAdded}，得分 +{play.typical.runs}。
              <br />
              <span style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>
                真实比赛里还有别的走向，上面列出的才是完整的可能性。
              </span>
            </p>
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: 'var(--sp-3)' }}>
            {play ? `会发生什么 · ${RESULT_LABEL[result!]}` : '选一个击球结果'}
          </h3>
          {play ? (
            <>
              <ol className="timeline">
                {play.steps.map((s, i) => (
                  <li key={i} className={s.decision ? 'is-decision' : ''}>
                    {s.decision && <span className="timeline__tag">决策点</span>}
                    <Rich>{s.text}</Rich>
                  </li>
                ))}
              </ol>
              {play.note && (
                <p className="aside">
                  <Rich>{play.note}</Rich>
                </p>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--ink-faint)' }}>
              先设好出局数和垒上跑者，再选一种击球结果，看规则怎么把它展开。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
