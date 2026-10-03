/**
 * 球场几何。单位是**米**，按真实比例。
 *
 * 世界坐标：本垒在原点，+y 指向中外野，+x 指向一垒那一侧。
 * SVG 坐标：x 不变，y 取反（SVG 的 y 向下）。所以本垒仍在原点，
 * 二垒在 y = -38.8 的位置，中外野更靠上。
 *
 * 真实尺寸（交接文档第 4 节 C1）：
 *   垒间 27.43 m，投手板到本垒 18.44 m，本垒两条界线夹角 90°。
 */

export const BASE_DISTANCE = 27.43;
export const MOUND_DISTANCE = 18.44;
/** 跑垒道宽约 0.9 m（three-foot lane），在一垒线后半段 */
export const LANE_WIDTH = 0.9;
/** 触杀时跑者偏离「当前位置到目标垒的直线」左右超过约 0.9 m 即出局 */
export const BASE_PATH_TOLERANCE = 0.9;

export interface Pt {
  x: number;
  y: number;
}

/** 世界坐标 → SVG 坐标 */
export function toSvg(p: Pt): Pt {
  return { x: p.x, y: -p.y };
}

const HALF = BASE_DISTANCE / Math.SQRT2; // 19.40 m

/** 四个垒（世界坐标）。本垒 = home。 */
export const BASES = {
  home: { x: 0, y: 0 },
  first: { x: HALF, y: HALF },
  second: { x: 0, y: BASE_DISTANCE * Math.SQRT2 },
  third: { x: -HALF, y: HALF },
} as const satisfies Record<string, Pt>;

export const MOUND: Pt = { x: 0, y: MOUND_DISTANCE };
/** 捕手蹲在本垒板后约 2.6 m */
export const CATCHER_SPOT: Pt = { x: 0, y: -2.05 };
/**
 * 打者站在**打击区里**。三垒侧（x 为负）那个区是右打者的位置，
 * 区的范围见 batterBoxPath()：|x| 从 0.366 到 1.586，所以站位取 x = -0.95。
 * （原来写的 -2.2 在区外一米，属于画错。）
 */
export const BATTER_SPOT: Pt = { x: -0.95, y: 0.2 };
export const ON_DECK: Pt = { x: -13, y: -8 };

/**
 * 外野围墙到本垒的距离随角度变化：界线方向约 100 m，中外野约 122 m。
 * θ = 0 指向中外野，±45° 是两条界线。
 */
export function fenceDistance(theta: number): number {
  return 100 + 22 * Math.cos(2 * theta);
}

/** 极坐标 → 世界坐标。θ 从中外野方向量起，+θ 朝一垒侧。 */
export function polar(theta: number, d: number): Pt {
  return { x: d * Math.sin(theta), y: d * Math.cos(theta) };
}

export function fencePoint(theta: number): Pt {
  return polar(theta, fenceDistance(theta));
}

const QUARTER = Math.PI / 4;

/** 界线的两个端点（左右外野的边角，也就是界外杆的位置） */
export const FOUL_POLE_RIGHT = fencePoint(QUARTER);
export const FOUL_POLE_LEFT = fencePoint(-QUARTER);

function svgPathFromPoints(points: Pt[], close: boolean): string {
  const d = points
    .map((p, i) => {
      const s = toSvg(p);
      return `${i === 0 ? 'M' : 'L'}${s.x.toFixed(2)} ${s.y.toFixed(2)}`;
    })
    .join(' ');
  return close ? `${d} Z` : d;
}

/** 界内区域：本垒 → 右界外杆 → 沿围墙 → 左界外杆 → 回本垒 */
export function fairTerritoryPath(steps = 40): string {
  const pts: Pt[] = [BASES.home];
  for (let i = 0; i <= steps; i++) {
    pts.push(fencePoint(-QUARTER + (2 * QUARTER * i) / steps));
  }
  return svgPathFromPoints(pts, true);
}

/** 围墙本身（一条弧线，不闭合） */
export function fencePath(steps = 40): string {
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    pts.push(fencePoint(-QUARTER + (2 * QUARTER * i) / steps));
  }
  return svgPathFromPoints(pts, false);
}

/** 内野土外缘的弧：以**投手板**为圆心，半径 28.96 m（95 英尺）。 */
export const INFIELD_ARC_RADIUS = 28.96;

/**
 * 内野土（甲子园式全土内野）。
 *
 * 形状 = 两条界线 + 一段外缘弧。外缘弧的圆心是**投手板**（不是本垒），
 * 半径 28.96 m —— 这是真实球场的画法，也是二垒必须落在土上的原因。
 * 弧与界线的交点在离本垒约 38.9 m 处，比一垒（27.43 m）还远一截。
 */
