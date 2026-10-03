// 测验进度。存在 localStorage 里；存储不可用时照常做题，只是不记录。
//
// 和 Quiz.tsx 分开放：组件文件里混进 hook 导出会让 React Fast Refresh 退化成整页重载。

import { useLocalStorage } from './useLocalStorage';

export type QuizState = Record<string, 'correct' | 'wrong' | 'revealed'>;

const STORE_KEY = 'bm.quiz';

export function useQuizProgress() {
  return useLocalStorage<QuizState>(STORE_KEY, {});
}
