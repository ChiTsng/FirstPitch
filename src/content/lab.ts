import {
  forcedRunners,
  homeRunRuns,
  runsCountOnThirdOut,
  sacrificeFlyPossible,
  squeezeEffective,
  type Bases,
  type HalfInningState,
} from '../engine';

/**
 * 情境模拟器的文字。
 *
 * 这里不做物理模拟 —— 合法性和强迫关系交给规则引擎（src/engine），
 * 这个文件只负责把引擎算出的结构变成「可能发生的事」和「决策点」。
 * 想改措辞，改这里；想改规则判断，改引擎。
 */

export type BattedResult =
  | 'foul'
  | 'infieldGrounder'
  | 'grounderThrough'
  | 'linerCaught'
  | 'linerDrops'
  | 'flyCaught'
  | 'flyDrops'
  | 'homeRun'
  | 'bunt';

export const RESULT_LABEL: Record<BattedResult, string> = {
  foul: '界外',
  infieldGrounder: '内野滚地',
  grounderThrough: '穿过内野的滚地',
  linerCaught: '平飞被直接接住',
  linerDrops: '平飞落地',
  flyCaught: '外野飞球被直接接住',
  flyDrops: '外野飞球落地',
  homeRun: '本垒打',
  bunt: '触击',
};

export interface LabStep {
  text: string;
  /** 决策点：防守方（或进攻方）要在这里选一条路 */
  decision?: boolean;
}

export interface LabOutcome {
  steps: LabStep[];
  /** 一种典型结果，用来在球场上画 */
  typical: {
    outsAdded: 0 | 1 | 2 | 3;
    runs: number;
    /** 打完这一球之后的垒上情况 */
    bases: (1 | 2 | 3)[];
    caption: string;
  };
  /** 这一球之后，这半局还剩什么 */
  note?: string;
}

function baseList(bases: Bases): (1 | 2 | 3)[] {
  return ([1, 2, 3] as const).filter((b) => bases[b]);
}

const BASE_ZH = { 1: '一', 2: '二', 3: '三' } as const;

function baseName(b: 1 | 2 | 3): string {
  return `${BASE_ZH[b]}垒`;
}

function nameRunners(list: (1 | 2 | 3)[]): string {
  return list.length ? list.map((b) => `${baseName(b)}跑者`).join('、') : '无跑者';
}

/**
 * 把一个局面 + 一种击球结果，展开成按时间顺序的「可能发生的事」。
 */
