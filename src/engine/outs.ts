import type {
  BattedBallKind,
  HalfInningState,
  ReasonCode,
  ThirdOutKind,
} from './types';

export interface InfieldFlyVerdict {
  applies: boolean;
  reason: ReasonCode;
}

/**
 * 内野高飞必死。
 *
 * 为什么存在：一二垒有人（或满垒）、不到两出局、内野高飞球时，防守方本来
 * 稳赚一个双杀——跑者留垒，野手就故意让球落地，所有人突然被迫前进，连踩两个垒；
 * 跑者提前离垒，野手就正常接杀再传回原垒。跑者怎么选都是双杀。
 * 规则干脆直接判打者出局，把「被迫前进」这个前提拿掉，两难消失。
 *
 * 适用条件：一垒和二垒都有人（满垒是其中一种），不到两出局，
 * 且是内野手用普通努力就能接住的**界内高飞球**——平飞球和触击不算。
 */
export function infieldFlyApplies(
  state: Pick<HalfInningState, 'outs' | 'bases'>,
  battedBall: BattedBallKind = 'fly',
): boolean {
  return infieldFlyVerdict(state, battedBall).applies;
}

export function infieldFlyVerdict(
  state: Pick<HalfInningState, 'outs' | 'bases'>,
  battedBall: BattedBallKind = 'fly',
): InfieldFlyVerdict {
  if (state.outs === 2) return { applies: false, reason: 'infieldFly.noTwoOuts' };
  if (!(state.bases[1] && state.bases[2])) {
    return { applies: false, reason: 'infieldFly.noBaseState' };
  }
  if (battedBall !== 'fly') return { applies: false, reason: 'infieldFly.noBallKind' };
  return { applies: true, reason: 'infieldFly.applies' };
}

export interface ThirdOutVerdict {
  runsCount: boolean;
  reason: ReasonCode;
}

/**
 * 第三个出局与得分。
 *
 * 第三出局如果是**封杀**、**打者在踏上一垒前出局**（含接杀打者）、
 * 这次行动的分不算，哪怕先踏本垒；前位跑者漏踩垒的第三出局申诉则取消其后位跑者的分。
 * 非被迫跑者的触杀是常见的时间 play；击跑员一垒前被触杀仍归 batterBeforeFirst。
 *
 * @param runnerCrossedBeforeOut 跑者踏本垒是否早于这个出局发生。只在触杀时有意义。
 */
export function runsCountOnThirdOut(
  kind: ThirdOutKind,
  runnerCrossedBeforeOut: boolean,
): boolean {
  return thirdOutVerdict(kind, runnerCrossedBeforeOut).runsCount;
}

export function thirdOutVerdict(
  kind: ThirdOutKind,
  runnerCrossedBeforeOut: boolean,
): ThirdOutVerdict {
  switch (kind) {
    case 'force':
      return { runsCount: false, reason: 'thirdOut.forceNoRun' };
    case 'batterBeforeFirst':
    case 'caughtFly':
      return { runsCount: false, reason: 'thirdOut.batterNoRun' };
    case 'precedingRunnerAppeal':
      return { runsCount: false, reason: 'thirdOut.appealNoRun' };
    case 'tag':
      return { runsCount: runnerCrossedBeforeOut, reason: 'thirdOut.tagTimed' };
  }
}

/**
 * 高飞牺牲打成不成立：不到两出局、三垒有人。
 * 两出局时接杀就是第三出局，半局结束，跑者回不回垒都没意义。
 */
export function sacrificeFlyPossible(state: Pick<HalfInningState, 'outs' | 'bases'>): boolean {
  return state.outs < 2 && state.bases[3];
}

/**
 * 抢分触击有没有用：两出局时无效——打者被传杀在一垒是「打者在一垒前出局」，
 * 第三出局，这一球的分一律不算。
 */
export function squeezeEffective(state: Pick<HalfInningState, 'outs' | 'bases'>): boolean {
  return state.outs < 2 && state.bases[3];
}

/**
 * 接杀之后，跑者必须回到**原垒**才能再前进（回垒 / touch-up）。
 * 防守方只要持球踩他的原垒就出局，不需要触杀，也不只限于最前面的跑者。
 * 这就是「回垒不及被双杀」和三杀的来源。
 */
export function tagUpBases(state: Pick<HalfInningState, 'bases'>): (1 | 2 | 3)[] {
  return ([1, 2, 3] as const).filter((b) => state.bases[b]);
}
