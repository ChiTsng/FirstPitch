import { useEffect, useState } from 'react';

/**
 * 滚动叙事用：看哪一章正在视野中，右侧球场就画到第几层。
 *
 * 做法：在视口高度 40% 处设一条看不见的「取景线」，每一章的开头放一个
 * 1px 高的哨兵元素（id 为 `<章节 id>-mark`）。哪一章的哨兵**最后一个**
 * 越过取景线，就算进入了哪一章。
 *
 * 为什么不直接观察章节本身：每一层的正文都比一屏高得多，观察一条窄带时
 * intersectionRatio 只有百分之几，而且只在跨过阈值的瞬间回调 ——
 * 那一刻的比例几乎正好是 0，判不出来。哨兵很薄，进出取景线干脆利落。
 */

/**
 * 纯函数版的判定：给一组哨兵到视口顶端的距离，返回该显示哪一章。
 * 抽出来是为了能直接写测试（见 useActiveSection.test.ts）——
 * 这段逻辑在浏览器里只在滚动时才跑，靠肉眼验证太容易漏。
 */
export function pickActiveSection(
  /** 每个章节哨兵的 getBoundingClientRect().top，顺序与 ids 一致 */
  tops: (number | null)[],
  ids: string[],
  /** 取景线离视口顶端的距离 */
  line: number,
  fallback: string,
): string {
  let current = '';
  for (let i = 0; i < ids.length; i++) {
    const top = tops[i];
    if (top != null && top <= line) current = ids[i];
  }
  return current || fallback;
}

export function useActiveSection(ids: string[], fallback: string): string {
  const key = ids.join('|');
  const [active, setActive] = useState(fallback);

  useEffect(() => {
    let frame = 0;

    const pick = () => {
      frame = 0;
      const tops = ids.map((id) => {
        const mark = document.getElementById(`${id}-mark`);
        return mark ? mark.getBoundingClientRect().top : null;
      });
      setActive(pickActiveSection(tops, ids, window.innerHeight * 0.4, fallback));
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(pick);
    };

    // 取景线是一条零高度的带：上边距 -40%、下边距 -60%
    const io = new IntersectionObserver(schedule, {
      rootMargin: '-40% 0px -60% 0px',
      threshold: 0,
    });
    for (const id of ids) {
      const mark = document.getElementById(`${id}-mark`);
      if (mark) io.observe(mark);
    }

    pick();
    // 再排一帧复算：带锚点进来时（#/#layer-3），路由那边的
    // scrollIntoView 和这里的首次判定谁先谁后并没有保证，
    // 等布局定下来之后一定要再算一次，否则球场会停在上一层。
    schedule();
    // scroll / resize 兜底：IntersectionObserver 只在跨线时回调，
    // 窗口尺寸变化导致取景线移动时也要重算。
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
    // key 是 ids 的稳定指纹，避免每次渲染都重建监听
  }, [key, fallback]);

  return active;
}
