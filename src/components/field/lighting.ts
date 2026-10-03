/**
 * 夜场的照明。
 *
 * 纯装饰：不参与任何几何计算，也不影响任何规则的表达，
 * 所以和按真实米数建立的 geometry.ts 分开放。
 *
 * 思路是「光是相加的」：四座照明塔各在草皮上投下一个椭圆光池，
 * 光池用 mix-blend-mode: screen 叠加，内野是四束光的交集所以最亮，
 * 再在最上面压一层全场暗角，四角沉进黑暗。
 * 「孤岛般的一片光」是靠暗角来的，不是靠把光调亮。
 */

import { polar, toSvg, type Pt } from './geometry';

/** 一个光池。坐标已经是 SVG 坐标（y 向下），旋转按 SVG 的顺时针为正。 */
export interface LightPool {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** 长轴朝向：从塔指向球场，度 */
  rotate: number;
  /** 峰值不透明度 */
  peak: number;
}

/** 照明塔（世界坐标）。θ 从中外野量起，+θ 朝一垒侧。 */
export interface Tower {
  id: string;
  at: Pt;
  /** 辉光半径，米 */
  glow: number;
}

const tower = (id: string, thetaDeg: number, d: number, glow: number): Tower => ({
  id,
  at: polar((thetaDeg * Math.PI) / 180, d),
  glow,
});

/** 两座在外野围墙之后，两座在界外很远的地方。后两座只在全景里露半个身子。 */
export const TOWERS: Tower[] = [
  tower('lf', -32, 140, 26),
  tower('rf', 32, 140, 26),
  tower('3b', -76, 96, 23),
  tower('1b', 76, 96, 23),
];

/** 每座塔投下的光池。长轴朝向是「塔 → 池心」算出来的，见下面的 poolFor()。 */
function poolFor(t: Tower, centre: Pt, rx: number, ry: number, peak: number): LightPool {
  const c = toSvg(centre);
  const s = toSvg(t.at);
  return {
    cx: c.x,
    cy: c.y,
    rx,
    ry,
    rotate: (Math.atan2(c.y - s.y, c.x - s.x) * 180) / Math.PI,
    peak,
  };
}

/**
 * 池子要**大而弱**：四个小而亮的池子会在草皮上留下四个热点，
 * 读起来像四团污渍。大池子互相叠加，最亮的地方自然落在四束光的交集 ——
 * 也就是内野 —— 这才是夜场的样子。
 */
export const LIGHT_POOLS: LightPool[] = [
  poolFor(TOWERS[0], { x: -18, y: 28 }, 80, 54, 0.12),
  poolFor(TOWERS[1], { x: 18, y: 28 }, 80, 54, 0.12),
  poolFor(TOWERS[2], { x: -30, y: 6 }, 68, 42, 0.13),
  poolFor(TOWERS[3], { x: 30, y: 6 }, 68, 42, 0.13),
];

/**
 * 第 0–1 层用的本垒光池。
 *
 * 这两层还没有球场，只有黑暗里的三个人，所以不点四座塔 ——
 * 只在本垒上方留一小片光，让打者站在光里。
 */
export const HOME_POOL: LightPool = {
  cx: 0,
  cy: -1.6,
  rx: 7.2,
  ry: 5,
  rotate: 0,
  peak: 0.3,
};