export function describePlay(state: HalfInningState, result: BattedResult): LabOutcome {
  const on = baseList(state.bases);
  const forced = forcedRunners(state.bases);
  const notForced = on.filter((b) => !forced.includes(b));
  const outsLeft = 2 - state.outs;
  const steps: LabStep[] = [];

  // 两出局时的通则，先说一句
  if (state.outs === 2 && result !== 'foul') {
    steps.push({
      text: '两出局：球一碰到棒，**所有跑者立刻起跑** —— 接杀即是第三出局，回垒规则已经没有意义。',
    });
  }

  switch (result) {
    case 'foul':
      steps.push({ text: '球落在界外 —— **死球**，一切冻结。' });
      steps.push({
        text: on.length ? `跑者回到原垒（${nameRunners(on)}）。` : '垒上无人，没有人需要回垒。',
      });
      steps.push({
        text: '球数记一个好球；但如果已经是 2 好球，就**不再加**（触击界外除外，那是三振）。',
      });
      return {
        steps,
        typical: { outsAdded: 0, runs: 0, bases: on, caption: '界外，重来一球。' },
      };

    case 'infieldGrounder': {
      steps.push({ text: '内野手接到球。此刻他要同时想清楚：谁被迫、谁不被迫。' });
      steps.push({
        text: forced.length
          ? `被迫前进的是 **打者** 和 ${nameRunners(forced)} —— 对他们只要**持球踩目标垒**就出局。${
              notForced.length
                ? `${nameRunners(notForced)}**不被迫**，可以留在原垒，要出局必须触杀。`
                : ''
            }`
          : `一垒空着，链条长度为零 —— **只有打者被迫**。${
              on.length ? `${nameRunners(on)}不被迫，可以留在原垒，要出局必须触杀。` : ''
            }`,
      });

      if (state.bases[3] && outsLeft > 0) {
        steps.push({
          decision: true,
          text: '内野手：传本垒拦住那一分，还是传一垒拿稳一个出局？传本垒失手的话，一个出局都没有。',
        });
      }
      if (forced.length > 0 && outsLeft > 0) {
        steps.push({
          decision: true,
          text: '有没有双杀机会？先传前面的垒封杀跑者，再传一垒传杀打者。',
        });
      }
      if (state.outs === 2) {
        // 第三出局是「打者没能上一垒」，按规则这一球的分一律不算
        const counts = runsCountOnThirdOut('batterBeforeFirst', true);
        steps.push({
          text: `打者在一垒前被传杀就是**第三个出局**，而且属于「打者没能上一垒」这一类 —— 这一球里就算有人抢先跑回本垒，${
            counts ? '这一分仍然算。' : '**也一律不算分**。'
          }`,
        });
        return {
          steps,
          typical: { outsAdded: 1, runs: 0, bases: [], caption: '传杀一垒，半局结束，不得分。' },
        };
      }
      if (forced.length > 0 && outsLeft >= 2) {
        const remaining = on.filter((b) => b !== forced[0]).map((b) => (b + 1) as 1 | 2 | 3);
        return {
          steps,
          typical: {
            outsAdded: 2,
            runs: 0,
            bases: remaining.filter((b) => b <= 3),
            caption: '双杀：先封杀前面的跑者，再传杀尚未上一垒的打者。',
          },
          note: '双杀是防守方一次花掉对方两条命 —— 这正是它珍贵的原因。',
        };
      }
      return {
        steps,
        typical: {
          outsAdded: 1,
          runs: state.bases[3] && outsLeft > 0 ? 1 : 0,
          bases: on.filter((b) => b !== 3).map((b) => Math.min(3, b + 1) as 1 | 2 | 3),
          caption: '传杀一垒，打者出局，跑者各进一垒。',
        },
      };
    }

    case 'grounderThrough': {
      steps.push({ text: '球穿过内野防线 —— **一垒安打**，打者安全上一垒。' });
      if (state.bases[3]) steps.push({ text: '三垒跑者轻松回到本垒，**得 1 分**。' });
      if (state.bases[2]) {
        steps.push({
          decision: true,
          text: '二垒跑者冲不冲本垒？三垒跑垒指导员要在半秒内决定。同时外野手也在选：传本垒赌一把，还是传[[截传手]]守住打者不让他多进一个垒？',
        });
      }
      const runs = (state.bases[3] ? 1 : 0) + (state.bases[2] ? 1 : 0);
      return {
        steps,
        typical: {
          outsAdded: 0,
          runs,
          bases: state.bases[1] ? [1, 2] : [1],
          caption: `一垒安打，回来 ${runs} 分。`,
        },
      };
    }

    case 'linerCaught': {
      steps.push({ text: '平飞球被**直接接住** —— 打者立刻出局（[[接杀]]）。' });
      if (on.length && state.outs < 2) {
        steps.push({
          text: `跑者必须回到**原垒**（不是下一个垒）才能再前进。平飞球 0.3 秒内就进了手套，已经起跑的人根本刹不住。`,
        });
        steps.push({
          decision: true,
          text: `野手持球踩哪个原垒？要踩的是跑者**出发的**那个垒 —— ${on
            .map((b) => baseName(b))
            .join('、')}。踩垒即可，**不需要触杀**，而且不限于最前面那个跑者。`,
        });
        if (on.length >= 2) {
          steps.push({
            text: '两名跑者都没回去的话，这一球可以拿到 **3 个出局** —— 三杀。',
          });
        }
      }
      const extra = state.outs < 2 ? Math.min(on.length, outsLeft) : 0;
      return {
        steps,
        typical: {
          outsAdded: (1 + extra) as 0 | 1 | 2 | 3,
          runs: 0,
          bases: on.slice(extra),
          caption: extra >= 2 ? '三杀。' : extra === 1 ? '接杀 + 回垒不及，双杀。' : '接杀，打者出局。',
        },
      };
    }

    case 'linerDrops':
      steps.push({ text: '平飞球落地 —— 多半是一支**一垒安打**。' });
      steps.push({
        text: '注意和上一种的区别：球**没有**被直接接住，所以跑者不用回原垒，直接往前跑就行。',
      });
      return {
        steps,
        typical: {
          outsAdded: 0,
          runs: state.bases[3] ? 1 : 0,
          bases: state.bases[2] || state.bases[1] ? [1, 2] : [1],
          caption: '一垒安打。',
        },
      };

    case 'flyCaught': {
      steps.push({ text: '外野飞球被**直接接住** —— 打者出局（[[接杀]]）。' });
      if (state.outs === 2) {
        steps.push({ text: '这是**第三个出局**，半局结束。回垒、高飞牺牲打全都无从谈起。' });
        return {
          steps,
          typical: { outsAdded: 1, runs: 0, bases: [], caption: '接杀，半局结束。' },
        };
      }
      steps.push({ text: '所有跑者必须先回到原垒（或者一直待在垒上），球**进手套的瞬间**才能起跑。' });
      if (sacrificeFlyPossible(state)) {
        steps.push({
          decision: true,
          text: '三垒跑者冲不冲？跑者约 3.5 秒；外野手接球的准备动作加上长传通常超过 3.5 秒。飞球够深远就冲，这就是[[高飞牺牲打]]。',
        });
      }
      if (on.length && !sacrificeFlyPossible(state)) {
        steps.push({
          text: '前面的跑者一般不动 —— 从二垒跑到三垒换不来分，还可能被传杀。',
        });
      }
      const scored = sacrificeFlyPossible(state) ? 1 : 0;
      return {
        steps,
        typical: {
          outsAdded: 1,
          runs: scored,
          bases: on.filter((b) => !(scored && b === 3)),
          caption: scored ? '高飞牺牲打，换回 1 分。' : '接杀，跑者留在原地。',
        },
      };
    }

    case 'flyDrops': {
      steps.push({ text: '球落在外野手之间 —— 通常是一支**二垒安打**。' });
      steps.push({ text: '球没被接住，所以不用回垒；两出局时跑者早就起跑了，回来得更多。' });
      const runs = on.filter((b) => b >= 2 || state.outs === 2).length;
      return {
        steps,
        typical: { outsAdded: 0, runs, bases: [2], caption: `二垒安打，回来 ${runs} 分。` },
      };
    }

    case 'homeRun': {
      const runs = homeRunRuns(state.bases);
      steps.push({ text: '界内飞过外野围墙 —— **本垒打**，球出场即死球。' });
      steps.push({
        text: `打者和所有跑者无风险地绕垒回本垒，得 **${runs} 分**（1 + 垒上跑者数）。没有额外加分。`,
      });
      if (runs === 4) steps.push({ text: '满垒时的本垒打就是**满贯**，4 分，这是单球的上限。' });
      steps.push({ text: '唯一要注意的是每个垒都得按顺序踩到 —— 漏踩会被申诉出局。' });
      return {
        steps,
        typical: { outsAdded: 0, runs, bases: [], caption: `本垒打，${runs} 分。` },
      };
    }

    case 'bunt': {
      steps.push({ text: '打者摆出触击姿势，把球轻轻挡到内野前方。' });
      if (state.count.strikes === 2) {
        steps.push({
          text: '⚠️ 2 好球时触击很危险：碰成**界外就是三振**，不是普通界外球。',
        });
      }
      if (squeezeEffective(state)) {
        steps.push({
          decision: true,
          text: '三垒有人，可以打[[抢分触击]]：自杀式（投手一出手跑者就冲，没碰到球的话跑者多半被夹杀）还是安全式（看到触击成功再跑）？',
        });
      } else if (state.bases[3] && state.outs === 2) {
        steps.push({
          text: '两出局时抢分触击**无效**：打者在一垒前出局就是第三出局，这一球的分一律不算。',
        });
      }
      if (on.length && state.outs < 2 && !state.bases[3]) {
        steps.push({
          text: '这是[[牺牲触击]]：主动花一个出局，把跑者推进一个垒。',
        });
      }
      const scored = squeezeEffective(state) ? 1 : 0;
      return {
        steps,
        typical: {
          outsAdded: 1,
          runs: scored,
          bases: on.filter((b) => b !== 3).map((b) => Math.min(3, b + 1) as 1 | 2 | 3),
          caption: scored ? '抢分触击成功，1 分。' : '牺牲触击，跑者各进一垒。',
        },
      };
    }
  }
}

/** 预设示例（交接文档 A-12）：8 局下半，落后 1 分，两出局，二三垒有人。 */
export const PRESET = {
  title: '8 局下半，落后 1 分，两出局，二三垒有人',
  body: '三垒跑者是**追平分**，二垒跑者是**反超分**。两出局，球一碰到棒所有人起跑。防守方还有一个站位上的两难：外野前移更容易在本垒传杀，但深远的飞球会越过头顶变成长打。',
  state: { outs: 2 as const, bases: [2, 3] as (1 | 2 | 3)[], balls: 1 as const, strikes: 1 as const },
};
