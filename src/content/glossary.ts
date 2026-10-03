/**
 * 中日英术语表（交接文档附录 C）。
 *
 * 正文里写 [[本垒打]] 就会自动挂上日英对照的悬停提示，靠的就是这张表。
 * 加词条只要往下面加一行。
 */

export type TermCategory = '人员' | '场地' | '球数' | '结果' | '动作' | '状态' | '妨碍' | '结构';

export interface Term {
  cat: TermCategory;
  zh: string;
  ja: string;
  en: string;
  /** 正文里可能用到的别名，也会挂上提示 */
  alias?: string[];
}

export const TERMS: Term[] = [
  // ── 人员 ──────────────────────────────────────
  { cat: '人员', zh: '投手', ja: '投手（ピッチャー）', en: 'pitcher' },
  { cat: '人员', zh: '捕手', ja: '捕手（キャッチャー）', en: 'catcher' },
  { cat: '人员', zh: '打者', ja: '打者（バッター）', en: 'batter' },
  { cat: '人员', zh: '击跑员', ja: '打者走者', en: 'batter-runner' },
  { cat: '人员', zh: '跑者', ja: '走者（ランナー）', en: 'runner' },
  { cat: '人员', zh: '野手', ja: '野手', en: 'fielder' },
  { cat: '人员', zh: '一垒手', ja: '一塁手（ファースト）', en: 'first baseman' },
  { cat: '人员', zh: '二垒手', ja: '二塁手（セカンド）', en: 'second baseman' },
  { cat: '人员', zh: '三垒手', ja: '三塁手（サード）', en: 'third baseman' },
  { cat: '人员', zh: '游击手', ja: '遊撃手（ショート）', en: 'shortstop' },
  { cat: '人员', zh: '左外野手', ja: '左翼手（レフト）', en: 'left fielder' },
  { cat: '人员', zh: '中外野手', ja: '中堅手（センター）', en: 'center fielder' },
  { cat: '人员', zh: '右外野手', ja: '右翼手（ライト）', en: 'right fielder' },
  { cat: '人员', zh: '先发投手', ja: '先発投手', en: 'starting pitcher' },
  { cat: '人员', zh: '后援投手', ja: '救援投手（リリーフ）', en: 'relief pitcher' },
  { cat: '人员', zh: '终结者', ja: '抑え（クローザー）', en: 'closer' },
  { cat: '人员', zh: '指定打击', ja: '指名打者（DH）', en: 'designated hitter', alias: ['DH'] },
  { cat: '人员', zh: '代打', ja: '代打', en: 'pinch hitter' },
  { cat: '人员', zh: '代跑', ja: '代走', en: 'pinch runner' },
  { cat: '人员', zh: '跑垒指导员', ja: 'ベースコーチ', en: 'base coach' },
  { cat: '人员', zh: '主审', ja: '球審', en: 'plate umpire' },
  { cat: '人员', zh: '垒审', ja: '塁審', en: 'base umpire' },

  // ── 场地 ──────────────────────────────────────
  { cat: '场地', zh: '本垒', ja: '本塁（ホーム）', en: 'home plate', alias: ['本垒板'] },
  { cat: '场地', zh: '垒', ja: '塁（ベース）', en: 'base', alias: ['垒包'] },
  { cat: '场地', zh: '一垒', ja: '一塁（ファースト）', en: 'first base' },
  { cat: '场地', zh: '二垒', ja: '二塁（セカンド）', en: 'second base' },
  { cat: '场地', zh: '三垒', ja: '三塁（サード）', en: 'third base' },
  { cat: '场地', zh: '投手丘', ja: 'マウンド', en: 'mound' },
  { cat: '场地', zh: '投手板', ja: '投手板（プレート）', en: "pitcher's plate, rubber" },
  { cat: '场地', zh: '打者区', ja: 'バッターボックス', en: "batter's box" },
  { cat: '场地', zh: '好球带', ja: 'ストライクゾーン', en: 'strike zone' },
  { cat: '场地', zh: '界内', ja: 'フェア', en: 'fair' },
  { cat: '场地', zh: '界外', ja: 'ファウル', en: 'foul' },
  { cat: '场地', zh: '内野', ja: '内野', en: 'infield' },
  { cat: '场地', zh: '外野', ja: '外野', en: 'outfield' },
  { cat: '场地', zh: '跑垒道', ja: 'スリーフットレーン', en: 'running lane' },
  { cat: '场地', zh: '准备区', ja: 'ネクストバッターズサークル', en: 'on-deck circle' },
  { cat: '场地', zh: '休息区', ja: 'ベンチ', en: 'dugout' },

  // ── 球数 ──────────────────────────────────────
  { cat: '球数', zh: '好球', ja: 'ストライク', en: 'strike' },
  { cat: '球数', zh: '坏球', ja: 'ボール', en: 'ball' },
  { cat: '球数', zh: '球数', ja: 'カウント', en: 'count' },

  // ── 结果 ──────────────────────────────────────
  { cat: '结果', zh: '三振', ja: '三振', en: 'strikeout' },
  { cat: '结果', zh: '不死三振', ja: '振り逃げ', en: 'uncaught third strike' },
  { cat: '结果', zh: '擦棒被捕', ja: 'ファウルチップ', en: 'foul tip' },
  { cat: '结果', zh: '界外球', ja: 'ファウル', en: 'foul ball' },
  {
    cat: '结果',
    zh: '四坏球保送',
    ja: '四球（フォアボール）',
    en: 'walk, base on balls',
    alias: ['保送', '四坏球'],
  },
  { cat: '结果', zh: '故意四坏球', ja: '敬遠（申告敬遠）', en: 'intentional walk', alias: ['故意保送'] },
  { cat: '结果', zh: '触身球', ja: '死球（デッドボール）', en: 'hit by pitch' },
  { cat: '结果', zh: '安打', ja: '安打（ヒット）', en: 'hit' },
  { cat: '结果', zh: '一垒安打', ja: '単打（シングルヒット）', en: 'single' },
  { cat: '结果', zh: '二垒安打', ja: '二塁打', en: 'double' },
  { cat: '结果', zh: '三垒安打', ja: '三塁打', en: 'triple' },
  { cat: '结果', zh: '内野安打', ja: '内野安打', en: 'infield hit' },
  { cat: '结果', zh: '本垒打', ja: '本塁打（ホームラン）', en: 'home run' },
  { cat: '结果', zh: '满贯本垒打', ja: '満塁ホームラン', en: 'grand slam', alias: ['满贯'] },
  { cat: '结果', zh: '失误', ja: '失策（エラー）', en: 'error' },
  {
    cat: '结果',
    zh: '野手选择',
    ja: '野手選択（フィルダースチョイス）',
    en: "fielder's choice",
  },
  { cat: '结果', zh: '暴投', ja: '暴投（ワイルドピッチ）', en: 'wild pitch' },
  { cat: '结果', zh: '捕逸', ja: '捕逸（パスボール）', en: 'passed ball' },
  { cat: '结果', zh: '出局', ja: 'アウト', en: 'out' },
  { cat: '结果', zh: '安全', ja: 'セーフ', en: 'safe' },
  { cat: '结果', zh: '得分', ja: '得点', en: 'run' },

  // ── 动作 ──────────────────────────────────────
  { cat: '动作', zh: '封杀', ja: '封殺（フォースアウト）', en: 'force out' },
  { cat: '动作', zh: '触杀', ja: '触殺（タッチアウト）', en: 'tag out' },
  { cat: '动作', zh: '接杀', ja: 'フライアウト', en: 'fly out, catch' },
  { cat: '动作', zh: '双杀', ja: '併殺（ゲッツー、ダブルプレー）', en: 'double play' },
  { cat: '动作', zh: '三杀', ja: '三重殺（トリプルプレー）', en: 'triple play' },
  { cat: '动作', zh: '夹杀', ja: '挟殺（ランダウン）', en: 'rundown' },
  { cat: '动作', zh: '回垒', ja: 'タッチアップ', en: 'tag up' },
  { cat: '动作', zh: '回垒不及被双杀', ja: '飛び出し', en: 'doubled off' },
  { cat: '动作', zh: '高飞牺牲打', ja: '犠牲フライ', en: 'sacrifice fly' },
  { cat: '动作', zh: '触击', ja: 'バント', en: 'bunt' },
  { cat: '动作', zh: '牺牲触击', ja: '送りバント（犠打）', en: 'sacrifice bunt' },
  { cat: '动作', zh: '抢分触击', ja: 'スクイズ', en: 'squeeze play' },
  { cat: '动作', zh: '盗垒', ja: '盗塁', en: 'stolen base' },
  { cat: '动作', zh: '延迟盗垒', ja: 'ディレードスチール', en: 'delayed steal' },
  { cat: '动作', zh: '离垒', ja: 'リード', en: 'lead' },
  { cat: '动作', zh: '牵制', ja: '牽制', en: 'pickoff' },
  { cat: '动作', zh: '滑垒', ja: 'スライディング', en: 'slide' },
  { cat: '动作', zh: '投手犯规', ja: 'ボーク', en: 'balk', alias: ['balk'] },
  { cat: '动作', zh: '内野高飞必死', ja: 'インフィールドフライ', en: 'infield fly rule' },
  { cat: '动作', zh: '截传手', ja: 'カットマン', en: 'cutoff man' },
  { cat: '动作', zh: '中继', ja: '中継（リレー）', en: 'relay', alias: ['中继手'] },
  { cat: '动作', zh: '补位', ja: 'ベースカバー', en: 'covering a base' },
  { cat: '动作', zh: '后援', ja: 'バックアップ', en: 'backing up' },
  { cat: '动作', zh: '偷好球', ja: 'フレーミング', en: 'framing' },

  // ── 状态 ──────────────────────────────────────
  { cat: '状态', zh: '活球', ja: 'インプレイ', en: 'live ball' },
  { cat: '状态', zh: '死球', ja: 'ボールデッド', en: 'dead ball' },
  { cat: '状态', zh: '暂停', ja: 'タイム', en: 'time' },

  // ── 妨碍 ──────────────────────────────────────
  {
    cat: '妨碍',
    zh: '打者/跑者妨碍野手',
    ja: '守備妨害',
    en: "batter's / runner's interference",
    alias: ['守备妨碍'],
  },
  { cat: '妨碍', zh: '捕手妨碍打者', ja: '打撃妨害', en: "catcher's interference" },
  { cat: '妨碍', zh: '野手阻挡跑者', ja: '走塁妨害', en: 'obstruction' },

  // ── 结构 ──────────────────────────────────────
  { cat: '结构', zh: '局', ja: '回（イニング）', en: 'inning' },
  { cat: '结构', zh: '上半局', ja: '表', en: 'top' },
  { cat: '结构', zh: '下半局', ja: '裏', en: 'bottom' },
  { cat: '结构', zh: '延长赛', ja: '延長戦', en: 'extra innings' },
  { cat: '结构', zh: '再见', ja: 'サヨナラ', en: 'walk-off' },
  { cat: '结构', zh: '打序', ja: '打順', en: 'batting order' },
  { cat: '结构', zh: '投打二刀流', ja: '二刀流', en: 'two-way player' },
];

