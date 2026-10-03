import { runnersOn } from './count';
import type { Base, Bases, Destination, HalfInningState, ReasonCode } from './types';

/**
 * 强迫（force）是全站最容易错的概念，所以这一段写得细一点。
 *
 * 原理：每个垒同时只属于一个跑者，前面的跑者优先。打者把球打进界内后
 * 必须离开本垒跑向一垒，于是一垒上的跑者失去了待在原地的权利，必须让位；
 * 他一让位，二垒跑者又失去权利……链条从本垒开始，在**第一个空垒**处断开。
 *
 * 被迫的跑者，防守方只要持球踩他**要去的**那个垒就出局（封杀）。
 * 不被迫的跑者可以留在原垒，要让他出局必须持球**碰到他本人**（触杀）。
 */

/**
 * 打者成为跑者时，哪些垒上的跑者被迫前进。
 *
 * @param batterRetired 打者已经先出局了吗（例如一垒手先踩一垒）。
 *        源头一消失，整条链解除，所有跑者都只能触杀。
 */
export function forcedRunners(bases: Bases, batterRetired = false): Base[] {
  if (batterRetired) return [];
  const forced: Base[] = [];
  for (const base of [1, 2, 3] as const) {
    if (!bases[base]) break; // 链条在第一个空垒处断开
    forced.push(base);
  }
  return forced;
}

export interface ForceLink {
  from: Base;
  to: Destination;
  forced: boolean;
}

export interface ForceChain {
  /** 打者总是要离开本垒跑向一垒，他是整条链的源头 */
  batterAdvances: boolean;
  links: ForceLink[];
  /** 被迫前进的垒 */
  forced: Base[];
  /** 垒上有人但不被迫的垒 */
  notForced: Base[];
  reason: ReasonCode;
}

/** 给界面（ForceChain 组件）用的完整描述。 */
export function forceChain(bases: Bases, batterRetired = false): ForceChain {
  const forced = forcedRunners(bases, batterRetired);
  const occupied = runnersOn(bases);
  return {
    batterAdvances: !batterRetired,
    links: occupied.map((from) => ({
      from,
      to: (from + 1) as Destination,
      forced: forced.includes(from),
    })),
    forced,
    notForced: occupied.filter((b) => !forced.includes(b)),
    reason: batterRetired ? 'force.broken' : 'force.chain',
  };
}

export interface WalkAward {
  from: Base | 'batter';
  to: Destination;
  /**
   * 有保障吗。四坏球时球其实是**活球**，但被迫跑者到下一个垒是有保障的
   * （这一段不能被触杀）；想再多进一个垒就自担风险。
   */
  guaranteed: boolean;
}

/** 四坏球（或触身球）判给的垒。 */
export function walkAwards(bases: Bases): WalkAward[] {
  const forced = forcedRunners(bases);
  return [
    ...forced
      .slice()
      .reverse() // 从最前面的跑者开始推，避免两人挤在同一个垒
      .map((from): WalkAward => ({ from, to: (from + 1) as Destination, guaranteed: true })),
    { from: 'batter', to: 1, guaranteed: true },
  ];
}

/** 四坏球途中，某一段跑垒是不是有保障（不能被触杀）。对应测试 T19。 */
export function isAdvanceGuaranteedOnWalk(
  bases: Bases,
  from: Base | 'batter',
  to: Destination,
): boolean {
  return walkAwards(bases).some((a) => a.from === from && a.to === to);
}

export interface WalkApplication {
  state: HalfInningState;
  /** 这次保送挤回来几分（只有满垒时是 1，其余是 0） */
  runsScored: number;
  awards: WalkAward[];
  reason: ReasonCode;
}

/**
 * 四坏球保送：打者上一垒，**只推动被迫的跑者**。
 *
 * 这条正是「故意保送要挑一垒空着的时候」的原因：一垒空，链条长度为 0，
 * 保送不会挤回任何分数。
 */
export function applyWalk(state: HalfInningState): WalkApplication {
  const forced = forcedRunners(state.bases);
  const bases: Bases = { ...state.bases };
  let runsScored = 0;

  // 从最前面的跑者开始推
  for (const from of forced.slice().reverse()) {
    bases[from] = false;
    if (from === 3) runsScored += 1;
    else bases[(from + 1) as Base] = true;
  }
  bases[1] = true; // 打者

  return {
    state: { ...state, bases, runs: state.runs + runsScored, count: { balls: 0, strikes: 0 } },
    runsScored,
    awards: walkAwards(state.bases),
    reason: runsScored > 0 ? 'walk.forcesInRun' : 'walk.forcedOnly',
  };
}

/** 本垒打的分数 = 1 + 垒上跑者数，最多 4 分。没有额外加分。 */
export function homeRunRuns(bases: Bases): 1 | 2 | 3 | 4 {
  return (1 + runnersOn(bases).length) as 1 | 2 | 3 | 4;
}

/** 可以盗的垒：自己有人、下一个垒空着。满垒时一个都没有。 */
export function stealableBases(bases: Bases): Base[] {
  return ([1, 2, 3] as const).filter(
    (b) => bases[b] && (b === 3 ? true : !bases[(b + 1) as Base]),
  );
}