export function infieldDirtPath(): string {
  const c = MOUND;
  const r = INFIELD_ARC_RADIUS;

  // 弧与界线的交点：沿界线方向走 t 米，解 |P(t) − 圆心| = r
  // t² − 2·(c·d)·t + |c|² − r² = 0，其中 d 是界线方向的单位向量
  const d = Math.SQRT1_2;
  const b = 2 * (c.x * d + c.y * d);
  const cc = c.x * c.x + c.y * c.y - r * r;
  const t = (b + Math.sqrt(b * b - 4 * cc)) / 2;

  const right: Pt = { x: d * t, y: d * t };
  const left: Pt = { x: -d * t, y: d * t };
  const angleOf = (p: Pt) => Math.atan2(p.x - c.x, p.y - c.y);
  const a0 = angleOf(right);
  const a1 = angleOf(left);

  const pts: Pt[] = [];
  // 本垒后方留一小块土（捕手站的地方）
  pts.push({ x: 4.2, y: -4.2 }, BASES.home, right);
  for (let i = 1; i < 40; i++) {
    const a = a0 + ((a1 - a0) * i) / 40;
    pts.push({ x: c.x + r * Math.sin(a), y: c.y + r * Math.cos(a) });
  }
  pts.push(left, BASES.home, { x: -4.2, y: -4.2 });
  return svgPathFromPoints(pts, true);
}

/** 内野菱形的跑垒路线 */
export function diamondPath(): string {
  return svgPathFromPoints([BASES.home, BASES.first, BASES.second, BASES.third], true);
}

/** 一条界线（从本垒到界外杆） */
export function foulLinePath(side: 'right' | 'left'): string {
  return svgPathFromPoints(
    [BASES.home, side === 'right' ? FOUL_POLE_RIGHT : FOUL_POLE_LEFT],
    false,
  );
}

/**
 * 跑垒道：一垒线**后半段**，界外一侧宽约 0.9 m 的画线区域。
 * 打者跑向一垒时必须在里面，挡到传球会被判出局（第 5 层）。
 */
export function runningLanePath(): string {
  const dir = { x: Math.SQRT1_2, y: Math.SQRT1_2 }; // 沿一垒线的单位向量
  const out = { x: Math.SQRT1_2, y: -Math.SQRT1_2 }; // 垂直向界外
  const start = { x: dir.x * (BASE_DISTANCE / 2), y: dir.y * (BASE_DISTANCE / 2) };
  const end = { x: dir.x * BASE_DISTANCE, y: dir.y * BASE_DISTANCE };
  const o = (p: Pt): Pt => ({ x: p.x + out.x * LANE_WIDTH, y: p.y + out.y * LANE_WIDTH });
  return svgPathFromPoints([start, end, o(end), o(start)], true);
}

/** 打者区（左右各一个，1.22 m × 1.83 m） */
export function batterBoxPath(side: 'left' | 'right'): string {
  const w = 1.22;
  const h = 1.83;
  const gapFromPlate = 0.15;
  const x0 = side === 'left' ? -(0.216 + gapFromPlate + w) : 0.216 + gapFromPlate;
  const y0 = -h / 2 + 0.2;
  return svgPathFromPoints(
    [
      { x: x0, y: y0 },
      { x: x0 + w, y: y0 },
      { x: x0 + w, y: y0 + h },
      { x: x0, y: y0 + h },
    ],
    true,
  );
}

/** 本垒板：宽 43.2 cm 的五边形，尖角朝向捕手 */
export function homePlatePath(scale = 1): string {
  const w = 0.432 * scale;
  const h = w;
  const half = w / 2;
  return svgPathFromPoints(
    [
      { x: -half, y: h * 0.45 },
      { x: half, y: h * 0.45 },
      { x: half, y: -h * 0.1 },
      { x: 0, y: -h * 0.55 },
      { x: -half, y: -h * 0.1 },
    ],
    true,
  );
}

/** 垒包：38 cm 见方的白色方块，画成菱形朝向 */
export function basePath(center: Pt, size = 1.9): string {
  const h = size / 2;
  return svgPathFromPoints(
    [
      { x: center.x, y: center.y + h },
      { x: center.x + h, y: center.y },
      { x: center.x, y: center.y - h },
      { x: center.x - h, y: center.y },
    ],
    true,
  );
}

/** 守备位置（世界坐标）。编号即记录用的 1–9。 */
export const FIELDER_SPOTS: Record<number, Pt> = {
  1: MOUND,
  2: CATCHER_SPOT,
  3: { x: 17.5, y: 22 },
  4: { x: 11, y: 41 },
  5: { x: -17.5, y: 22 },
  6: { x: -11, y: 41 },
  7: { x: -48, y: 78 },
  8: { x: 0, y: 97 },
  9: { x: 48, y: 78 },
};

/** 跑者站位（略微偏离垒包，避免和垒包图形重叠） */
export const RUNNER_SPOTS: Record<1 | 2 | 3, Pt> = {
  1: { x: BASES.first.x - 1.8, y: BASES.first.y - 1.8 },
  2: { x: BASES.second.x - 2.4, y: BASES.second.y - 1.2 },
  3: { x: BASES.third.x + 1.8, y: BASES.third.y - 1.8 },
};

