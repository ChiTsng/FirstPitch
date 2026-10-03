import { describe, expect, it } from 'vitest';
import { pickActiveSection } from './useActiveSection';

/**
 * 滚动叙事的取景判定。
 *
 * 这段逻辑曾经用 IntersectionObserver 的 intersectionRatio 来写，结果是
 * 球场永远停在第 0 层不动 —— 每一层的正文比一屏高得多，观察窄带时
 * 比例只有百分之几，而且只在跨阈值的瞬间回调，那一刻比例几乎正好是 0。
 * 所以这里改成按位置判定，并且补上测试。
 */

const IDS = ['layer-0', 'layer-1', 'layer-2', 'layer-3', 'layer-4', 'layer-5'];
const LINE = 400; // 视口 1000px 高时的取景线

describe('pickActiveSection', () => {
  it('还没滚到第一章时用 fallback', () => {
    // 所有章节都还在取景线下方
    const tops = [900, 1700, 3800, 5700, 9800, 14300];
    expect(pickActiveSection(tops, IDS, LINE, 'layer-0')).toBe('layer-0');
  });

  it('第一章越过取景线就切到第一章', () => {
    const tops = [-40, 760, 2860, 4760, 8860, 13360];
    expect(pickActiveSection(tops, IDS, LINE, 'layer-0')).toBe('layer-0');
  });

  it('取中间某一章：取最后一个越过取景线的', () => {
    // layer-0 到 layer-3 都已越线，layer-4、5 还在下面
    const tops = [-4700, -3900, -1800, 80, 4160, 8670];
    expect(pickActiveSection(tops, IDS, LINE, 'layer-0')).toBe('layer-3');
  });

  it('滚到最后一章', () => {
    const tops = [-14200, -13400, -11300, -9400, -5400, -900];
    expect(pickActiveSection(tops, IDS, LINE, 'layer-0')).toBe('layer-5');
  });

  it('正好压在取景线上算已经进入', () => {
    const tops = [-1000, LINE, 3000, 5000, 9000, 14000];
    expect(pickActiveSection(tops, IDS, LINE, 'layer-0')).toBe('layer-1');
  });

  it('哨兵还没渲染出来（null）就跳过，不影响其他章节', () => {
    const tops = [-4700, null, -1800, 80, 4160, 8670];
    expect(pickActiveSection(tops, IDS, LINE, 'layer-0')).toBe('layer-3');
  });

  it('章节很高时判定仍然稳定 —— 这正是原来那版失败的地方', () => {
    // 一个 4000px 高的章节。只要下一章的哨兵还没越过取景线，
    // 判定就应该一直停在这一章身上，不管它有多高。
    for (const top of [399, 0, -1000, -2000, -3599]) {
      const tops = [-9999, top, top + 4000, top + 8000, top + 12000, top + 16000];
      expect(pickActiveSection(tops, IDS, LINE, 'layer-0')).toBe('layer-1');
    }
    // 下一章的哨兵一越线就该交棒
    const handover = [-9999, -3600, 400, 4400, 8400, 12400];
    expect(pickActiveSection(handover, IDS, LINE, 'layer-0')).toBe('layer-2');
  });
});
