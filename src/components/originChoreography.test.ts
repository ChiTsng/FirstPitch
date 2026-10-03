import { describe, expect, it } from 'vitest';
import {
  PLANS,
  SPEED,
  arcLengths,
  quad,
  rampTimes,
  speedAt,
  worldPoint,
  type Frame,
} from './originChoreography';
import { fk } from './puppet/rig';

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const figOf = (f: Frame, id: string) => f.figs.find((g) => g.id === id)!;

describe('速度：只在触球点放慢', () => {
  it('触球点上是慢放速度，远离触球点是空中速度', () => {
    const moments = [{ at: 100 }];
    expect(speedAt(100, moments)).toBeCloseTo(SPEED.slow);
    expect(speedAt(100 + SPEED.core + SPEED.ramp + 1, moments)).toBeCloseTo(SPEED.fast);
    expect(speedAt(100 - SPEED.core - SPEED.ramp - 1, moments)).toBeCloseTo(SPEED.fast);
  });

  it('离触球点越近越慢，中间没有忽快忽慢', () => {
    let last = 0;
    for (let s = 0; s <= 120; s += 2) {
      const v = speedAt(s, [{ at: 0 }]);
      expect(v).toBeGreaterThanOrEqual(last - 1e-9);
      last = v;
    }
  });

  it('同样一段距离，经过触球点比在空中花的时间长得多', () => {
    const s = arcLengths(quad({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }, 40));
    const touched = rampTimes(s, [{ at: 0 }]);
    const free = rampTimes(s, []);
    expect(touched[touched.length - 1]).toBeGreaterThan(free[free.length - 1] * 1.5);
  });
});

describe.each(PLANS.map((plan, step) => ({ plan, step })))('第 $step 步', ({ plan }) => {
  const frames = Array.from({ length: Math.ceil(plan.duration) + 1 }, (_, t) => plan.at(Math.min(t, plan.duration)));

  it('首尾是同一个画面：可以无缝循环', () => {
    const a = plan.at(0);
    const b = plan.at(plan.duration);
    expect(dist(a.ball, b.ball)).toBeLessThan(1e-6);
    expect(b.ball.o).toBe(a.ball.o);
    a.figs.forEach((f, i) => {
      expect(b.figs[i].x).toBeCloseTo(f.x, 6);
      expect(b.figs[i].facing).toBeCloseTo(f.facing, 9);
      expect(b.figs[i].pose).toEqual(f.pose);
    });
  });

  it('球不会瞬移：每毫秒最多走 3 px（看不见的时候除外）', () => {
    for (let t = 1; t < frames.length; t++) {
      const prev = frames[t - 1].ball;
      const cur = frames[t].ball;
      if (prev.o === 0 || cur.o === 0) continue;
      expect(dist(prev, cur), `t = ${t} ms`).toBeLessThan(3);
    }
  });

  it('人也不会瞬移：身上每个关节每毫秒最多走 3 px', () => {
    for (let t = 1; t < frames.length; t++) {
      frames[t].figs.forEach((f, i) => {
        const p = frames[t - 1].figs[i];
        // 转身也算在内：朝向是连续变化的，不允许有任何一帧瞬移
        const a = fk(p.pose);
        const b = fk(f.pose);
        for (const joint of ['head', 'handT', 'handG', 'footF', 'footB'] as const) {
          expect(dist(worldPoint(p, a[joint]), worldPoint(f, b[joint])), `${f.id}.${joint} @ ${t} ms`).toBeLessThan(3);
        }
      });
    }
  });

  it('人是真的在动：每个人身上活动最大的那个部位走过 40 px 以上', () => {
    const joints = ['head', 'handT', 'handG', 'footF', 'footB', 'batTip'] as const;
    for (const { id } of plan.figures) {
      const range = Math.max(
        ...joints
          // 球棒只有打者手里有，其他人的 batTip 只是骨骼上的一个虚拟点
          .filter((j) => j !== 'batTip' || id === 'batter')
          .map((j) => {
            const pts = frames.map((f) => worldPoint(figOf(f, id), fk(figOf(f, id).pose)[j]));
            const xs = pts.map((q) => q.x);
            const ys = pts.map((q) => q.y);
            return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
          }),
      );
      expect(range, id).toBeGreaterThan(40);
    }
  });
});

describe('球和手对得上', () => {
  it('一个人：出手前球一直在手里，捡起之后又回到手里', () => {
    const plan = PLANS[0];
    for (const t of [0, 500, plan.moments.release - 1, plan.moments.pick + 200, plan.moments.home, plan.duration]) {
      const f = plan.at(t);
      const hand = worldPoint(figOf(f, 'thrower'), fk(figOf(f, 'thrower').pose).handT);
      expect(dist(f.ball, hand), `t = ${t}`).toBeLessThan(0.5);
    }
  });

  it('一个人：蹲下时手正好按在停住的球上', () => {
    const plan = PLANS[0];
    const f = plan.at(plan.moments.pick);
    const hand = worldPoint(figOf(f, 'thrower'), fk(figOf(f, 'thrower').pose).handT);
    expect(dist(f.ball, hand)).toBeLessThan(1);
  });

  it('两个人：球正好落进对方的手套，回传也正好落进投球人的手套', () => {
    const plan = PLANS[1];
    const c1 = plan.at(plan.moments.catch1);
    expect(dist(c1.ball, worldPoint(figOf(c1, 'partner'), fk(figOf(c1, 'partner').pose).handG))).toBeLessThan(0.5);
    const c2 = plan.at(plan.moments.catch2);
    expect(dist(c2.ball, worldPoint(figOf(c2, 'thrower'), fk(figOf(c2, 'thrower').pose).handG))).toBeLessThan(0.5);
  });

  it('两个人：回传是从接球人的投球手出手的', () => {
    const plan = PLANS[1];
    const f = plan.at(plan.moments.release2);
    expect(dist(f.ball, worldPoint(figOf(f, 'partner'), fk(figOf(f, 'partner').pose).handT))).toBeLessThan(0.5);
  });

  it('三个人：击球那一刻，球正好在球棒的甜区上', () => {
    const plan = PLANS[2];
    const f = plan.at(plan.moments.contact);
    const batter = figOf(f, 'batter');
    expect(dist(f.ball, worldPoint(batter, fk(batter.pose).sweet))).toBeLessThan(0.5);
  });

  it('三个人：被打出去的球淡出，下一球在投手手里淡入', () => {
    const plan = PLANS[2];
    expect(plan.at(plan.moments.gone).ball.o).toBeLessThan(0.05);
    expect(plan.at(plan.duration).ball.o).toBe(1);
  });
});
