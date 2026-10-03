import { useState, type CSSProperties } from 'react';
import { RACE_SCENARIOS, type RaceScenario } from '../content/timing';
import { Rich } from './Rich';

/**
 * 赛跑计时。把「来不来得及」变成看得见的时间条。
 *
 * 防守方那一侧是**串联**的：投球结束捕手才能接、接了才能传。
 * 跑者那一侧是一段独立的时间。两条条谁先到头，谁就赢 —— 通常差十分之一秒。
 * 滑块可以调每一段的用时，实时看结果怎么翻过来。
 */

export function RaceTimeline({ scenarioId }: { scenarioId?: string }) {
  const [id, setId] = useState(scenarioId ?? RACE_SCENARIOS[0].id);
  const scenario = RACE_SCENARIOS.find((s) => s.id === id) ?? RACE_SCENARIOS[0];
  return <RaceBoard key={scenario.id} scenario={scenario} onPick={scenarioId ? undefined : setId} pickedId={id} />;
}

function RaceBoard({
  scenario,
  onPick,
  pickedId,
}: {
  scenario: RaceScenario;
  onPick?: (id: string) => void;
  pickedId: string;
}) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(scenario.segments.map((s) => [s.id, s.seconds])),
  );

  const defense = scenario.segments.filter((s) => s.side === 'defense');
  const runner = scenario.segments.filter((s) => s.side === 'runner');

  const defenseTotal = defense.reduce((sum, s) => sum + values[s.id], 0);
  const runnerTotal = runner.reduce((sum, s) => sum + values[s.id], 0);
  const scale = Math.max(defenseTotal, runnerTotal) * 1.06;
  const defenseFirst = defenseTotal < runnerTotal;
  const margin = Math.abs(defenseTotal - runnerTotal);

  let offset = 0;

  return (
    <div className="panel">
      <div className="panel__title">赛跑计时 · {scenario.title}</div>

      {onPick && (
        <div className="btn-row" style={{ marginTop: 0 }}>
          {RACE_SCENARIOS.map((s) => (
            <button
              key={s.id}
              className="btn btn--sm"
              aria-pressed={s.id === pickedId}
              onClick={() => onPick(s.id)}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      <p className="panel__hint">
        <Rich>{scenario.setup}</Rich>
      </p>

      {/* --tick 是一格 0.5 s 有多宽。刻度得按真实时间画，
          随便每 10% 一道就成了装饰刻度，那是骗人的。 */}
      <div
        className="race"
        style={{ '--tick': `${((0.5 / scale) * 100).toFixed(3)}%` } as CSSProperties}
      >
        <div className="race__row">
          <span className="race__label">防守方</span>
          <span className="race__track">
            {defense.map((s, i) => {
              const left = (offset / scale) * 100;
              const width = (values[s.id] / scale) * 100;
              offset += values[s.id];
              return (
                <span
                  key={s.id}
                  className={`race__seg race__seg--${i === 0 ? 'defense' : 'defense-2'}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${s.label}：${values[s.id].toFixed(2)} s`}
                >
                  {width > 14 ? `${values[s.id].toFixed(1)}s` : ''}
                </span>
              );
            })}
          </span>
          <span className="race__total">{defenseTotal.toFixed(2)}s</span>
        </div>

        <div className="race__row">
          <span className="race__label">跑者</span>
          <span className="race__track">
            {runner.map((s) => (
              <span
                key={s.id}
                className="race__seg race__seg--runner"
                style={{ left: 0, width: `${(values[s.id] / scale) * 100}%` }}
                title={`${s.label}：${values[s.id].toFixed(2)} s`}
              >
                {values[s.id].toFixed(1)}s
              </span>
            ))}
          </span>
          <span className="race__total">{runnerTotal.toFixed(2)}s</span>
        </div>
      </div>

      <p className="race__verdict" aria-live="polite">
        <Rich>{defenseFirst ? scenario.defenseWins : scenario.runnerWins}</Rich>
        {`　差 ${margin.toFixed(2)} 秒。`}
      </p>

      <div style={{ marginTop: 'var(--sp-5)' }}>
        {scenario.segments.map((s) => (
          <div key={s.id}>
            <div className="slider-row">
              <label htmlFor={`race-${scenario.id}-${s.id}`}>{s.label}</label>
              <input
                id={`race-${scenario.id}-${s.id}`}
                className="slider"
                type="range"
                min={s.min}
                max={s.max}
                step={0.05}
                value={values[s.id]}
                /* CSS 读不到 input 的 value，已走过的那一段只能由这里算好递进去 */
                style={
                  {
                    '--fill': `${(((values[s.id] - s.min) / (s.max - s.min)) * 100).toFixed(1)}%`,
                  } as CSSProperties
                }
                onChange={(e) =>
                  setValues((v) => ({ ...v, [s.id]: Number(e.target.value) }))
                }
              />
              <output htmlFor={`race-${scenario.id}-${s.id}`}>
                {values[s.id].toFixed(2)}s
              </output>
            </div>
            {s.note && (
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', margin: '0 0 var(--sp-3)' }}>
                {s.note}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="explain">
        <Rich>{scenario.takeaway}</Rich>
      </p>
    </div>
  );
}
