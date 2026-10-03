/**
 * 时间数据（交接文档附录 D）。MLB 水平，都是约数。
 *
 * 这些数字的用处是**验算战术**：一条规则合不合理、一个跑法来不来得及，
 * 往往就差十分之一秒。高中棒球整体更慢，比例关系仍然成立。
 */

export interface TimingFact {
  item: string;
  value: string;
  /** 用于赛跑计时组件的秒数，没有单一数值的留空 */
  seconds?: number;
  note?: string;
}

export const TIMING_FACTS: TimingFact[] = [
  { item: '150 km/h 快速球，出手到本垒', value: '≈ 0.4 s', seconds: 0.4 },
  { item: '快速动作投球（抬腿到进手套）', value: '≈ 1.3 s', seconds: 1.3 },
  {
    item: '捕手 pop time（接球到二垒手套）',
    value: '≈ 2.0 s',
    seconds: 2.0,
    note: '顶尖捕手在 1.8 s 多',
  },
  { item: '打者本垒到一垒', value: '≈ 4.2 s', seconds: 4.2, note: '快的 3.9 s' },
  { item: '有助跑的一个垒间', value: '≈ 3.3–3.5 s', seconds: 3.4 },
  { item: '绕全垒一周', value: '≈ 14–16 s', seconds: 15 },
  { item: '游击手传一垒（约 35 m）', value: '飞行 ≈ 1 s', seconds: 1.0 },
  { item: '普通滚地球出局（击球到一垒手套）', value: '≈ 4 s', seconds: 4.0 },
  { item: '完整双杀', value: '≈ 4.3 s', seconds: 4.3 },
  { item: '高飞球滞空', value: '≈ 4–6 s', seconds: 5 },
  {
    item: '外野长传本垒（70–90 m）',
    value: '≈ 2.5–3 s',
    seconds: 2.8,
    note: '另加接球与调整的准备动作',
  },
];

export interface RaceSegment {
  id: string;
  label: string;
  seconds: number;
  min: number;
  max: number;
  /** 属于防守方还是跑者 */
  side: 'defense' | 'runner';
  note?: string;
}

export interface RaceScenario {
  id: string;
  title: string;
  setup: string;
  segments: RaceSegment[];
  /** 防守方赢时说什么、跑者赢时说什么 */
  defenseWins: string;
  runnerWins: string;
  takeaway: string;
}

