/**
 * 第 00 章观察室的动作编排：一个人 → 两个人 → 三个人。
 *
 * 纯数据：给定第几步、第几毫秒，算出球在哪、每个人摆什么姿势，不碰 DOM，所以能单测。
 * OriginScene 每一帧调用 plan.at(t) 再画出来。
 *
 * 几条原则：
 *  1. 人是真的在动：投球有抬腿、跨步引臂、出手、随挥；接球要伸手套；打者有跨步和挥棒；
 *     捡球要跑过去、蹲下、站起、转身、跑回来。姿势用 puppet/rig.ts 的骨骼算，骨长不变。
 *  2. 球在出手前一直跟着手走，接住时正好落进手套，击中时正好在球棒的甜区。
 *     做法是反过来：飞行路线的起点和终点，直接取那一刻的手、手套、甜区的位置。
 *  3. 球只在被人碰到的那一刻（出手、接住、击中、捡起）放慢，其余时间快速飞行。
 *     球路按弧长密集取样、关键帧之间匀速，中途不会无故减速 ——
 *     更早的版本每段各自缓入缓出，球在半空中顿三下，就是那种「卡顿」。
 *  4. 每一步首尾都是同一个静止画面，可以无缝循环；末尾留一小段停顿再重来。
 *
 * 坐标是 OriginScene 那张 SVG 的坐标（viewBox 0 0 560 335），时间单位是毫秒。
 */

import { fk, gripAt, reach, scalarTrack, track, type Key, type Pose, type Pt, type Skeleton } from './puppet/rig';
import type { Look } from './puppet/Puppet';

export type { Pt };

// ── 场景布置 ──────────────────────────────────────

export const SCALE = 65;
const GROUND = 260;
const BATTER_GROUND = 250;
const CATCHER_SCALE = 67;
const THROWER_X = 130;
const PARTNER_X = 435;
const BATTER_X = 338;
/** 每一轮播完之后的停顿，然后从头再来 */
export const REST_GAP = 650;

export type FigureId = 'thrower' | 'partner' | 'batter' | 'catcher';

export interface Fig {
  id: FigureId;
  pose: Pose;
  /** 脚底在场景里的位置 */
  x: number;
  y: number;
  /** 1 朝右、-1 朝左；转身时连续变化 */
  facing: number;
  scale: number;
}

export interface Frame {
  ball: { x: number; y: number; o: number };
  figs: Fig[];
  pops: { id: 'a' | 'b'; x: number; y: number; o: number; s: number; flat: number }[];
}

export interface Plan {
  duration: number;
  figures: { id: FigureId; look: Look }[];
  /** 画成虚线的飞行路线（和球真正走的路线是同一条） */
  paths: string[];
  /** 第三步那条击球路线，画成实线带箭头 */
  hit?: string;
  /** 球被碰到的那些时刻（出手、接住、击中、捡起……），单测和录屏用 */
  moments: Record<string, number>;
  at(t: number): Frame;
}

/** 人身上的一个点（rig 的局部坐标，米）换算到场景坐标 */
export function worldPoint(f: Fig, local: Pt): Pt {
  return { x: f.x + f.facing * local.x * f.scale, y: f.y + local.y * f.scale };
}

// ── 速度：只在触球点放慢 ─────────────────────────

/** 空中 1.1 px/ms，触球点附近降到 0.12 px/ms（约九分之一，一眼看得出是慢放） */
export const SPEED = { fast: 1.1, slow: 0.12, core: 10, ramp: 60 };

export interface Moment {
  at: number;
}

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpPt = (a: Pt, b: Pt, k: number): Pt => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });

export function speedAt(s: number, moments: Moment[]): number {
  const { fast, slow, core, ramp } = SPEED;
  let k = 0;
  for (const m of moments) {
    const d = Math.abs(s - m.at);
    const w = d <= core ? 1 : d >= core + ramp ? 0 : 1 - smooth((d - core) / ramp);
    k = Math.max(k, w);
  }
  return fast + (slow - fast) * k;
}

export function quad(p0: Pt, p1: Pt, p2: Pt, n: number): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    };
  });
}

