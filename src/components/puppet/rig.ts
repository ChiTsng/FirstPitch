/**
 * 人偶的骨骼：正向运动学（FK）。
 *
 * 一个姿势只是一组角度；骨长是常数，所以不管怎么插值，手臂和腿都不会被拉长或压短 ——
 * 这是直接插值关节坐标做不到的。
 *
 * 单位是米，按 1.88 m 的身高建立。坐标系和场地剪影一致：脚底在原点，y 向下，人面朝 +x。
 * 面朝左的人在渲染时整体镜像，姿势本身永远按「面朝右」来写。
 *
 * 角度约定（度）：
 *   四肢、球棒  0 = 竖直向下，正 = 往前（+x）转。90 = 水平向前，180 = 竖直向上，-90 = 水平向后
 *   躯干、头    0 = 竖直向上，正 = 往前倾
 */

import type { Pt } from '../field/limb';

export type { Pt };

export interface Pose {
  /** 骨盆的水平位置（米）。竖直位置不在这里 —— 由 plant() 让最低的那只脚着地 */
  px: number;
  /** 离地：跑步腾空的那一瞬，一般为 0 */
  lift: number;
  torso: number;
  head: number;
  /** 投球手（近侧）：上臂、前臂 */
  armT: [number, number];
  /** 手套手（远侧） */
  armG: [number, number];
  /** 近侧的腿：大腿、小腿 */
  legF: [number, number];
  /** 远侧的腿 */
  legB: [number, number];
  /** 球棒角度。只有打者用，从握把量起 */
  bat: number;
}

export const BONE = {
  torso: 0.55,
  neck: 0.2,
  upper: 0.29,
  fore: 0.27,
  thigh: 0.47,
  shin: 0.48,
  bat: 0.86,
  /** 球棒的甜区：离握把 0.62 m */
  sweet: 0.62,
} as const;

export interface Skeleton {
  pelvis: Pt;
  shoulder: Pt;
  head: Pt;
  elbowT: Pt;
  handT: Pt;
  elbowG: Pt;
  handG: Pt;
  kneeF: Pt;
  footF: Pt;
  kneeB: Pt;
  footB: Pt;
  batTip: Pt;
  sweet: Pt;
  /** 头部的倾角，给头盔、面罩跟着转 */
  headAngle: number;
}

const rad = (d: number) => (d * Math.PI) / 180;
const down = (d: number, len: number): Pt => ({ x: Math.sin(rad(d)) * len, y: Math.cos(rad(d)) * len });
const up = (d: number, len: number): Pt => ({ x: Math.sin(rad(d)) * len, y: -Math.cos(rad(d)) * len });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });

/**
 * 两节骨头的 IK：从 origin 出发，让末端落在 target。够不着就伸直指向目标。
 *
 * 弯向哪一边由调用的人明确指定（sign = ±1），不按几何自动挑：
 * 任何自动规则（「手肘取低的那个」之类）都会在某个位置打平，
 * 打平的那一刻两个解互为镜像，手肘会突然跳到另一边。
 * 所以 IK 只在写关键姿势时用，算出角度；动画插值一律在角度空间里做。
 */
export function ik(origin: Pt, target: Pt, a: number, b: number, sign: 1 | -1): [number, number] {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const d = Math.min(Math.hypot(dx, dy), a + b - 1e-6);
  const toward = (Math.atan2(dx, dy) * 180) / Math.PI;
  const cos = (a * a + d * d - b * b) / (2 * a * d);
  const alpha = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  const upper = toward + sign * alpha;
  const elbow = add(origin, down(upper, a));
  const lower = (Math.atan2(target.x - elbow.x, target.y - elbow.y) * 180) / Math.PI;
  return [upper, lower];
}

/** 写关键姿势用：让一只手伸到 target（捡球、摘面罩），返回解好这条手臂的新姿势 */
export function reach(p: Pose, arm: 'armT' | 'armG', target: Pt, sign: 1 | -1): Pose {
  return { ...p, [arm]: ik(fk(p).shoulder, target, BONE.upper, BONE.fore, sign) };
}

/**
 * 写关键姿势用：让两只手都握到 grip（打者握棒），返回解好手臂角度的新姿势。
 * 后手（手套侧）握在前手往握把那头 9 cm 处，两只手不叠在一起。
 */
export function gripAt(p: Pose, grip: Pt, sign: 1 | -1): Pose {
  const shoulder = fk(p).shoulder;
  const knob = add(grip, down(p.bat + 180, 0.09));
  return {
    ...p,
    armT: ik(shoulder, grip, BONE.upper, BONE.fore, sign),
    armG: ik(shoulder, knob, BONE.upper, BONE.fore, sign),
  };
}

