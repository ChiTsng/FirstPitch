/**
 * 原理总结（交接文档附录 A-10）。
 *
 * 学完六层之后，全部规则可以收敛成：一个目标 + 五条原理 + 一条元原理 + 几个参数。
 * 这一页的价值在于**双向**：从原理能推出规则，从规则也能追回原理。
 */

export const GOAL = {
  title: '目标',
  body: '每半局，进攻方有 **3 次出局的额度**，要在用完之前把尽可能多的人按 一垒 → 二垒 → 三垒 → 本垒 的顺序送回本垒，每人 1 分；防守方则要用最少的代价花掉这 3 次。9 局之后得分多者胜。',
  oneLine:
    '进攻方每半局有 3 次「生命」，要在用完之前把尽可能多的人一站站送回本垒。',
};

export interface Principle {
  id: string;
  no: string;
  name: string;
  body: string;
}

export const PRINCIPLES: Principle[] = [
  {
    id: 'live',
    no: '1',
    name: '活球',
    body: '默认是**活球**。活球时任何人都可以自担风险前进，任何人都可能出局；死球时一切冻结，谁都不能出局，跑者只能拿裁判判给的垒。',
  },
  {
    id: 'qualify',
    no: '2',
    name: '资格',
    body: '打者赢了与投手的对决就成为跑者（把球打进界内且没被直接接住，或者投手先犯规：4 坏球、触身球）；输了就出局（3 个好球、被直接接住）。计数由裁判判定，但**任何出局都必须由持球的防守动作完成**。',
  },
  {
    id: 'safe',
    no: '3',
    name: '安全',
    body: '每个垒同时只属于一个跑者，**前面的优先**。碰着自己有权占据的垒就安全；离开垒时被持球者碰到就出局。',
  },
  {
    id: 'force',
    no: '4',
    name: '强迫',
    body: '打者离开本垒之后，**从一垒起连续有人**的跑者失去了留在原垒的权利。对他们，持球踩目标垒即出局；**源头（打者）一出局，整条链解除**。',
  },
  {
    id: 'catch',
    no: '5',
    name: '接杀',
    body: '打出的球被**直接接住**：打者出局，之前的跑垒作废，跑者必须回到**原垒**才能再前进；没回到之前，持球踩他的原垒即出局。',
  },
  {
    id: 'meta',
    no: '元',
    name: '不许利用规则本身获利',
    body: '一方靠欺骗、故意制造局面或阻挡来获利时，规则会**恢复「本来会发生的结果」**并惩罚违规方。这是上面五条之外的一条元原理，专门用来堵漏洞。',
  },
];

export interface DerivedRule {
  id: string;
  name: string;
  /** 由哪几条原理推出。可以不止一条。 */
  from: string[];
  note: string;
}

