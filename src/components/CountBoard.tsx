import { useCallback, useState } from 'react';
import {
  applyPitch,
  applyWalk,
  initialState,
  withBases,
  type HalfInningState,
  type PitchResult,
} from '../engine';
import { EXPLANATIONS } from '../content/explanations';
import { Rich } from './Rich';

/**
 * 球数记分板。日本球场风格的 B/S/O 灯板：**B 绿、S 黄、O 红**。
 *
 * 所有判断都走规则引擎（src/engine），这里只负责显示和解释。
 * 每按一次按钮，下面用一句话说明发生了什么、以及**为什么**。
 */

const BUTTONS: { result: PitchResult; label: string }[] = [
  { result: 'calledStrike', label: '看好球' },
  { result: 'swingingStrike', label: '挥空' },
  { result: 'ball', label: '坏球' },
  { result: 'foul', label: '界外' },
  { result: 'foulBunt', label: '触击界外' },
  { result: 'foulTip', label: '擦棒被捕' },
  { result: 'hitByPitch', label: '触身球' },
  { result: 'inPlay', label: '打进界内' },
];

export interface CountBoardProps {
  /** 带跑者的起始局面，用来演示不死三振和满垒保送 */
  initialBases?: (1 | 2 | 3)[];
  initialOuts?: 0 | 1 | 2;
}

export function CountBoard({ initialBases = [], initialOuts = 0 }: CountBoardProps) {
  const makeStart = useCallback(
    (): HalfInningState => ({
      ...initialState(),
      bases: withBases(...initialBases),
      outs: initialOuts,
    }),
    [initialBases.join(','), initialOuts],
  );

  const [state, setState] = useState<HalfInningState>(makeStart);
  const [message, setMessage] = useState<string>(
    '按下面的按钮投一球。每一步都会说明规则为什么这样定。',
  );
  const [catcherHeld, setCatcherHeld] = useState(true);

  const bumpOut = (s: HalfInningState): HalfInningState =>
    s.outs === 2
      ? { ...initialState(), bases: withBases(), outs: 0, runs: s.runs }
      : { ...s, outs: (s.outs + 1) as 0 | 1 | 2 };

  function pitch(result: PitchResult) {
    const r = applyPitch(state, result, { catcherHeld });
    let next = r.state;
    let text = EXPLANATIONS[r.reason];

    if (r.outcome === 'strikeout') {
      const escaped = r.uncaughtThirdStrike?.possible && !catcherHeld;
      const alive = escaped && r.uncaughtThirdStrike?.eligible;
      if (!alive) next = bumpOut(next);
      if (escaped && !r.uncaughtThirdStrike?.eligible) {
        text += ` ${EXPLANATIONS['uncaughtThirdStrike.noFirstOccupied']}`;
      }
      if (next.outs === 0 && state.outs === 2 && !alive) text += ' 三个出局，换攻守。';
    } else if (r.outcome === 'walk' || r.outcome === 'hitByPitch') {
      const w = applyWalk(state);
      next = { ...w.state, runs: w.state.runs };
      text += ` ${EXPLANATIONS[w.reason]}`;
      if (w.runsScored > 0) text += ` **送回 ${w.runsScored} 分。**`;
    }

    setState(next);
    setMessage(text);
  }

  function reset() {
    setState(makeStart());
    setMessage('重新开始。');
  }

  const lamps = (n: number, total: number, kind: 'ball' | 'strike' | 'out') =>
    Array.from({ length: total }, (_, i) => (
      <span key={i} className={`lamp lamp--${kind} ${i < n ? 'is-on' : ''}`} />
    ));

  const runners = ([1, 2, 3] as const).filter((b) => state.bases[b]);

  return (
    <div className="panel">
      <div className="panel__title">球数记分板</div>
      <p className="panel__hint">
        日本球场的灯板顺序是 B（坏球）· S（好球）· O（出局）。试试在 2 好球之后一直按「界外」。
      </p>

      <div className="scoreboard">
        <div className="scoreboard__rows">
          <div className="scoreboard__row">
            <span className="scoreboard__key">B</span>
            <span className="scoreboard__lamps">{lamps(state.count.balls, 3, 'ball')}</span>
          </div>
          <div className="scoreboard__row">
            <span className="scoreboard__key">S</span>
            <span className="scoreboard__lamps">{lamps(state.count.strikes, 2, 'strike')}</span>
          </div>
          <div className="scoreboard__row">
            <span className="scoreboard__key">O</span>
            <span className="scoreboard__lamps">{lamps(state.outs, 2, 'out')}</span>
          </div>
        </div>
        <div className="scoreboard__runs">
          <span>垒上 {runners.length ? runners.map((b) => `${b}垒`).join(' ') : '无人'}</span>
          <span>得分 {state.runs}</span>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {state.count.balls} 坏 {state.count.strikes} 好，{state.outs} 出局，
        {runners.length ? `${runners.join('、')}垒有人` : '垒上无人'}，得分 {state.runs}。
      </p>

      <div className="btn-row">
        {BUTTONS.map((b) => (
          <button key={b.result} className="btn btn--sm" onClick={() => pitch(b.result)}>
            {b.label}
          </button>
        ))}
        <button className="btn btn--sm btn--ghost" onClick={reset}>
          重置
        </button>
      </div>

      <label className="switch">
        <input
          type="checkbox"
          checked={!catcherHeld}
          onChange={(e) => setCatcherHeld(!e.target.checked)}
        />
        第三个好球捕手漏接（看不死三振成不成立）
      </label>

      <p className="explain" aria-live="polite">
        <Rich>{message}</Rich>
      </p>
    </div>
  );
}
