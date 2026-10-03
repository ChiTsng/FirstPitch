import { useEffect, useState } from 'react';

/**
 * 一个很小的 hash 路由，代替 react-router。
 *
 * 为什么用 hash（#/quiz 而不是 /quiz）：这是纯静态站点，没有后端。
 * 用 hash 的话，构建产物丢到 GitHub Pages 的任意子目录、或者直接双击
 * 本地 index.html，链接都不会 404，不需要服务器做任何重写规则。
 *
 * 路径与锚点分开写：#/         → path '/'
 *                    #/quiz    → path '/quiz'
 *                    #/#layer-2 → path '/', hash 'layer-2'
 */
export interface Route {
  path: string;
  /** 章节锚点，例如 layer-2 */
  anchor: string;
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return { path: '/', anchor: '' };
  const [path, anchor = ''] = raw.split('#');
  return { path: path || '/', anchor };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse());

  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  // 换页时回到顶部；带锚点时滚到对应章节
  useEffect(() => {
    if (route.anchor) {
      const el = document.getElementById(route.anchor);
      if (el) {
        el.scrollIntoView({ block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [route.path, route.anchor]);

  return route;
}

export function href(path: string, anchor?: string): string {
  return `#${path}${anchor ? `#${anchor}` : ''}`;
}

export function navigate(path: string, anchor?: string): void {
  window.location.hash = `${path}${anchor ? `#${anchor}` : ''}`;
}