/** 离垒位置：从垒包朝下一个垒方向走几步 */
export function leadSpot(from: 1 | 2 | 3, meters = 3.5): Pt {
  const order = [BASES.first, BASES.second, BASES.third, BASES.home];
  const start = order[from - 1];
  const next = order[from];
  const dx = next.x - start.x;
  const dy = next.y - start.y;
  const len = Math.hypot(dx, dy);
  return { x: start.x + (dx / len) * meters, y: start.y + (dy / len) * meters };
}

/** 从某个垒指向下一个垒的箭头（给强迫链用） */
export function advanceArrow(from: 1 | 2 | 3 | 'batter'): { a: Pt; b: Pt } {
  const order: Pt[] = [BASES.home, BASES.first, BASES.second, BASES.third, BASES.home];
  const idx = from === 'batter' ? 0 : from;
  const a = order[idx];
  const b = order[idx + 1];
  // 两端各缩进 2.6 m，让箭头不压住垒包
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const t = 2.6 / len;
  return {
    a: { x: a.x + dx * t, y: a.y + dy * t },
    b: { x: b.x - dx * t, y: b.y - dy * t },
  };
}

/**
 * 斜向平行的割草带，用界内区域裁切。明暗表现草叶倒伏的方向。
 * 不改变球场边界和任何教学几何。
 */
export function mownBandPaths(count = 24, reach = 180): string[] {
  const out: string[] = [];
  const step = (2 * reach) / count;
  for (let i = 0; i < count; i++) {
    const x = -reach + i * step;
    out.push(`M${x} 12 L${x + step} 12 L${x + step + 82} -150 L${x + 82} -150 Z`);
  }
  return out;
}

/**
 * 场地的地坪：界外区域与看台脚下的那一圈。
 *
 * 没有它，草皮的边缘就直接切在纯黑上，光池落在界外只会读成一团雾 ——
 * 光需要一个落点。角度比界线再开一些，半径比围墙再远一些。
 */
export function stadiumFloorPath(spread = 1.22, reach = 1.2, steps = 40): string {
  const pts: Pt[] = [{ x: 0, y: -10 }];
  const half = QUARTER * spread;
  for (let i = 0; i <= steps; i++) {
    const t = -half + (2 * half * i) / steps;
    pts.push(polar(t, fenceDistance(t) * reach));
  }
  return svgPathFromPoints(pts, true);
}

/** 以本垒为顶点的扇形 */
/**
 * 棒球的缝线：那条横 8 字，两段对称的三次贝塞尔就够了。
 * 半径 r 的球，坐标以球心为原点。同一个形状用在球场上的球、导航的品牌标记和得分装饰上。
 */
export function seamPaths(r = 1): [string, string] {
  const f = (n: number) => (n * r).toFixed(3);
  return [
    `M${f(-0.74)} ${f(-0.56)} C${f(-0.33)} ${f(-0.1)} ${f(0.33)} ${f(-0.1)} ${f(0.74)} ${f(-0.56)}`,
    `M${f(-0.74)} ${f(0.56)} C${f(-0.33)} ${f(0.1)} ${f(0.33)} ${f(0.1)} ${f(0.74)} ${f(0.56)}`,
  ];
}

/**
 * 每一章看到的取景。球场不是「一次画完」，而是随规则一层层长出来，
 * 镜头也跟着拉远——这是全站的主视觉动作。
 */
export const VIEWBOX = {
  /** 第 0 层：只有投手 → 捕手一条线，中间站一个打者 */
  0: '-19 -21.5 38 25',
  /** 第 1 层：凑近本垒，好球带是主角（下沿要留得下捕手） */
  1: '-3.6 -3.8 7.2 7.2',
  /** 第 2 层：界线展开，一垒出现 */
  2: '-46 -58 92 70',
  /** 第 3 层：菱形闭合 */
  3: '-54 -70 108 84',
  /** 第 4 层：内野的暗战 */
  4: '-46 -58 92 70',
  /** 第 5 层：本垒到一垒的跑垒道 */
  5: '-26 -36 52 44',
  /** 全景 */
  full: '-96 -132 192 150',
  /** 首页 hero 的开场取景（横屏）。本垒落在画面下方三分之一处，
      底下留给标题和走马灯。 */
  hero: '-32 -25 64 36',
  /** 同上，竖屏。一套取景没法同时服务 16:9 和 9:19，所以分开写，
      由 useMediaQuery 在 HeroPrototype 里选。 */
  heroNarrow: '-9 -23.5 18 28',
  /** 工具页用的内野特写 */
  infield: '-50 -64 100 78',
} as const;

export type ViewKey = keyof typeof VIEWBOX;
