// 摆在球场上的跑者标记与箭头。
//
// 从 FieldCanvas.tsx 里拆出来，是因为一个文件里同时导出组件和普通函数时，
// React Fast Refresh 会退化成整页重载 —— 反复调样式的时候这一点很要命。
// 这里只有类型和纯函数，FieldCanvas.tsx 那边只留组件。

import { RUNNER_SPOTS, advanceArrow, type Pt } from './geometry';

export interface FieldMarker {
  id: string;
  at: Pt;
  label?: string;
  kind: 'runner' | 'runner-forced' | 'runner-safe' | 'runner-out' | 'ball' | 'note';
}

export interface FieldArrow {
  id: string;
  from: Pt;
  to: Pt;
  /** streak 是被打出去的球留下的拖痕，不带箭头 */
  tone?: 'forced' | 'free' | 'throw' | 'muted' | 'streak';
  dashed?: boolean;
}

/** 方便别的组件摆跑者 */
export function runnerMarker(
  base: 1 | 2 | 3,
  kind: FieldMarker['kind'] = 'runner',
  label?: string,
): FieldMarker {
  return { id: `runner-${base}`, at: RUNNER_SPOTS[base], kind, label };
}

/** 方便别的组件画「被迫前进」的箭头 */
export function advanceArrowFor(
  from: 1 | 2 | 3 | 'batter',
  tone: FieldArrow['tone'] = 'forced',
): FieldArrow {
  const { a, b } = advanceArrow(from);
  return { id: `adv-${from}`, from: a, to: b, tone };
}