export const RACE_SCENARIOS: RaceScenario[] = [
  {
    id: 'steal',
    title: '盗二垒',
    setup: '一垒有跑者，投手出手的瞬间他起跑。防守方要在他碰到二垒之前把球送到二垒手套里。',
    segments: [
      {
        id: 'pitch',
        label: '投球（抬腿到进手套）',
        seconds: 1.3,
        min: 1.0,
        max: 1.8,
        side: 'defense',
        note: '快速动作投法。用大动作会更慢，跑者就更容易盗。',
      },
      {
        id: 'pop',
        label: '捕手接球到传出并到二垒',
        seconds: 2.0,
        min: 1.75,
        max: 2.4,
        side: 'defense',
        note: 'pop time。顶尖捕手 1.8 s 多。',
      },
      {
        id: 'run',
        label: '跑者一垒到二垒',
        seconds: 3.4,
        min: 3.0,
        max: 3.9,
        side: 'runner',
        note: '有离垒助跑的一个垒间。',
      },
    ],
    defenseWins: '球先到 —— 跑者被触杀，**盗垒失败**。',
    runnerWins: '跑者先到 —— **盗垒成功**。',
    takeaway:
      '1.3 + 2.0 = 3.3 s 对跑者的 3.3–3.5 s。胜负就在十分之一秒之间，所以投手的「快速动作」和捕手的 pop time 才是防盗垒的关键，而不是传球有多准。',
  },
  {
    id: 'sacfly',
    title: '高飞牺牲打',
    setup: '不到两出局、三垒有人，外野深远飞球被直接接住。跑者必须等球**进手套**才能起跑（回垒）。',
    segments: [
      {
        id: 'catch',
        label: '外野手接球后的准备动作',
        seconds: 0.8,
        min: 0.4,
        max: 1.4,
        side: 'defense',
        note: '调整脚步、拿出球。这一段常被忽略，却决定了成败。',
      },
      {
        id: 'throw',
        label: '外野长传本垒（70–90 m）',
        seconds: 2.8,
        min: 2.2,
        max: 3.4,
        side: 'defense',
      },
      {
        id: 'run',
        label: '跑者三垒到本垒',
        seconds: 3.5,
        min: 3.0,
        max: 4.0,
        side: 'runner',
        note: '从静止的垒包起跑，没有助跑。',
      },
    ],
    defenseWins: '球先到 —— 捕手触杀，跑者出局，**不得分**。',
    runnerWins: '跑者先到 —— **得 1 分**，高飞牺牲打成立。',
    takeaway:
      '跑者 3.5 s 对外野长传的 3.5 s 以上（准备 + 传球）。所以只要飞球够深远，高飞牺牲打通常成立 —— 打者用自己一个出局换回一分。两出局时这套完全失效：接杀就是第三出局，半局结束。',
  },
  {
    id: 'triple',
    title: '平飞球三杀（第 R2-4 题）',
    setup:
      '无人出局、一二垒有人，两名跑者已经起跑。平飞球被游击手**直接接住** —— 跑者必须回到**原垒**。',
    segments: [
      {
        id: 'liner',
        label: '平飞球从击出到进手套',
        seconds: 0.35,
        min: 0.2,
        max: 0.6,
        side: 'defense',
        note: '太快了，跑者根本来不及刹车。',
      },
      {
        id: 'touch',
        label: '游击手踩二垒 + 传一垒踩垒',
        seconds: 1.8,
        min: 1.2,
        max: 2.5,
        side: 'defense',
      },
      {
        id: 'back',
        label: '跑者回头跑回原垒',
        seconds: 2.4,
        min: 1.8,
        max: 3.2,
        side: 'runner',
        note: '已经起跑了，要先停下、转身、再跑回去。',
      },
    ],
    defenseWins: '防守方先到 —— **三杀**，一球三个出局，半局结束。',
    runnerWins: '跑者赶回去了 —— 只有打者一个出局。',
    takeaway:
      '平飞球 0.3 秒内就被接住，跑者回头要 2 秒以上，所以三杀几乎只出现在平飞球上。注意：跑者回的是**原垒**，踩垒即可，不需要触杀，也不需要按顺序 —— 传三垒完全没有意义。',
  },
  {
    id: 'grounder',
    title: '普通滚地球出局',
    setup: '打者把球打成内野滚地球，必须跑到一垒。这是全场出现次数最多的一次赛跑。',
    segments: [
      {
        id: 'field',
        label: '球滚到野手 + 接球拿出',
        seconds: 1.9,
        min: 1.2,
        max: 2.8,
        side: 'defense',
      },
      {
        id: 'throw',
        label: '传一垒（约 35 m）',
        seconds: 1.0,
        min: 0.8,
        max: 1.4,
        side: 'defense',
      },
      {
        id: 'run',
        label: '打者本垒到一垒',
        seconds: 4.2,
        min: 3.8,
        max: 4.6,
        side: 'runner',
        note: '从静止起跑，还要先完成挥棒动作。快腿 3.9 s。',
      },
    ],
    defenseWins: '防守方先持球触及一垒 —— 打者**出局**。这是击跑员上一垒前出局，严格分类不是[[封杀]]。',
    runnerWins: '打者先到 —— **安全**，而且因为野手接到了球只是来不及传，记[[内野安打]]。',
    takeaway:
      '约 2.9 s 对 4.2 s，所以普通滚地球一般都是出局。把野手接球那一段拖慢半秒（打得远一点、弹跳刁一点），或者打者快半秒，结果就翻过来了。',
  },
];
