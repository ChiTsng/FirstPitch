/**
 * 防守 9 个位置。编号 1–9 是记录防守过程用的，例如 6-4-3 双杀
 * 就是「游击手 → 二垒手 → 一垒手」。
 */

export interface Fielder {
  no: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  zh: string;
  ja: string;
  en: string;
  zone: '内野' | '外野';
  /** 这个位置在场上主要负责什么 */
  duty: string;
}

export const FIELDERS: Fielder[] = [
  {
    no: 1,
    zh: '投手',
    ja: '投手（ピッチャー）',
    en: 'pitcher',
    zone: '内野',
    duty: '出手之后他就是野手：一垒手去接球时补位一垒，三垒有人时暴投补位本垒，外野长传时在捕手或三垒手身后后援。',
  },
  {
    no: 2,
    zh: '捕手',
    ja: '捕手（キャッチャー）',
    en: 'catcher',
    zone: '内野',
    duty: '全场唯一面向场内的野手，负责指挥站位与截传。守本垒、处理本垒附近的触击和界外高飞；垒上无人时沿一垒边线后援一垒。',
  },
  {
    no: 3,
    zh: '一垒手',
    ja: '一塁手（ファースト）',
    en: 'first baseman',
    zone: '内野',
    duty: '接住所有传向一垒的球完成封杀。球在中外野或右外野传本垒时当截传手。',
  },
  {
    no: 4,
    zh: '二垒手',
    ja: '二塁手（セカンド）',
    en: 'second baseman',
    zone: '内野',
    duty: '守一二垒之间。游击手接球时由他补位二垒（6-4-3）；球打到很深的右外野时跑出去当中继手。',
  },
  {
    no: 5,
    zh: '三垒手',
    ja: '三塁手（サード）',
    en: 'third baseman',
    zone: '内野',
    duty: '守三垒线附近，要处理最快最强的拉打球，所以三垒又叫「热角」。球在左外野传本垒时当截传手。',
  },
  {
    no: 6,
    zh: '游击手',
    ja: '遊撃手（ショート）',
    en: 'shortstop',
    zone: '内野',
    duty: '守二三垒之间，内野守备范围最大的位置。二垒手接球时由他补位二垒（4-6-3）。',
  },
  {
    no: 7,
    zh: '左外野手',
    ja: '左翼手（レフト）',
    en: 'left fielder',
    zone: '外野',
    duty: '守左外野。传本垒距离最短的外野位置。',
  },
  {
    no: 8,
    zh: '中外野手',
    ja: '中堅手（センター）',
    en: 'center fielder',
    zone: '外野',
    duty: '守中外野，范围最大、指挥两侧外野手，两人同时去接时以他为准。',
  },
  {
    no: 9,
    zh: '右外野手',
    ja: '右翼手（ライト）',
    en: 'right fielder',
    zone: '外野',
    duty: '守右外野。传三垒距离最远，所以通常要求臂力最强。',
  },
];

export const FIELDER_BY_NO = Object.fromEntries(FIELDERS.map((f) => [f.no, f])) as Record<
  number,
  Fielder
>;
