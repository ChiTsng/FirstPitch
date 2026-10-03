/** 史实与规则分开叙述；动态数据标注读取日期，来源随条目保存。 */
export interface StorySource { label: string; url: string }
export interface Story {
  id: string;
  meta: string;
  title: string;
  paragraphs: string[];
  lesson: string;
  sources: StorySource[];
}
export const STORIES_REVIEWED = '2026-10-02';
const RULES = 'https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf';
const ABS_RELEASE = 'https://img.mlbstatic.com/opprops-images/image/upload/opprops/jgdgj1bak2bgiskwpdnm.pdf';
const ABS_DATA = 'https://baseballsavant.mlb.com/abs?gameType=regular&level=mlb&year=2026';
export const STORIES: Story[] = [
  {
    id: 'pitching-in', meta: '纽约 · 1857', title: '比赛之前，先同意玩的是同一种棒球',
    paragraphs: [
      '纽约一带的俱乐部在十九世纪中叶各有自己的规则，连球的大小、投球方式都可能不同。两队要比赛，得先谈好怎么玩。',
      '1857 年，Knickerbocker 俱乐部推动召开规则会议。留下来的手稿能看到逐条修改、讨论和统一的痕迹：熟悉的棒球规则，也是人们协商出来的。',
      '本站从「一个人抛球」推演到整场比赛，是帮助理解规则关系的**教学模型**，不是棒球真正诞生的逐日记录。早期棒球也不能简单概括成「原本没有对抗」。',
    ],
    lesson: '规则既让比赛公平，也让不同的人能够玩同一场比赛。',
    sources: [{ label: '美国棒球名人堂 · 1857 年规则手稿展', url: 'https://baseballhall.org/rules-of-base-ball' }],
  },
  {
    id: 'bonds', meta: 'MLB · 1998-05-28', title: 'Barry Bonds：满垒，也可以故意保送',
    paragraphs: [
      '响尾蛇曾在满垒时故意保送 Bonds。防守方宁可直接送出一分，也选择面对下一名打者。',
      '**一垒空不是故意保送的规则前提。**一垒空时，不会挤动任何已有跑者；一垒有人也不一定挤回分数；只有满垒保送，才会直接把三垒跑者挤回本垒。',
      '这是一笔风险交换：眼前送出的分是确定的，让强打者挥棒的代价却不确定。一次选择值得讨论，不等于它在所有局面下都划算。',
    ],
    lesson: '先算保送会推动谁，再讨论避开这个打者是否值得。',
    sources: [{ label: 'MLB · 当场比赛录像', url: 'https://www.mlb.com/video/d-backs-intentionally-walk-bonds-c134341083' }, { label: '官方规则 5.05(b)(1) · 保送', url: RULES }],
  },
  {
    id: 'matsui', meta: '甲子园 · 1992-08-16', title: '松井秀喜：五个打席，五次敬远',
    paragraphs: [
      '明德义塾与星稜在 1992 年夏季甲子园第二轮相遇。明德义塾对松井秀喜的五个打席全部采取故意保送，最终以 **3 比 2** 获胜。',
      '避开强打者是规则允许的选择，但许多观众期待的正是这场投打对决。合法的战术，也可能让观众失望；这段比赛因此留下了持续多年的讨论。',
      '胜利说明那场比赛的结果，并不能单独证明五次保送一定是最优策略。保送增加了垒上的跑者，后续打者仍有机会让这笔代价兑现。',
    ],
    lesson: '规则允许、战术划算、比赛好看，是三个不同的问题。',
    sources: [{ label: '朝日新闻 · 当年比赛报道与记录', url: 'https://info.asahi.com/wp-content/uploads/2025/08/1992_14.pdf' }, { label: '每日新闻 · 当事人回顾访谈', url: 'https://www.youtube.com/watch?v=NBuWmgqL1Lo' }],
  },
  {
    id: 'steal-first', meta: '华盛顿 · 1911-08-04', title: '把二垒偷到手，再「盗回一垒」',
    paragraphs: [
      '跑者 Germany Schaefer 想引诱捕手传球，让三垒队友趁机回家。他先盗上二垒，捕手不理；于是又回到一垒，准备再试一次。',
      '这次花招没有换来分数。Schaefer 再往二垒跑时，三垒上的 Clyde Milan 冲本垒被抓。SABR 的考证也指出，流传的另一个「1908 年版本」存在史料矛盾，不宜混成同一场比赛。',
      '今天的规则 5.09(b)(10) 明确处理**故意反向跑垒以迷惑防守或戏弄比赛**的行为。这不等于正常回垒、折返躲触杀都违法，也不能把所有善用规则的战术一概说成违规。',
    ],
    lesson: '看清条文禁止的是哪一种行为，以及它要求的意图。',
    sources: [{ label: 'SABR · Germany Schaefer 史料考证', url: 'https://sabr.org/bioproj/person/germany-schaefer/' }, { label: '官方规则 5.09(b)(10)', url: RULES }],
  },
  {
    id: 'merkle', meta: '纽约 · 1908-09-23', title: '已经跑回本垒，为什么没有赢？',
    paragraphs: [
      '巨人与小熊战成平手。九局下两出局，一、三垒有人，Al Bridwell 击出安打，三垒跑者回到本垒，看起来比赛已经结束。',
      '但一垒上的 Fred Merkle 没有踩到二垒。小熊针对这一点完成申诉，Merkle 被判出局，那一分被取消。比赛最终按平局处理。',
      '打者成为跑者时，Merkle 就被迫前进到二垒。**漏踩被迫到达的垒所形成的第三出局，属于封杀性质的出局。**它取消这次行动的得分，不比较谁先踏本垒。',
    ],
    lesson: '看似再见的安打，也必须把该完成的跑垒完成。',
    sources: [{ label: 'SABR · Fred Merkle 与这场比赛', url: 'https://sabr.org/bioproj/person/fred-merkle/' }, { label: '官方规则 5.08(a)、5.09(c)', url: RULES }],
  },
  {
    id: 'pine-tar', meta: '纽约 · 1983-07-24', title: '被收回的本垒打，25 天后又接着打',
    paragraphs: [
      '九局上两出局，George Brett 的两分本垒打让皇家以 **5 比 4** 领先洋基。洋基教练 Billy Martin 随后指出：Brett 球棒上的松焦油，超过了握柄允许的 18 英寸范围。',
      '裁判当场判 Brett 出局，取消本垒打，比赛结束。皇家提出抗议后，美国联盟主席 Lee MacPhail 推翻了处理结果。8 月 18 日，比赛从本垒打之后的状态恢复，皇家守住了 5 比 4。',
      '现行规则 3.02(c) 区分「球棒应当停止使用」与「刚才的击球是否无效」：超范围使用握柄材料，要更换球棒；打完后才发现，不能仅凭这一点追溯判打者出局。',
    ],
    lesson: '发现器材问题后怎么处置，也需要一条明确的规则。',
    sources: [{ label: '美国棒球名人堂 · Pine Tar Game', url: 'https://baseballhall.org/discover/inside-pitch/george-brett-pine-tar-game' }, { label: '官方规则 3.02(c)', url: RULES }],
  },
  {
    id: 'pierzynski', meta: '美联冠军赛 · 2005-10-12', title: '第三个好球之后，他还在跑',
    paragraphs: [
      '白袜对天使的美联冠军赛第二场，九局下 **1 比 1、两出局、垒上无人**。A.J. Pierzynski 挥空第三个好球，捕手 Josh Paul 认为已接住球，准备离场；Pierzynski 却跑向一垒。',
      '裁判判定球未被合法接住，让打者上垒。接球判断和裁判手势引发了争议，不能把这段录像讲成毫无疑问的漏接。随后代跑 Pablo Ozuna 盗上二垒，Joe Crede 的二垒安打让白袜以 **2 比 1** 获胜。',
      '符合条件时，第三好球没有被合法接住，出局还没完成。如果击跑员随后在上一垒前成为第三出局，**这一球跑回的分仍然不算**，虽然这种出局严格说不是封杀。',
    ],
    lesson: '「第三好球」「第三出局」「得分成立」需要分别判断。',
    sources: [{ label: 'SABR · 比赛经过与争议双方说法', url: 'https://sabr.org/gamesproj/game/october-12-2005-a-j-pierzynskis-heads-up-baserunning-leads-to-joe-credes-game-winning-hit-to-even-alcs/' }, { label: 'MLB · 当场录像', url: 'https://www.mlb.com/whitesox/video/a-j-takes-first-c20254775' }, { label: '官方规则 5.05(a)(2)、5.08(a)', url: RULES }],
  },
  {
    id: 'ohtani-rule', meta: 'MLB · 2022', title: '大谷规则：把两个身份拆开',
    paragraphs: [
      '过去，球队若让先发投手进入打序，就要放弃 DH。投手结束投球后，想继续留在比赛里打击，可以转守其他位置；并非只能立刻整个人离场。',
      '2022 年修订的规则允许同一个人同时登记为**先发投手和 DH**，把两个身份分开处理：结束投球职责后，还可以作为 DH 留在打序。',
      '它常被称为「大谷规则」，但条文本身并不专属于大谷翔平。符合登记条件的其他球员，也可以使用这个安排。',
    ],
    lesson: '球员离开一个位置，与被替换离开整场比赛，不是一回事。',
    sources: [{ label: '2022 官方规则 · 修订说明与 5.11(b)', url: 'https://img.mlbstatic.com/mlb-images/image/upload/mlb/hhvryxqioipb87os1puw.pdf' }, { label: '2026 官方规则 5.11(b)', url: RULES }],
  },
  {
    id: 'abs-choice', meta: 'MLB · 2026', title: 'ABS：把一次判罚，变成一次选择',
    paragraphs: [
      '大联盟在 2026 赛季采用好坏球挑战制：主审先判，投手、捕手或打者可以立即请求 ABS 复核。每队从两次机会开始，挑战成功则保留机会。',
      '这是在测试和球员反馈之后选择的比赛方式，不能简单说成「只修正明显错判」：一个细微的边角球也可以挑战。保留多少机会、此时是否使用，成了比赛中的新决定。',
      '还有一个容易误读的数字：**挑战翻判率，不是主审所有投球的误判率。**被挑战的球本来就是球员挑出的可疑判罚，用这个样本无法推出裁判整体有多准。',
    ],
    lesson: '读统计之前，先问分母是谁：所有投球，还是被挑出来挑战的投球？',
    sources: [{ label: 'MLB · ABS 挑战制官方公告', url: ABS_RELEASE }, { label: 'Baseball Savant · 挑战记录', url: ABS_DATA }],
  },
];
export interface AbsFact { label: string; value: string }
export const ABS = {
  title: '好球带判定与 ABS',
  why: [
    '规则书里的好球带是**本垒板上方的立体区域**。上沿在肩膀上沿与球裤上沿的中点，下沿在膝盖下方凹处，按打者准备击球时的站姿确定。',
    '假设打者没有挥棒，只要球的一部分穿过区域，就符合好球的空间条件。捕手在哪里接到球，并不等于球在哪里穿过好球带。',
    '主审要从捕手身后判断球是否穿过这个区域；[[偷好球|Framing]] 是捕手接球呈现影响判罚的技术。ABS 复核则依据追踪到的球路。',
  ],
  system: [
    { label: '启用', value: '2026 赛季；2025 年 9 月 23 日获联合竞赛委员会批准' },
    { label: '技术', value: '每座球场 12 台 Hawk-Eye 摄像机追踪投球' },
    { label: '谁能挑战', value: '投手、捕手或打者本人；不得接受教练或其他球员提示' },
    { label: '怎么提出', value: '判罚后立即拍帽子或头盔，并口头提出' },
    { label: '复核用时', value: '约 15 秒' },
    { label: '机会', value: '每队起始 2 次，成功则保留；每个延长局开始时，已无机会的球队补到 1 次' },
    { label: 'ABS 判定区域', value: '本垒板纵深中点处的二维矩形；宽 17 英寸，上沿为测量身高的 53.5%，下沿为 27%' },
  ] as AbsFact[],
  snapshotLabel: '2026 常规赛数据快照 · 读取于 2026-10-02',
  results: [
    { label: '全部挑战', value: '10,557 次；翻判 5,686 次（53.9%）' },
    { label: '打者发起', value: '4,765 次；翻判 2,328 次（48.9%）' },
    { label: '防守方发起（投手与捕手合计）', value: '5,792 次；翻判 3,358 次（58.0%）' },
  ] as AbsFact[],
  takeaway: '这是 Baseball Savant 页面在上述日期的快照，后续可能更新。分母仅为**实际提出的挑战**；未被挑战的投球不在其中。这些数字可以比较挑战结果，不能直接说明裁判整体准确率，也不能单凭它断言某个位置「看得最准」。',
  sources: [{ label: 'MLB · 制度与区域参数', url: ABS_RELEASE }, { label: 'Baseball Savant · 原始统计', url: ABS_DATA }, { label: '官方规则 · STRIKE ZONE 定义', url: RULES }],
};
