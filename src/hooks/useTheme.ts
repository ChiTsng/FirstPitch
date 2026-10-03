import { useCallback, useEffect, useState } from 'react';
import { readStore, writeStore } from './useLocalStorage';

export type Theme = 'night' | 'day' | 'system';

const KEY = 'bm.theme';

const LIGHT = '(prefers-color-scheme: light)';

/**
 * 主题：夜场（深色）/ 日场（浅色）/ 跟随系统。
 *
 * 「跟随系统」在这里就地解析成 night / day 写进 html 的 data-theme，
 * 而不是留给 CSS 的 @media 去判断 —— 否则一整套日场变量要在
 * `:root[data-theme='day']` 和 `@media (prefers-color-scheme: light)`
 * 里各写一遍，加一个 token 就得改两处，迟早改漏。
 * 首屏的那一帧由 index.html 里的内联脚本先顶上。
 *
 * 配色变量见 src/styles/tokens.css。
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStore<Theme>(KEY, 'system'));

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const resolved =
        theme === 'system' ? (window.matchMedia(LIGHT).matches ? 'day' : 'night') : theme;
      root.setAttribute('data-theme', resolved);
    };
    apply();
    if (theme !== 'system') return;
    const mq = window.matchMedia(LIGHT);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const cycle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'system' ? 'night' : prev === 'night' ? 'day' : 'system';
      writeStore(KEY, next);
      return next;
    });
  }, []);

  return { theme, cycle };
}
