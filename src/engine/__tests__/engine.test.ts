import { describe, expect, it } from 'vitest';
import {
  applyPitch,
  applyWalk,
  canUncaughtThirdStrike,
  emptyBases,
  forceChain,
  forcedRunners,
  homeRunRuns,
  infieldFlyApplies,
  initialState,
  isAdvanceGuaranteedOnWalk,
  runsCountOnThirdOut,
  sacrificeFlyPossible,
  squeezeEffective,
  stealableBases,
  tagUpBases,
  withBases,
} from '../index';
import type { HalfInningState } from '../types';

/** 造一个半局状态。默认 0 出局、垒上无人、0 坏 0 好。 */
function s(partial: Partial<HalfInningState> = {}): HalfInningState {
  return { ...initialState(), ...partial };
}

// ─────────────────────────────────────────────────────────────
// 交接文档第 5.3 节：来自教学对话的必过用例 T1–T19
// ─────────────────────────────────────────────────────────────

describe('第 5.3 节 必过用例', () => {
  it('T1  2 好球 + 界外 → 仍为 2 好球', () => {
    const r = applyPitch(s({ count: { balls: 0, strikes: 2 } }), 'foul');
    expect(r.outcome).toBe('foulNoStrike');
    expect(r.state.count.strikes).toBe(2);
    expect(r.reason).toBe('strike.foulCapped');
  });

  it('T2  2 好球 + 触击界外 → 三振', () => {
    const r = applyPitch(s({ count: { balls: 1, strikes: 2 } }), 'foulBunt');
    expect(r.outcome).toBe('strikeout');
    expect(r.reason).toBe('strike.foulBuntOut');
    // 球在界外，不可能出现不死三振
    expect(r.uncaughtThirdStrike?.possible).toBe(false);
  });

  it('T3  2 好球 + 擦棒被捕 → 三振', () => {
    const r = applyPitch(s({ count: { balls: 0, strikes: 2 } }), 'foulTip');
    expect(r.outcome).toBe('strikeout');
    expect(r.reason).toBe('strike.foulTip');
    // 擦棒被捕按定义已进手套，第三个好球一定被接住
    expect(r.uncaughtThirdStrike?.possible).toBe(false);
  });

  it('T4  1 好球 + 擦棒被捕 → 2 好球，打者继续', () => {
    const r = applyPitch(s({ count: { balls: 2, strikes: 1 } }), 'foulTip');
    expect(r.outcome).toBe('strikeAdded');
    expect(r.state.count).toEqual({ balls: 2, strikes: 2 });
  });

  it('T5  3 坏球 + 坏球 → 保送', () => {
    const r = applyPitch(s({ count: { balls: 3, strikes: 2 } }), 'ball');
    expect(r.outcome).toBe('walk');
    expect(r.reason).toBe('ball.walk');
  });

  it('T6  跑者 {1,3}，打进界内 → 被迫：打者、一垒跑者；三垒跑者不被迫', () => {
    const bases = withBases(1, 3);
    expect(forcedRunners(bases)).toEqual([1]);
    const chain = forceChain(bases);
    expect(chain.batterAdvances).toBe(true);
    expect(chain.forced).toEqual([1]);
    expect(chain.notForced).toEqual([3]);
  });

  it('T7  跑者 {2}，打进界内 → 被迫：仅打者', () => {
    const bases = withBases(2);
    expect(forcedRunners(bases)).toEqual([]);
    const chain = forceChain(bases);
    expect(chain.batterAdvances).toBe(true);
    expect(chain.notForced).toEqual([2]);
  });

  it('T8  跑者 {1,2,3}，打进界内 → 全部被迫', () => {
    expect(forcedRunners(withBases(1, 2, 3))).toEqual([1, 2, 3]);
    expect(forceChain(withBases(1, 2, 3)).notForced).toEqual([]);
  });

  it('T9  跑者 {2,3}，保送 → 打者上一垒，其余不动，0 分', () => {
    const r = applyWalk(s({ bases: withBases(2, 3) }));
    expect(r.state.bases).toEqual({ 1: true, 2: true, 3: true });
    expect(r.runsScored).toBe(0);
    expect(r.state.runs).toBe(0);
    expect(r.reason).toBe('walk.forcedOnly');
  });

  it('T10 跑者 {1,2,3}，保送 → 全部前进，1 分', () => {
    const r = applyWalk(s({ bases: withBases(1, 2, 3) }));
    expect(r.state.bases).toEqual({ 1: true, 2: true, 3: true });
    expect(r.runsScored).toBe(1);
    expect(r.state.runs).toBe(1);
    expect(r.reason).toBe('walk.forcesInRun');
  });

  it('T11 跑者 {1,2,3}，打者先在一垒出局 → 所有跑者解除强迫，本垒须触杀', () => {
    const bases = withBases(1, 2, 3);
    expect(forcedRunners(bases, true)).toEqual([]);
    const chain = forceChain(bases, true);
    expect(chain.forced).toEqual([]);
    expect(chain.notForced).toEqual([1, 2, 3]);
    expect(chain.reason).toBe('force.broken');
  });

  it('T12 两出局，打者在一垒前出局，三垒跑者早已踏本垒 → 得分不算', () => {
    expect(runsCountOnThirdOut('batterBeforeFirst', true)).toBe(false);
    // 接杀打者同理
    expect(runsCountOnThirdOut('caughtFly', true)).toBe(false);
  });

  it('T13 两出局，跑者被触杀为第三出局，另一跑者此前已踏本垒 → 得分算', () => {
    expect(runsCountOnThirdOut('tag', true)).toBe(true);
    // 没赶在出局之前踏本垒就不算
    expect(runsCountOnThirdOut('tag', false)).toBe(false);
  });

  it('不死三振后击跑员在一垒前被触杀为第三出局：先回本垒也不得分', () => {
    const pitch = applyPitch(s({ outs: 2, bases: withBases(3), count: { balls: 0, strikes: 2 } }), 'swingingStrike', { catcherHeld: false });
    expect(pitch.reason).toBe('strike.outUncaughtLive');
    expect(pitch.uncaughtThirdStrike?.eligible).toBe(true);
    // 持球碰人这一动作不会把击跑员的一垒前出局改成普通时间 play。
    expect(runsCountOnThirdOut('batterBeforeFirst', true)).toBe(false);
    expect(runsCountOnThirdOut('batterBeforeFirst', false)).toBe(false);
    expect(runsCountOnThirdOut('tag', true)).toBe(true);
  });

  it('T14 一出局，一垒有人，第三个好球漏接 → 不死三振不成立（打者出局）', () => {
    const state = s({ outs: 1, bases: withBases(1), count: { balls: 0, strikes: 2 } });
    expect(canUncaughtThirdStrike(state)).toBe(false);
    const r = applyPitch(state, 'swingingStrike', { catcherHeld: false });
    expect(r.outcome).toBe('strikeout');
    expect(r.uncaughtThirdStrike?.eligible).toBe(false);
    expect(r.reason).toBe('strike.out');
  });

  it('T15 两出局，一垒有人，第三个好球漏接 → 不死三振成立', () => {
    const state = s({ outs: 2, bases: withBases(1), count: { balls: 0, strikes: 2 } });
    expect(canUncaughtThirdStrike(state)).toBe(true);
    const r = applyPitch(state, 'calledStrike', { catcherHeld: false });
    expect(r.outcome).toBe('strikeout');
    expect(r.uncaughtThirdStrike?.eligible).toBe(true);
    expect(r.reason).toBe('strike.outUncaughtLive');
  });

  it('T16 一出局，一二垒有人 → 内野高飞必死适用', () => {
    expect(infieldFlyApplies(s({ outs: 1, bases: withBases(1, 2) }))).toBe(true);
    // 满垒同样适用
    expect(infieldFlyApplies(s({ outs: 0, bases: withBases(1, 2, 3) }))).toBe(true);
  });

  it('T17 两出局，一二垒有人 → 不适用', () => {
    expect(infieldFlyApplies(s({ outs: 2, bases: withBases(1, 2) }))).toBe(false);
  });

  it('T18 一出局，仅一垒有人 → 不适用', () => {
    expect(infieldFlyApplies(s({ outs: 1, bases: withBases(1) }))).toBe(false);
  });

  it('T19 满垒保送中，被迫跑者前往下一垒不能被触杀；超出的部分自担风险', () => {
    const loaded = withBases(1, 2, 3);
    expect(isAdvanceGuaranteedOnWalk(loaded, 'batter', 1)).toBe(true);
    expect(isAdvanceGuaranteedOnWalk(loaded, 1, 2)).toBe(true);
    expect(isAdvanceGuaranteedOnWalk(loaded, 2, 3)).toBe(true);
    expect(isAdvanceGuaranteedOnWalk(loaded, 3, 4)).toBe(true);
    // 二垒跑者想一口气冲本垒：超出判给的垒，自担风险
    expect(isAdvanceGuaranteedOnWalk(loaded, 2, 4)).toBe(false);
    // 一垒空着时，垒上的跑者一个都不被推动，所以没有任何保障段
    expect(isAdvanceGuaranteedOnWalk(withBases(2, 3), 2, 3)).toBe(false);
    expect(isAdvanceGuaranteedOnWalk(withBases(2, 3), 'batter', 1)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 交接文档第 8 节准确性清单里的其余条目
// ─────────────────────────────────────────────────────────────

describe('第 8 节 准确性清单', () => {
  it('1  界外算好球，但 2 好球后可以无限缠斗', () => {
    let state = s();
    for (let i = 0; i < 2; i++) {
      const r = applyPitch(state, 'foul');
      expect(r.outcome).toBe('strikeAdded');
      state = r.state;
    }
    expect(state.count.strikes).toBe(2);
    for (let i = 0; i < 10; i++) {
      const r = applyPitch(state, 'foul');
      expect(r.outcome).toBe('foulNoStrike');
      state = r.state;
    }
    expect(state.count.strikes).toBe(2);
  });

  it('6  四坏球时被迫跑者到下一垒有保障', () => {
    const r = applyWalk(s({ bases: withBases(1) }));
    expect(r.awards).toEqual([
      { from: 1, to: 2, guaranteed: true },
      { from: 'batter', to: 1, guaranteed: true },
    ]);
    expect(r.state.bases).toEqual({ 1: true, 2: true, 3: false });
  });

  it('7  本垒打的分数 = 1 + 垒上跑者数', () => {
    expect(homeRunRuns(emptyBases())).toBe(1);
    expect(homeRunRuns(withBases(2, 3))).toBe(3);
    expect(homeRunRuns(withBases(1, 2, 3))).toBe(4);
  });

  it('8  一垒空时保送不挤分；故意保送让满垒后最大失分反而变大', () => {
    expect(applyWalk(s({ bases: withBases(2, 3) })).runsScored).toBe(0);
    // 保送前最大失分（三分炮）
    expect(homeRunRuns(withBases(2, 3))).toBe(3);
    // 保送后满垒，最大失分变成满贯 4 分
    expect(homeRunRuns(withBases(1, 2, 3))).toBe(4);
  });

  it('9  两出局时高飞牺牲打与抢分触击都不成立', () => {
    expect(sacrificeFlyPossible(s({ outs: 1, bases: withBases(3) }))).toBe(true);
    expect(sacrificeFlyPossible(s({ outs: 2, bases: withBases(3) }))).toBe(false);
    expect(squeezeEffective(s({ outs: 2, bases: withBases(3) }))).toBe(false);
  });

  it('12 满垒时无处可盗，压力来自四坏球、触身球、暴投、balk 直接送分', () => {
    expect(stealableBases(withBases(1, 2, 3))).toEqual([3]); // 只剩本垒，等于盗本垒
    expect(stealableBases(withBases(1))).toEqual([1]);
    expect(stealableBases(withBases(1, 2))).toEqual([2]);
    // 满垒保送直接送 1 分
    expect(applyWalk(s({ bases: withBases(1, 2, 3) })).runsScored).toBe(1);
  });

  it('16 前两个好球漏接只算好球，打者继续 —— 不死三振只针对第三个好球', () => {
    const first = applyPitch(s({ bases: withBases(1) }), 'swingingStrike', {
      catcherHeld: false,
    });
    expect(first.outcome).toBe('strikeAdded');
    expect(first.uncaughtThirdStrike).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
// 附录 B 题库里需要引擎支撑的题
// ─────────────────────────────────────────────────────────────

describe('附录 B 题库', () => {
  it('R1-4 两出局三垒有人，跑者先踏本垒但打者在一垒前被传杀 → 不算分', () => {
    expect(runsCountOnThirdOut('batterBeforeFirst', true)).toBe(false);
  });

  it('R1-7 一出局一二垒有人的内野高飞 → 必死；平飞球和触击不算', () => {
    const state = s({ outs: 1, bases: withBases(1, 2) });
    expect(infieldFlyApplies(state, 'fly')).toBe(true);
    expect(infieldFlyApplies(state, 'lineDrive')).toBe(false);
    expect(infieldFlyApplies(state, 'bunt')).toBe(false);
  });

  it('R2-1 无人出局只有二垒有人，滚地球 → 二垒跑者不被迫', () => {
    expect(forcedRunners(withBases(2))).toEqual([]);
  });

  it('R2-2 一出局一三垒有人 → 被迫：打者与一垒跑者；三垒跑者须触杀', () => {
    const chain = forceChain(withBases(1, 3));
    expect(chain.forced).toEqual([1]);
    expect(chain.notForced).toEqual([3]);
    // 若双杀（第三出局是封杀），三垒跑者即使先踏本垒也不得分
    expect(runsCountOnThirdOut('force', true)).toBe(false);
  });

  it('R2-3 一出局满垒，一垒手先踩一垒 → 强迫解除，本垒必须触杀', () => {
    expect(forcedRunners(withBases(1, 2, 3), true)).toEqual([]);
    // 所以通常反过来：先传本垒封杀，再回传一垒（3-2-3）
    expect(forcedRunners(withBases(1, 2, 3))).toContain(3);
  });

  it('R2-4 无人出局一二垒有人，平飞被直接接住 → 跑者须回原垒，踩垒即可', () => {
    const state = s({ outs: 0, bases: withBases(1, 2) });
    // 内野高飞必死不适用于平飞球，所以三杀才有可能发生
    expect(infieldFlyApplies(state, 'lineDrive')).toBe(false);
    // 回的是原垒，不是下一个垒
    expect(tagUpBases(state)).toEqual([1, 2]);
  });
});
