import type {
  Bases,
  Count,
  HalfInningState,
  PitchOutcome,
  PitchResult,
  ReasonCode,
} from './types';

/** 一个空的半局状态，方便测试和界面重置。 */
export function emptyBases(): Bases {
  return { 1: false, 2: false, 3: false };
}

export function initialState(): HalfInningState {
  return { outs: 0, bases: emptyBases(), count: { balls: 0, strikes: 0 }, runs: 0 };
}

export function withBases(...occupied: (1 | 2 | 3)[]): Bases {
  const b = emptyBases();
  for (const base of occupied) b[base] = true;
  return b;
}

export function runnersOn(bases: Bases): (1 | 2 | 3)[] {
  return ([1, 2, 3] as const).filter((b) => bases[b]);
}

/** 一垒空着吗？不死三振与故意保送都看这一条。 */
export function firstBaseOpen(bases: Bases): boolean {
  return !bases[1];
}

export interface PitchApplication {
  /** 这一球之后的状态。三振、保送、打进界内时球数归零。 */
  state: HalfInningState;
  outcome: PitchOutcome;
  reason: ReasonCode;
  /**
   * 三振时：如果捕手没有直接接住第三个好球，打者能不能跑向一垒。
   * 只有三振才有值。擦棒被捕按定义已经被接住，触击界外是界外球，两者都不适用。
   */
  uncaughtThirdStrike?: {
    /** 规则允许（一垒空着 或 已两出局） */
    eligible: boolean;
    /** 这种第三好球在物理上可能没被接住吗 */
    possible: boolean;
  };
}

/**
 * 处理一球，更新球数。
 *
 * 规则要点（对应交接文档第 8 节第 1 条）：
 * - 界外记一个好球，但 2 好球之后不再加：碰到球不该和挥空受同样惩罚。
 *   结果是打者可以在 2 好球后一直打界外缠斗，这是合法的。
 * - 例外：2 好球时触击界外 = 三振（触击碰界外太容易）。
 * - 例外：擦棒被捕视为好球，2 好球时 = 三振。擦棒后先碰地或没接稳，只是普通界外球。
 *
 * @param opts.catcherHeld 第三个好球捕手有没有直接接住，默认 true。
 */
export function applyPitch(
  state: HalfInningState,
  result: PitchResult,
  opts: { catcherHeld?: boolean } = {},
): PitchApplication {
  const catcherHeld = opts.catcherHeld ?? true;
  const { balls, strikes } = state.count;

  const keep = (count: Count, outcome: PitchOutcome, reason: ReasonCode): PitchApplication => ({
    state: { ...state, count },
    outcome,
    reason,
  });

  switch (result) {
    case 'ball': {
      if (balls === 3) {
        return {
          state: { ...state, count: { balls: 0, strikes: 0 } },
          outcome: 'walk',
          reason: 'ball.walk',
        };
      }
      return keep({ balls: (balls + 1) as Count['balls'], strikes }, 'ballAdded', 'ball.added');
    }

    case 'calledStrike':
    case 'swingingStrike':
      return addStrike(state, {
        addReason: result === 'calledStrike' ? 'strike.called' : 'strike.swinging',
        strikeoutReason: 'strike.out',
        catcherHeld,
        canEscapeCatcher: true,
      });

    case 'foul': {
      // 2 好球后的界外不再加好球。
      if (strikes === 2) return keep(state.count, 'foulNoStrike', 'strike.foulCapped');
      return addStrike(state, {
        addReason: 'strike.foulCounts',
        strikeoutReason: 'strike.out',
        catcherHeld,
        canEscapeCatcher: false,
      });
    }

    case 'foulBunt':
      // 不到 2 好球时和普通界外球一样记一个好球；
      // 2 好球时直接三振，而且球在界外，不存在不死三振。
      return addStrike(state, {
        addReason: 'strike.foulCounts',
        strikeoutReason: 'strike.foulBuntOut',
        catcherHeld,
        canEscapeCatcher: false,
      });

    case 'foulTip':
      // 擦棒被捕按定义已进捕手手套并被接住，所以第三个好球一定是被接住的。
      // 擦棒后先碰地、碰别处或没接稳的，输入应该是 'foul' 而不是 'foulTip'。
      return addStrike(state, {
        addReason: 'strike.foulTip',
        strikeoutReason: 'strike.foulTip',
        catcherHeld: true,
        canEscapeCatcher: false,
      });

    case 'hitByPitch':
      return {
        state: { ...state, count: { balls: 0, strikes: 0 } },
        outcome: 'hitByPitch',
        reason: 'hbp.award',
      };

    case 'inPlay':
      return {
        state: { ...state, count: { balls: 0, strikes: 0 } },
        outcome: 'inPlay',
        reason: 'inPlay.handoff',
      };
  }
}

interface StrikeSpec {
  /** 好球数 +1 时的理由代码 */
  addReason: ReasonCode;
  /** 这一球构成第三个好球（三振）时的理由代码 */
  strikeoutReason: ReasonCode;
  /** 捕手有没有直接接住 */
  catcherHeld: boolean;
  /** 这种好球在物理上可能从捕手身边溜走吗（看/挥空可以；界外与擦棒被捕不行） */
  canEscapeCatcher: boolean;
}

function addStrike(state: HalfInningState, spec: StrikeSpec): PitchApplication {
  const { balls, strikes } = state.count;

  if (strikes === 2) {
    const eligible = canUncaughtThirdStrike(state);
    const escaped = spec.canEscapeCatcher && !spec.catcherHeld;
    return {
      state: { ...state, count: { balls: 0, strikes: 0 } },
      outcome: 'strikeout',
      reason: escaped && eligible ? 'strike.outUncaughtLive' : spec.strikeoutReason,
      uncaughtThirdStrike: { eligible, possible: spec.canEscapeCatcher },
    };
  }

  return {
    state: { ...state, count: { balls, strikes: (strikes + 1) as Count['strikes'] } },
    outcome: 'strikeAdded',
    reason: spec.addReason,
  };
}

/**
 * 不死三振是否成立：一垒空着 **或** 已经两出局。
 *
 * 为什么有这个限制：一垒有人且不到两出局时，捕手可以故意漏接，
 * 把打者变成被迫前进的跑者，连续封杀做成双杀。规则不许这样占便宜。
 */
export function canUncaughtThirdStrike(
  state: Pick<HalfInningState, 'outs' | 'bases'>,
): boolean {
  return firstBaseOpen(state.bases) || state.outs === 2;
}
