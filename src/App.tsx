import { Nav } from './components/Nav';
import { useHashRoute } from './hooks/useHashRoute';
import { Home } from './pages/Home';
import {
  Glossary,
  Lab,
  LiveDead,
  People,
  Principles,
  QuizPage,
  Stories,
  Timing,
} from './pages/Pages';

/** 路由表。加新页面就在这里加一行，并在 Nav.tsx 里加个链接。 */
const ROUTES: Record<string, () => React.ReactElement> = {
  '/': Home,
  '/live-dead': LiveDead,
  '/people': People,
  '/timing': Timing,
  '/principles': Principles,
  '/lab': Lab,
  '/quiz': QuizPage,
  '/glossary': Glossary,
  '/stories': Stories,
};

export function App() {
  const route = useHashRoute();
  const Page = ROUTES[route.path] ?? Home;
  const current = ROUTES[route.path] ? route.path : '/';

  return (
    <div className="app" data-route={current}>
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <Nav current={current} />
      <Page />
      <footer className="footer">
        <p>
          内容来自一次一对一的棒球规则教学对话，按「漏洞 → 规则」的顺序重新整理。
        </p>
        <p>
          规则准确性优先于视觉效果。带 ⏱ 的事实核对于 2026 年 9 月，
          联盟规则每年都可能变动。
        </p>
      </footer>
    </div>
  );
}
