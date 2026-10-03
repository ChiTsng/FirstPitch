import { describe, expect, it } from 'vitest';
import { BONE, fk, ik, scalarTrack, track, type Pose, type Pt } from './rig';

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

const pose = (o: Partial<Pose>): Pose => ({
  px: 0,
  lift: 0,
  torso: 0,
  head: 0,
  armT: [0, 0],
  armG: [0, 0],
  legF: [0, 0],
  legB: [0, 0],
  bat: 180,
  ...o,
});

/** 一组随手挑的、各种极端角度的姿势 */
const SAMPLES: Pose[] = [
  pose({}),
  pose({ torso: 45, head: 30, armT: [-110, 170], armG: [95, 90], legF: [85, -10], legB: [-30, -80] }),
  pose({ px: 0.3, torso: -20, armT: [160, 115], armG: [40, 150], legF: [10, 60], legB: [70, -50], lift: 0.05 }),
];

describe('正向运动学', () => {
  it.each(SAMPLES)('不管什么姿势，骨头都不会被拉长或压短', (p) => {
    const s = fk(p);
    expect(dist(s.pelvis, s.shoulder)).toBeCloseTo(BONE.torso, 9);
    expect(dist(s.shoulder, s.elbowT)).toBeCloseTo(BONE.upper, 9);
    expect(dist(s.elbowT, s.handT)).toBeCloseTo(BONE.fore, 9);
    expect(dist(s.shoulder, s.elbowG)).toBeCloseTo(BONE.upper, 9);
    expect(dist(s.pelvis, s.kneeF)).toBeCloseTo(BONE.thigh, 9);
    expect(dist(s.kneeF, s.footF)).toBeCloseTo(BONE.shin, 9);
    expect(dist(s.kneeB, s.footB)).toBeCloseTo(BONE.shin, 9);
    expect(dist(s.handT, s.batTip)).toBeCloseTo(BONE.bat, 9);
  });

  it.each(SAMPLES)('最低的那只脚正好踩在地上（腾空时按 lift 抬起）', (p) => {
    const s = fk(p);
    expect(Math.max(s.footF.y, s.footB.y)).toBeCloseTo(-p.lift, 9);
  });

  it('站直时身高约 1.83 m（头顶）', () => {
    const s = fk(pose({}));
    expect(s.head.y - 0.125).toBeCloseTo(-1.825, 2);
  });
});

describe('两节骨头的 IK', () => {
  it.each([1, -1] as const)('够得着的目标，手正好落在目标上（弯向 %i 一侧）', (sign) => {
    const shoulder = { x: 0, y: -1.5 };
    for (const target of [
      { x: 0.35, y: -1.3 },
      { x: -0.2, y: -1.6 },
      { x: 0.1, y: -1.05 },
    ]) {
      const [u, f] = ik(shoulder, target, BONE.upper, BONE.fore, sign);
      const r = (d: number) => (d * Math.PI) / 180;
      const elbow = { x: shoulder.x + Math.sin(r(u)) * BONE.upper, y: shoulder.y + Math.cos(r(u)) * BONE.upper };
      const hand = { x: elbow.x + Math.sin(r(f)) * BONE.fore, y: elbow.y + Math.cos(r(f)) * BONE.fore };
      expect(dist(hand, target)).toBeLessThan(1e-9);
    }
  });

  it('够不着就伸直指向目标，不会算出 NaN', () => {
    const [u, f] = ik({ x: 0, y: 0 }, { x: 5, y: 0 }, BONE.upper, BONE.fore, 1);
    // 够不着时距离按 a + b 减去一点点处理，角度离 90° 只差零点几度
    expect(u).toBeCloseTo(90, 0);
    expect(f).toBeCloseTo(90, 0);
  });
});

describe('姿势插值', () => {
  const a = pose({ torso: 0 });
  const b = pose({ torso: 40 });
  const c = pose({ torso: 10 });
  const at = track([
    { t: 0, pose: a },
    { t: 100, pose: b },
    { t: 250, pose: c },
  ]);

  it('正好经过每一个关键姿势', () => {
    expect(at(0).torso).toBe(0);
    expect(at(100).torso).toBeCloseTo(40, 9);
    expect(at(250).torso).toBe(10);
  });

  it('不过冲：在两个关键姿势之间，不会甩过头再弹回来', () => {
    for (let t = 0; t <= 250; t += 1) {
      const v = at(t).torso;
      expect(v).toBeGreaterThanOrEqual(-1e-9);
      expect(v).toBeLessThanOrEqual(40 + 1e-9);
    }
  });

  it('首尾速度为零：循环接缝处是静止衔接', () => {
    expect(at(1).torso - at(0).torso).toBeLessThan(0.05);
    expect(Math.abs(at(250).torso - at(249).torso)).toBeLessThan(0.05);
  });

  it('关键姿势的时间必须严格递增', () => {
    expect(() =>
      track([
        { t: 0, pose: a },
        { t: 0, pose: b },
      ]),
    ).toThrow();
  });

  it('位移插值同样经过关键值且不过冲', () => {
    const x = scalarTrack([
      { t: 0, v: 130 },
      { t: 500, v: 360 },
    ]);
    expect(x(0)).toBe(130);
    expect(x(500)).toBe(360);
    for (let t = 0; t <= 500; t += 5) expect(x(t)).toBeLessThanOrEqual(360);
  });
});