function bones(p: Pose, py: number): Skeleton {
  const pelvis = { x: p.px, y: py };
  const shoulder = add(pelvis, up(p.torso, BONE.torso));
  const head = add(shoulder, up(p.head, BONE.neck));
  const { armT, armG } = p;
  const elbowT = add(shoulder, down(armT[0], BONE.upper));
  const handT = add(elbowT, down(armT[1], BONE.fore));
  const elbowG = add(shoulder, down(armG[0], BONE.upper));
  const handG = add(elbowG, down(armG[1], BONE.fore));
  const kneeF = add(pelvis, down(p.legF[0], BONE.thigh));
  const footF = add(kneeF, down(p.legF[1], BONE.shin));
  const kneeB = add(pelvis, down(p.legB[0], BONE.thigh));
  const footB = add(kneeB, down(p.legB[1], BONE.shin));
  return {
    pelvis,
    shoulder,
    head,
    elbowT,
    handT,
    elbowG,
    handG,
    kneeF,
    footF,
    kneeB,
    footB,
    batTip: add(handT, down(p.bat, BONE.bat)),
    sweet: add(handT, down(p.bat, BONE.sweet)),
    headAngle: p.head,
  };
}

/**
 * 把姿势落到地上：让最低的那只脚正好踩在 y = 0，再按 lift 抬起来。
 * 每一帧都重新算，所以插值过程中脚也不会飘在空中或者陷进地里。
 */
export function fk(p: Pose): Skeleton {
  const s = bones(p, 0);
  const lowest = Math.max(s.footF.y, s.footB.y);
  return bones(p, -lowest - p.lift);
}

// ── 姿势插值：单调三次样条 ────────────────────────
//
// 关键姿势之间不用逐段缓入缓出（那样每个关键姿势上速度都归零，动作一顿一顿的），
// 也不用 Catmull-Rom（会过冲，手臂会甩过头再弹回来）。
// 单调三次 Hermite（Fritsch–Carlson）经过每个关键姿势、速度连续、不过冲；
// 首尾切线为零，循环的接缝处静止衔接。

type Vec = number[];

const toVec = (p: Pose): Vec => [
  p.px,
  p.lift,
  p.torso,
  p.head,
  ...p.armT,
  ...p.armG,
  ...p.legF,
  ...p.legB,
  p.bat,
];

const fromVec = (v: Vec): Pose => ({
  px: v[0],
  lift: v[1],
  torso: v[2],
  head: v[3],
  armT: [v[4], v[5]],
  armG: [v[6], v[7]],
  legF: [v[8], v[9]],
  legB: [v[10], v[11]],
  bat: v[12],
});

function slopes(ts: number[], vs: number[]): number[] {
  const n = ts.length;
  const d = ts.slice(0, -1).map((t, i) => (vs[i + 1] - vs[i]) / (ts[i + 1] - t));
  const m = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return m;
}

export interface Key {
  t: number;
  pose: Pose;
}

/** 一串关键姿势 → 任意时刻的姿势 */
export function track(keys: Key[]): (t: number) => Pose {
  const sorted = [...keys].sort((a, b) => a.t - b.t);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].t <= sorted[i - 1].t) throw new Error(`关键姿势的时间必须严格递增：${sorted[i].t}`);
  }
  const ts = sorted.map((k) => k.t);
  const vecs = sorted.map((k) => toVec(k.pose));
  const channels = vecs[0].map((_, c) => vecs.map((v) => v[c]));
  const ms = channels.map((vs) => slopes(ts, vs));
  return (t: number) => {
    if (t <= ts[0]) return fromVec(vecs[0]);
    if (t >= ts[ts.length - 1]) return fromVec(vecs[vecs.length - 1]);
    let i = 0;
    while (t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i];
    const s = (t - ts[i]) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    const out = channels.map(
      (vs, c) =>
        (2 * s3 - 3 * s2 + 1) * vs[i] +
        (s3 - 2 * s2 + s) * h * ms[c][i] +
        (-2 * s3 + 3 * s2) * vs[i + 1] +
        (s3 - s2) * h * ms[c][i + 1],
    );
    return fromVec(out);
  };
}

/** 一串 (t, x) 关键值的单调三次插值，给人的整体位移用 */
export function scalarTrack(keys: { t: number; v: number }[]): (t: number) => number {
  const ts = keys.map((k) => k.t);
  const vs = keys.map((k) => k.v);
  const m = slopes(ts, vs);
  return (t: number) => {
    if (t <= ts[0]) return vs[0];
    if (t >= ts[ts.length - 1]) return vs[vs.length - 1];
    let i = 0;
    while (t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i];
    const s = (t - ts[i]) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * vs[i] +
      (s3 - 2 * s2 + s) * h * m[i] +
      (-2 * s3 + 3 * s2) * vs[i + 1] +
      (s3 - s2) * h * m[i + 1]
    );
  };
}