export function arcLengths(pts: Pt[]): number[] {
  const s = [0];
  for (let i = 1; i < pts.length; i++) {
    s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return s;
}

export function rampTimes(s: number[], moments: Moment[]): number[] {
  const t = [0];
  for (let i = 1; i < s.length; i++) {
    t.push(t[i - 1] + (s[i] - s[i - 1]) / speedAt((s[i - 1] + s[i]) / 2, moments));
  }
  return t;
}

/** 一段飞行：二次贝塞尔、按弧长计时。返回所需时间、「第几毫秒在哪」和画虚线用的路径 */
function flight(a: Pt, c: Pt, b: Pt, slowAtStart: boolean, slowAtEnd: boolean) {
  const pts = quad(a, c, b, 48);
  const s = arcLengths(pts);
  const total = s[s.length - 1];
  const moments = [...(slowAtStart ? [{ at: 0 }] : []), ...(slowAtEnd ? [{ at: total }] : [])];
  const t = rampTimes(s, moments);
  const duration = t[t.length - 1];
  const at = (ms: number): Pt => {
    if (ms <= 0) return a;
    if (ms >= duration) return b;
    let i = 0;
    while (t[i + 1] < ms) i++;
    return lerpPt(pts[i], pts[i + 1], (ms - t[i]) / (t[i + 1] - t[i]));
  };
  const f = (n: number) => n.toFixed(1);
  return { duration, at, d: `M${f(a.x)} ${f(a.y)}Q${f(c.x)} ${f(c.y)} ${f(b.x)} ${f(b.y)}` };
}

// ── 姿势库：全部按「面朝右」写 ────────────────────

const BASE: Pose = {
  px: 0,
  lift: 0,
  torso: 3,
  head: 0,
  armT: [10, 6],
  armG: [-6, -4],
  legF: [4, 0],
  legB: [-4, 0],
  bat: 200,
};
const pose = (o: Partial<Pose>): Pose => ({ ...BASE, ...o });
const mix = (a: Pose, b: Pose, k: number): Pose => ({
  px: lerp(a.px, b.px, k),
  lift: lerp(a.lift, b.lift, k),
  torso: lerp(a.torso, b.torso, k),
  head: lerp(a.head, b.head, k),
  armT: [lerp(a.armT[0], b.armT[0], k), lerp(a.armT[1], b.armT[1], k)],
  armG: [lerp(a.armG[0], b.armG[0], k), lerp(a.armG[1], b.armG[1], k)],
  legF: [lerp(a.legF[0], b.legF[0], k), lerp(a.legF[1], b.legF[1], k)],
  legB: [lerp(a.legB[0], b.legB[0], k), lerp(a.legB[1], b.legB[1], k)],
  bat: lerp(a.bat, b.bat, k),
});

/** 投球：站定 → 抬腿 → 跨步引臂 → 出手 → 随挥 */
export const SET = pose({ torso: 4, armT: [22, 150], armG: [28, 142], legF: [7, 0], legB: [-7, 0] });
const LIFT = pose({ torso: -5, head: -2, armT: [16, 152], armG: [22, 146], legF: [86, -6], legB: [-1, 0] });
const COCK = pose({ px: 0.1, torso: -3, armT: [-112, 172], armG: [96, 92], legF: [44, 14], legB: [-26, -10] });
const RELEASE = pose({ px: 0.22, torso: 28, head: 10, armT: [160, 115], armG: [55, 138], legF: [32, 2], legB: [-38, -46] });
const FOLLOW = pose({ px: 0.3, torso: 44, head: 22, armT: [48, 18], armG: [30, 105], legF: [28, 0], legB: [-14, -96] });
/** 投完之后站起来看球 */
const WATCH = pose({ px: 0.2, torso: 6, head: -8, armT: [16, 34], armG: [10, 26], legF: [16, 0], legB: [-12, 0] });
/** 准备接球：微蹲、手套举在胸前 */
const READY = pose({ px: 0.12, torso: 12, head: 4, armT: [40, 112], armG: [58, 128], legF: [16, -10], legB: [-14, -6] });
/** 伸出手套接球 */
const REACH = pose({ px: 0.14, torso: 14, head: 6, armT: [66, 112], armG: [88, 96], legF: [18, -10], legB: [-14, -6] });
/** 接住后把球收到胸前，交到投球手 */
const ABSORB = pose({ px: 0.06, torso: 8, armT: [28, 152], armG: [34, 150], legF: [10, -6], legB: [-10, -4] });

/** 两个人传接时的回传：动作比投球小，不抬腿 */
const TOSS_COCK = pose({ px: 0.06, torso: -2, armT: [-104, 170], armG: [92, 94], legF: [36, 10], legB: [-22, -8] });
const TOSS_RELEASE = pose({ px: 0.16, torso: 22, head: 8, armT: [156, 112], armG: [50, 134], legF: [28, 2], legB: [-30, -36] });
const TOSS_FOLLOW = pose({ px: 0.2, torso: 34, head: 14, armT: [46, 22], armG: [30, 100], legF: [26, 0], legB: [-12, -78] });

/** 跑步：一个步态周期的四个关键姿势（着地 → 腾空交叉 → 换腿着地 → 腾空交叉） */
const RUN_A = pose({ torso: 14, head: 8, legF: [32, 8], legB: [-30, -78], armT: [-36, 16], armG: [42, 128] });
const RUN_B = pose({ torso: 14, head: 8, lift: 0.025, legF: [2, -10], legB: [44, -44], armT: [6, 72], armG: [10, 82] });
const RUN_C = pose({ torso: 14, head: 8, legF: [-30, -78], legB: [32, 8], armT: [42, 128], armG: [-36, 16] });
const RUN_D = pose({ torso: 14, head: 8, lift: 0.025, legF: [44, -44], legB: [2, -10], armT: [10, 82], armG: [6, 72] });
const CYCLE = [RUN_A, RUN_B, RUN_C, RUN_D];
/** 抱着球跑：投球手把球护在胸前，不跟着摆 */
const carrying = (p: Pose): Pose => ({ ...p, armT: [20, 150] });

/** 捡球：减速 → 单膝跪地、伸手按住地上的球 → 站起，把球拿在胸前 */
const SLOW = pose({ torso: 20, head: 10, legF: [26, -12], legB: [-18, -26], armT: [24, 70], armG: [30, 84] });
const KNEEL = pose({ torso: 72, head: 50, legF: [100, -30], legB: [40, -95], armG: [44, 104] });
/** 投球手伸到身体前方的地面上（球心离地约 1 cm） */
const CROUCH = reach(KNEEL, 'armT', { x: fk(KNEEL).shoulder.x + 0.2, y: 0.015 }, -1);
const HOLD = pose({ torso: 6, head: 0, armT: [6, 174], armG: [12, 164], legF: [8, 0], legB: [-8, 0] });

/** 打者：站姿 → 后撤蓄力 → 跨步 → 挥棒 → 击中 → 收棒 */
const batter = (o: Partial<Pose>, grip: Pt) => gripAt(pose(o), grip, -1);
const B_STANCE = batter({ torso: 10, head: 4, legF: [16, 0], legB: [-18, 0], bat: 200 }, { x: -0.12, y: -1.4 });
const B_LOAD = batter({ px: -0.05, torso: 6, head: 4, legF: [12, -6], legB: [-20, -4], bat: 208 }, { x: -0.18, y: -1.38 });
const B_STRIDE = batter({ px: 0, torso: 8, head: 4, legF: [34, -4], legB: [-20, -4], bat: 206 }, { x: -0.16, y: -1.4 });
const B_SWING = batter({ px: 0.08, torso: 16, head: 8, legF: [26, 0], legB: [-26, -18], bat: 150 }, { x: 0.06, y: -1.24 });
const B_CONTACT = batter({ px: 0.1, torso: 18, head: 10, legF: [24, 0], legB: [-28, -30], bat: 90 }, { x: 0.3, y: -1.14 });
const B_EXTEND = batter({ px: 0.12, torso: 14, head: 6, legF: [22, 0], legB: [-24, -42], bat: 132 }, { x: 0.34, y: -1.28 });
const B_FINISH = batter({ px: 0.1, torso: 6, head: -4, legF: [20, 0], legB: [-16, -62], bat: 215 }, { x: 0.08, y: -1.56 });

/** 捕手：蹲着把手套举在好球带前；球被打出去之后站起来，抬手去摘面罩，目送那颗球 */
const C_CROUCH = pose({ torso: 12, head: 8, legF: [84, -34], legB: [74, -28], armG: [82, 96], armT: [-20, 40] });
const C_RISE = pose({ torso: 6, head: -10, legF: [40, -14], legB: [32, -10], armG: [52, 80], armT: [-6, 30] });
const C_STAND = pose({ torso: 0, head: -20, legF: [10, -4], legB: [-8, -2], armG: [26, 52] });
const C_WATCH = reach(C_STAND, 'armT', { x: fk(C_STAND).head.x + 0.1, y: fk(C_STAND).head.y + 0.02 }, -1);

// ── 换算：人身上的点 → 场景坐标 ───────────────────

interface Body {
  x: (t: number) => number;
  y: number;
  facing: (t: number) => number;
  scale: number;
  pose: (t: number) => Pose;
}

const toScene = (b: Body, t: number, local: Pt): Pt => ({
  x: b.x(t) + b.facing(t) * local.x * b.scale,
  y: b.y + local.y * b.scale,
});
const skeleton = (b: Body, t: number): Skeleton => fk(b.pose(t));
const handT = (b: Body, t: number) => toScene(b, t, skeleton(b, t).handT);
const handG = (b: Body, t: number) => toScene(b, t, skeleton(b, t).handG);

const fixed = (v: number) => () => v;
const always = (f: 1 | -1) => () => f;

/** 转身用多久：人从正面被压扁到侧面再翻过来，手里的球跟着连续滑到另一侧，不会跳 */
const TURN_MS = 140;

/** 朝向：从给定时刻开始转身，TURN_MS 内从一个方向平滑地变到另一个方向 */
function facingTrack(turns: { t: number; facing: 1 | -1 }[], initial: 1 | -1) {
  return (t: number): number => {
    let f: number = initial;
    for (const k of turns) {
      if (t < k.t) break;
      const from = f;
      f = lerp(from, k.facing, smooth(clamp01((t - k.t) / TURN_MS)));
    }
    return f;
  };
}

const fig = (id: FigureId, b: Body, t: number): Fig => ({
  id,
  pose: b.pose(t),
  x: b.x(t),
  y: b.y,
  facing: b.facing(t),
  scale: b.scale,
});

/** 一次闪光（接住、击中、落地）：出现、扩散、消失 */
function pop(id: 'a' | 'b', at: Pt, when: number, t: number, length = 320, flat = 1) {
  const k = (t - when) / length;
  const o = k < 0 || k > 1 ? 0 : k < 0.12 ? (k / 0.12) * 0.9 : 0.9 * (1 - (k - 0.12) / 0.88);
  return { id, x: at.x, y: at.y, o, s: 0.4 + 1.3 * clamp01(k), flat };
}

/** 一段投球动作的关键姿势，release 时刻正好是出手 */
function delivery(start: number, release: number, follow: Pose, lifted: boolean): Key[] {
  const cock = lifted ? COCK : TOSS_COCK;
  const rel = lifted ? RELEASE : TOSS_RELEASE;
  const keys: Key[] = [
    { t: 0, pose: SET },
    { t: start, pose: SET },
  ];
  if (lifted) keys.push({ t: release - 400, pose: LIFT });
  keys.push(
    { t: release - 180, pose: cock },
    // 出手前后各放一个很接近出手的姿势：手臂在出手那一下慢下来，和球的慢放对上
    { t: release - 80, pose: mix(cock, rel, 0.8) },
    { t: release, pose: rel },
    { t: release + 80, pose: mix(rel, follow, 0.22) },
    { t: release + 230, pose: follow },
  );
  return keys;
}

/** 跑步的关键姿势：从 start 到 end，每 90 ms 一个，四个一循环 */
function runKeys(start: number, end: number, carry: boolean): Key[] {
  const keys: Key[] = [];
  for (let t = start, i = 0; t < end - 45; t += 90, i++) {
    const p = CYCLE[i % 4];
    keys.push({ t, pose: carry ? carrying(p) : p });
  }
  return keys;
}

// ── 第一步：一个人，扔出去，再自己跑去捡回来 ─────

function solo(): Plan {
  const LAND = { x: 330, y: 261 };
  const BOUNCE = { x: 366, y: 261 };
  const REST = { x: 384, y: 261 };

  const tRelease = 1000;
  const keys: Key[] = delivery(300, tRelease, FOLLOW, true);
  const thrower0: Body = { x: fixed(THROWER_X), y: GROUND, facing: always(1), scale: SCALE, pose: track(keys) };
  const release = handT(thrower0, tRelease);

  // 扔出去：出手那一下慢，之后快速飞出
  const out = flight(release, { x: 250, y: 40 }, LAND, true, false);
  const tLand = tRelease + out.duration;
  const tRoll = tLand + 230;
  const tStop = tRoll + 320;

  // 蹲下时手伸到哪里，人就要停在哪里：手正好按在球上
  const crouchHand = fk(CROUCH).handT;
  const stopX = REST.x - crouchHand.x * SCALE;
  const tRun = tLand + 60;
  const tArrive = Math.max(tRun + (stopX - THROWER_X) / 0.42, tStop + 60);
  const tPick = tArrive + 170;
  const tUp = tPick + 460;
  const tTurn = tUp + 60;
  const tBack = tTurn + 90;
  const tHome = tBack + (stopX - THROWER_X) / 0.42;
  const tSettle = tHome + 140;
  const end = tSettle + 380;
  const duration = end + REST_GAP;

  keys.push(
    { t: tLand - 120, pose: WATCH },
    ...runKeys(tRun, tArrive - 90, false),
    { t: tArrive - 40, pose: SLOW },
    { t: tPick, pose: CROUCH },
    { t: tPick + 120, pose: mix(CROUCH, HOLD, 0.15) },
    { t: tUp, pose: HOLD },
    ...runKeys(tBack, tHome - 60, true),
    { t: tHome, pose: carrying(SLOW) },
    { t: tSettle, pose: HOLD },
    { t: end, pose: SET },
  );
  const body: Body = {
    x: scalarTrack([
      { t: tRun, v: THROWER_X },
      { t: tArrive, v: stopX },
      { t: tBack, v: stopX },
      { t: tHome, v: THROWER_X },
    ]),
    y: GROUND,
    facing: facingTrack([{ t: tTurn - TURN_MS / 2, facing: -1 }, { t: tSettle - 110, facing: 1 }], 1),
    scale: SCALE,
    pose: track(keys),
  };

  const bounce = quad(LAND, { x: 348, y: 222 }, BOUNCE, 10);
  const ballAt = (t: number): Pt => {
    if (t < tRelease) return handT(body, t);
    if (t < tLand) return out.at(t - tRelease);
    if (t < tRoll) {
      const k = ((t - tLand) / 230) * 10;
      const i = Math.min(9, Math.floor(k));
      return lerpPt(bounce[i], bounce[i + 1], k - i);
    }
    if (t < tStop) {
      const k = (t - tRoll) / 320;
      return { x: lerp(BOUNCE.x, REST.x, 1 - (1 - k) ** 2), y: REST.y };
    }
    if (t < tPick) return REST;
    // 手按到球上之后，球在 120 ms 内平滑地进到手里，不会跳一下
    return lerpPt(REST, handT(body, t), smooth(clamp01((t - tPick) / 120)));
  };

  return {
    duration,
    figures: [{ id: 'thrower', look: 'pitcher' }],
    paths: [`${out.d}Q348 222 366 261L384 261`],
    moments: { release: tRelease, land: tLand, stop: tStop, pick: tPick, turn: tTurn, home: tHome },
    at: (t) => ({
      ball: { ...ballAt(t), o: 1 },
      figs: [fig('thrower', body, t)],
      pops: [pop('a', { x: LAND.x, y: LAND.y + 3 }, tLand, t, 300, 0.32)],
    }),
  };
}

// ── 第二步：两个人，传过去，接住，再传回来 ───────

function pass(): Plan {
  const tRel1 = 940;
  const throwerKeys: Key[] = delivery(300, tRel1, FOLLOW, true);
  const thrower0: Body = { x: fixed(THROWER_X), y: GROUND, facing: always(1), scale: SCALE, pose: track(throwerKeys) };
  const partnerStill: Body = { x: fixed(PARTNER_X), y: GROUND, facing: always(-1), scale: SCALE, pose: () => REACH };

  const release1 = handT(thrower0, tRel1);
  const catch1 = handG(partnerStill, 0);
  const f1 = flight(release1, { x: (release1.x + catch1.x) / 2, y: Math.min(release1.y, catch1.y) - 70 }, catch1, true, true);
  const tCatch1 = tRel1 + f1.duration;

  // 接球的人：伸手套迎球 → 收到胸前 → 换到投球手 → 回传
  const tRel2 = tCatch1 + 700;
  const partnerKeys: Key[] = [
    { t: 0, pose: READY },
    { t: tCatch1 - 300, pose: READY },
    { t: tCatch1 - 110, pose: mix(READY, REACH, 0.8) },
    { t: tCatch1, pose: REACH },
    { t: tCatch1 + 240, pose: ABSORB },
    { t: tRel2 - 180, pose: TOSS_COCK },
    { t: tRel2 - 80, pose: mix(TOSS_COCK, TOSS_RELEASE, 0.8) },
    { t: tRel2, pose: TOSS_RELEASE },
    { t: tRel2 + 80, pose: mix(TOSS_RELEASE, TOSS_FOLLOW, 0.22) },
    { t: tRel2 + 230, pose: TOSS_FOLLOW },
  ];
  const partner: Body = { x: fixed(PARTNER_X), y: GROUND, facing: always(-1), scale: SCALE, pose: track(partnerKeys) };
  const release2 = handT(partner, tRel2);
  const throwerCatch: Body = { x: fixed(THROWER_X), y: GROUND, facing: always(1), scale: SCALE, pose: () => REACH };
  const catch2 = handG(throwerCatch, 0);
  // 回传压低一点，两条路线不叠在一起
  const f2 = flight(release2, { x: (release2.x + catch2.x) / 2, y: Math.max(release2.y, catch2.y) + 40 }, catch2, true, true);
  const tCatch2 = tRel2 + f2.duration;
  const end = tCatch2 + 640;
  const duration = end + REST_GAP;

  partnerKeys.push({ t: tRel2 + 560, pose: READY }, { t: end, pose: READY });
  throwerKeys.push(
    { t: tRel1 + 480, pose: READY },
    { t: tCatch2 - 110, pose: mix(READY, REACH, 0.8) },
    { t: tCatch2, pose: REACH },
    { t: tCatch2 + 240, pose: ABSORB },
    { t: end, pose: SET },
  );
  const thrower: Body = { ...thrower0, pose: track(throwerKeys) };
  const partnerBody: Body = { ...partner, pose: track(partnerKeys) };

  /** 接住后球先在手套里停一下，再换到投球手 */
  const inMitt = (b: Body, t: number, caught: number) =>
    lerpPt(handG(b, t), handT(b, t), smooth(clamp01((t - caught - 160) / 260)));

  const ballAt = (t: number): Pt => {
    if (t < tRel1) return handT(thrower, t);
    if (t < tCatch1) return f1.at(t - tRel1);
    if (t < tRel2) return inMitt(partnerBody, t, tCatch1);
    if (t < tCatch2) return f2.at(t - tRel2);
    return inMitt(thrower, t, tCatch2);
  };

  return {
    duration,
    figures: [
      { id: 'thrower', look: 'pitcher' },
      { id: 'partner', look: 'pitcher' },
    ],
    paths: [f1.d, f2.d],
    moments: { release1: tRel1, catch1: tCatch1, release2: tRel2, catch2: tCatch2 },
    at: (t) => ({
      ball: { ...ballAt(t), o: 1 },
      figs: [fig('thrower', thrower, t), fig('partner', partnerBody, t)],
      pops: [pop('a', catch1, tCatch1, t), pop('b', catch2, tCatch2, t, 260)],
    }),
  };
}

// ── 第三步：三个人，投向本垒，打者把球打走 ───────

function atBat(): Plan {
  const tRel = 980;
  const pitcherKeys: Key[] = delivery(300, tRel, FOLLOW, true);
  const pitcher0: Body = { x: fixed(THROWER_X), y: GROUND, facing: always(1), scale: SCALE, pose: track(pitcherKeys) };
  const release = handT(pitcher0, tRel);

  // 击球点就是打者挥到 B_CONTACT 时球棒甜区所在的位置
  const contactBody: Body = { x: fixed(BATTER_X), y: BATTER_GROUND, facing: always(-1), scale: SCALE, pose: () => B_CONTACT };
  const contact = toScene(contactBody, 0, fk(B_CONTACT).sweet);
  const f1 = flight(release, { x: (release.x + contact.x) / 2, y: Math.min(release.y, contact.y) - 18 }, contact, true, true);
  const tContact = tRel + f1.duration;
  const away = { x: 80, y: 45 };
  const f2 = flight(contact, { x: contact.x - 90, y: 62 }, away, true, false);
  const tGone = tContact + f2.duration;
  const tBack = tGone + 80;
  const end = Math.max(tBack + 520, tContact + 1300);
  const duration = end + REST_GAP;

  pitcherKeys.push({ t: tContact + 260, pose: WATCH }, { t: end - 260, pose: SET }, { t: end, pose: SET });
  const pitcher: Body = { ...pitcher0, pose: track(pitcherKeys) };

  const batterBody: Body = {
    ...contactBody,
    pose: track([
      { t: 0, pose: B_STANCE },
      { t: tRel - 420, pose: B_STANCE },
      { t: tRel - 120, pose: B_LOAD },
      { t: tContact - 300, pose: B_STRIDE },
      { t: tContact - 140, pose: B_SWING },
      { t: tContact, pose: B_CONTACT },
      { t: tContact + 160, pose: B_EXTEND },
      { t: tContact + 380, pose: B_FINISH },
      { t: tContact + 760, pose: B_FINISH },
      { t: end, pose: B_STANCE },
    ]),
  };
  const catcherBody: Body = {
    x: fixed(PARTNER_X),
    y: GROUND,
    facing: always(-1),
    scale: CATCHER_SCALE,
    pose: track([
      { t: 0, pose: C_CROUCH },
      { t: tContact + 60, pose: C_CROUCH },
      { t: tContact + 260, pose: C_RISE },
      { t: tContact + 520, pose: C_WATCH },
      { t: end - 420, pose: C_WATCH },
      { t: end - 180, pose: C_RISE },
      { t: end, pose: C_CROUCH },
    ]),
  };

  const ball = (t: number) => {
    if (t < tRel) return { ...handT(pitcher, t), o: 1 };
    if (t < tContact) return { ...f1.at(t - tRel), o: 1 };
    if (t < tGone) {
      // 飞出画面前淡出
      const k = (t - tContact) / (tGone - tContact);
      return { ...f2.at(t - tContact), o: k < 0.72 ? 1 : 1 - (k - 0.72) / 0.28 };
    }
    // 下一球已经在投手手里：淡入
    return { ...handT(pitcher, t), o: t < tBack ? 0 : smooth(clamp01((t - tBack) / 320)) };
  };

  return {
    duration,
    figures: [
      { id: 'thrower', look: 'pitcher' },
      { id: 'catcher', look: 'catcher' },
      { id: 'batter', look: 'batter' },
    ],
    paths: [f1.d],
    hit: f2.d,
    moments: { release: tRel, contact: tContact, gone: tGone, back: tBack },
    at: (t) => ({
      ball: ball(t),
      figs: [fig('thrower', pitcher, t), fig('catcher', catcherBody, t), fig('batter', batterBody, t)],
      pops: [pop('a', contact, tContact, t, 360)],
    }),
  };
}

export const PLANS: Plan[] = [solo(), pass(), atBat()];
