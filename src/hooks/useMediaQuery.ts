import { useEffect, useState } from 'react';

/**
 * 订阅一条媒体查询。
 *
 * 只在**必须由 JS 拿到断点**的地方用 —— 目前只有首页 hero：
 * 全屏的球场在横屏和竖屏下需要两套取景，而 viewBox 是 SVG 属性，CSS 改不了。
 * 其余断点一律交给 CSS。
 *
 * 首屏那一次渲染按 query 不成立处理（服务端和水合前都没有 window），
 * 所以调用方要把「窄」当默认值，宽屏在 effect 里补上。
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);

  return matches;
}