/** 易错对照：这几条在术语表里单独高亮。 */
export const PITFALLS: { title: string; body: string }[] = [
  {
    title: '持球踩垒能出局，不代表都叫封杀',
    body: '**封杀**针对因打者成为跑者而失去原垒占有权的跑者；**击跑员上一垒前出局**属于另一类。两者若是第三出局，都使这一球的得分无效，包含不死三振后的击跑员出局。若只是第一或第二出局，其他跑者合法跑回的分仍可计入。',
  },
  {
    title: '中文「死球」≠ 日语「死球」',
    body: '中文的**死球**是 dead ball，球停了、谁都不能出局；日语的**死球（デッドボール）**却是**触身球**（hit by pitch）。日语说 dead ball 要用**ボールデッド**。看日本转播时这一条最容易听岔。',
  },
  {
    title: '日语的妨碍按「被妨碍的一方」命名',
    body: '**守備妨害** = 打者或跑者妨碍了野手守备；**打撃妨害** = 捕手妨碍了打者打击；**走塁妨害** = 野手挡了跑者的路（英语 obstruction）。中文习惯按「谁妨碍谁」说，方向正好相反，读日语记录时要当心。',
  },
  {
    title: '中文「再见」借自日语',
    body: '主队在最后一局下半反超、比赛立刻结束，中文说**再见**（再见安打、再见本垒打），直接借自日语的**サヨナラ**。英语是美式说法 **walk-off**（投手走下场）。',
  },
  {
    title: '「接住」要说清楚是不是直接接住',
    body: '**直接接住**（接杀）与落地后捡起完全不同：前者打者立刻出局、跑者必须回原垒；后者是安打，跑者不用回垒。另外，先碰围墙再接住不算接杀；接住后在转手传球时掉球，仍算接杀。',
  },
];

/** 建一张 词 → 条目 的查找表，别名也指向同一条。 */
export const TERM_INDEX: Map<string, Term> = (() => {
  const m = new Map<string, Term>();
  for (const t of TERMS) {
    m.set(t.zh, t);
    for (const a of t.alias ?? []) m.set(a, t);
  }
  return m;
})();

export function searchTerms(query: string): Term[] {
  const q = query.trim().toLowerCase();
  if (!q) return TERMS;
  return TERMS.filter(
    (t) =>
      t.zh.toLowerCase().includes(q) ||
      t.ja.toLowerCase().includes(q) ||
      t.en.toLowerCase().includes(q) ||
      (t.alias ?? []).some((a) => a.toLowerCase().includes(q)),
  );
}