export const DERIVED_RULES: DerivedRule[] = [
  // 1 活球
  { id: 'steal', name: '盗垒', from: ['live'], note: '活球时跑者随时可以自担风险前进。' },
  { id: 'delayed', name: '延迟盗垒', from: ['live'], note: '捕手回传投手的那一瞬间，球仍然是活的。' },
  {
    id: 'hidden',
    name: '隐藏球把戏',
    from: ['live', 'safe'],
    note: '一回合结束时球多半**仍是活球**，只是大家都停下了 —— 所以藏球触杀离垒的跑者是合法的。',
  },
  { id: 'foulReturn', name: '界外球跑者回原垒', from: ['live'], note: '界外是死球，一切冻结，跑者回原垒。' },
  {
    id: 'hrTrot',
    name: '本垒打绕垒无风险',
    from: ['live'],
    note: '球出场即死球，谁都不能出局，跑者按顺序踩完每个垒即可。',
  },

  // 2 资格
  { id: 'zone', name: '好球带', from: ['qualify'], note: '划定「这一球打者该不该打」的界限。' },
  { id: 'strikeout', name: '三振', from: ['qualify'], note: '3 个好球 = 打者输掉这次对决。' },
  { id: 'walk', name: '四坏球保送', from: ['qualify'], note: '投手躲了 4 次 = 投手输掉这次对决。' },
  { id: 'fairFoul', name: '界内与界外', from: ['qualify'], note: '限定打者必须往那 90 度里打。' },
  {
    id: 'hitDef',
    name: '安打、失误、野手选择的区分',
    from: ['qualify'],
    note: '打者是靠自己赢的，还是靠对方失误 —— 记录上要分清。',
  },
  {
    id: 'uncaught',
    name: '不死三振',
    from: ['qualify', 'meta'],
    note: '第三好球未被合法接住时，一垒空或已有两出局，打者仍有上垒机会。一垒有人且不到两出局时则直接出局，防止捕手故意漏接谋取双杀。',
  },

  // 3 安全
  { id: 'tag', name: '触杀', from: ['safe'], note: '不被迫的跑者，必须持球碰到他本人。' },
  { id: 'rundown', name: '夹杀', from: ['safe'], note: '跑者停在两垒之间，两边都没有安全的垒。' },
  { id: 'noPass', name: '不能超越前面的跑者', from: ['safe'], note: '一个垒只属于一个人，前者优先。' },
  { id: 'slide', name: '滑垒与勾滑', from: ['safe'], note: '目的地固定，跑者只能减小被碰到的面积。' },
  {
    id: 'lane09',
    name: '偏离跑垒路线 0.9 m 即出局',
    from: ['safe', 'meta'],
    note: '不许靠绕大圈躲开触杀。',
  },

  // 4 强迫
  { id: 'forceOut', name: '封杀', from: ['force'], note: '被迫的跑者，踩他要去的垒即可。' },
  { id: 'dp', name: '双杀（4-6-3、6-4-3）', from: ['force'], note: '先封杀被迫前进的跑者，再传杀尚未上一垒的打者；后一个出局严格说不是封杀。' },
  {
    id: 'walkRun',
    name: '满垒保送挤回一分',
    from: ['force'],
    note: '链条一路推到三垒，三垒跑者被挤回本垒。',
  },
  {
    id: 'ibb',
    name: '一垒空着时保送不丢分',
    from: ['force'],
    note: '链条长度为零 —— 这正是故意保送挑一垒空着的时候的原因。',
  },
  {
    id: 'dp323',
    name: '3-2-3 的顺序',
    from: ['force'],
    note: '先传本垒封杀、再回传一垒；反过来的话打者一出局，本垒就必须触杀了。',
  },
  {
    id: 'thirdOut',
    name: '第三出局与得分',
    from: ['force', 'catch'],
    note: '第三出局是封杀或打者没上一垒 → 这一球的分一律不算；非被迫跑者的触杀（不含击跑员上一垒前出局）→ 比时间。',
  },

  // 5 接杀
  { id: 'tagUp', name: '回垒', from: ['catch'], note: '球进手套之后才能起跑。' },
  { id: 'sacFly', name: '高飞牺牲打', from: ['catch'], note: '用打者一个出局换一分。' },
  { id: 'doubledOff', name: '回垒不及被双杀', from: ['catch'], note: '持球踩他的原垒即可，不用触杀。' },
  { id: 'tp', name: '平飞球三杀', from: ['catch'], note: '每个提前离垒的跑者都可以这样处理。' },
  {
    id: 'twoOutRun',
    name: '两出局时起跑没有风险',
    from: ['catch'],
    note: '接杀即第三出局，回垒规则失去意义。',
  },

  // 元原理
  { id: 'balk', name: 'balk（投手犯规）', from: ['meta'], note: '不许用假动作骗跑者。' },
  {
    id: 'ifr',
    name: '内野高飞必死',
    from: ['meta', 'force', 'catch'],
    note: '不许靠故意漏接制造「怎么选都双杀」的局面。',
  },
  {
    id: 'foulStrike',
    name: '界外算好球，及其例外',
    from: ['meta'],
    note: '不许靠无限界外拖延；但碰到球也不该和挥空受同样惩罚。',
  },
  { id: 'buntFoul', name: '2 好球触击界外三振', from: ['meta'], note: '触击碰成界外太容易了。' },
  {
    id: 'interference',
    name: '各类妨碍的判罚',
    from: ['meta'],
    note: '处理方式大多是恢复「如果没被妨碍会发生什么」。',
  },
  { id: 'noReverse', name: '不能倒着跑垒', from: ['meta'], note: '不许靠扰乱防守获利。' },
];

export const PARAMETERS: { name: string; value: string; note?: string }[] = [
  { name: '出局数', value: '3', note: '每半局的「生命」数' },
  { name: '好球', value: '3' },
  { name: '坏球', value: '4', note: '这个数经过多次调整才定下来' },
  { name: '局数', value: '9' },
  { name: '每队上场人数', value: '9' },
  { name: '垒间距离', value: '27.43 m', note: '90 英尺' },
  { name: '投球距离', value: '18.44 m', note: "60 英尺 6 英寸" },
];

export const CLOSING = [
  '**参数是历史调出来的数值，不改变结构。** 把 3 改成 4、把 9 局改成 7 局，棒球还是棒球；把「强迫」或「接杀」拿掉，它就不是了。',
  '牺牲触击和高飞牺牲打是主动花一条命换跑者前进；双杀之所以珍贵，是因为一次就花掉对方两条命。',
];
