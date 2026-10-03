/**
 * 规则引擎的数据模型。
 *
 * 这一层完全不认识界面：没有 React、没有 DOM、没有中文文案。
 * 它只回答「按规则会发生什么」，并返回一个理由代码（ReasonCode）。
 * 中文解释放在 src/content/explanations.ts，改文案不用动逻辑。
 */

/** 一、二、三垒。本垒在引擎里用 4 表示「跑回本垒」这个目的地。 */
export type Base = 1 | 2 | 3;

/** 目的地：1/2/3 垒，4 = 本垒（得分）。 */
export type Destination = 1 | 2 | 3 | 4;

/** 垒上有没有人。 */
export type Bases = { 1: boolean; 2: boolean; 3: boolean };

/** 球数。到 4 坏 / 3 好就已经结算掉了，所以状态里不会出现 4 和 3。 */
export type Count = { balls: 0 | 1 | 2 | 3; strikes: 0 | 1 | 2 };

/** 半局状态。同理，出局数不会停在 3。 */
export interface HalfInningState {
  outs: 0 | 1 | 2;
  bases: Bases;
  count: Count;
  runs: number;
}

/** 一球的结果（裁判判定或击球事实）。 */
export type PitchResult =
  /** 没挥棒，球进好球带 */
  | 'calledStrike'
  /** 挥棒落空 */
  | 'swingingStrike'
  /** 没挥棒，球没进好球带 */
  | 'ball'
  /** 普通界外球 */
  | 'foul'
  /** 触击成界外 */
  | 'foulBunt'
  /** 擦棒被捕：擦到棒后直接飞进捕手手套并被接住 */
  | 'foulTip'
  /** 投球打到打者身上 */
  | 'hitByPitch'
  /** 打进界内，交给跑垒/守备部分处理 */
  | 'inPlay';

/** 一球之后打席层面的结论。 */
export type PitchOutcome =
  | 'ballAdded'
  | 'strikeAdded'
  | 'foulNoStrike'
  | 'strikeout'
  | 'walk'
  | 'hitByPitch'
  | 'inPlay';

/** 打出去的球的种类，用于内野高飞必死的判定。 */
export type BattedBallKind = 'fly' | 'lineDrive' | 'bunt' | 'groundBall';

/** 第三个出局是怎么来的。决定这一球跑回的分算不算。 */
export type ThirdOutKind =
  /** 封杀：持球踩被迫跑者要去的垒 */
  | 'force'
  /** 击跑员在踏上一垒之前出局（含不死三振后的触杀或一垒传杀） */
  | 'batterBeforeFirst'
  /** 打者的飞球被直接接住（接杀），也属于「打者没能上一垒」 */
  | 'caughtFly'
  /** 前位跑者因漏踩垒被申诉为第三出局；此分数指他之后的跑者 */
  | 'precedingRunnerAppeal'
  /** 非被迫跑者的触杀；不含击跑员上一垒前出局 */
  | 'tag';

/**
 * 理由代码。界面拿它去 src/content/explanations.ts 取中文说明。
 * 每加一条规则判断，就加一个代码，逻辑与文案各改各的。
 */
export type ReasonCode =
  | 'ball.added'
  | 'ball.walk'
  | 'strike.called'
  | 'strike.swinging'
  | 'strike.foulCounts'
  | 'strike.foulCapped'
  | 'strike.foulBuntOut'
  | 'strike.foulTip'
  | 'strike.out'
  | 'strike.outUncaughtLive'
  | 'hbp.award'
  | 'inPlay.handoff'
  | 'force.chain'
  | 'force.broken'
  | 'walk.forcedOnly'
  | 'walk.forcesInRun'
  | 'uncaughtThirdStrike.yes'
  | 'uncaughtThirdStrike.noFirstOccupied'
  | 'infieldFly.applies'
  | 'infieldFly.noTwoOuts'
  | 'infieldFly.noBaseState'
  | 'infieldFly.noBallKind'
  | 'thirdOut.forceNoRun'
  | 'thirdOut.batterNoRun'
  | 'thirdOut.appealNoRun'
  | 'thirdOut.tagTimed';

/** 引擎返回的统一形状：新状态 + 结论 + 理由代码。 */
export interface EngineResult<T> {
  value: T;
  reason: ReasonCode;
}
