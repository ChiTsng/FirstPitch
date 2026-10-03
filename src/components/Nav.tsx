import { useEffect, useState } from 'react';
import { href } from '../hooks/useHashRoute';
import { useTheme, type Theme } from '../hooks/useTheme';

const LINKS: { to: string; label: string }[] = [
  { to: '/', label: '主线' },
  { to: '/live-dead', label: '活球与死球' },
  { to: '/people', label: '人员' },
  { to: '/timing', label: '时间尺度' },
  { to: '/principles', label: '原理' },
  { to: '/lab', label: '情境模拟器' },
  { to: '/quiz', label: '测验' },
  { to: '/glossary', label: '术语' },
  { to: '/stories', label: '故事' },
];

const THEME_LABEL: Record<Theme, string> = {
  system: '跟随系统',
  night: '夜场',
  day: '日场',
};

export function Nav({ current }: { current: string }) {
  const { theme, cycle } = useTheme();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [current]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  return (
    <nav className={`nav ${open ? 'is-open' : ''}`} aria-label="主导航">
      <a className="nav__brand" href={href('/')}>
        第一球<span> First Pitch</span>
      </a>
      <div className="nav__links" id="main-navigation">
        {LINKS.map((l) => (
          <a
            key={l.to}
            className="nav__link"
            href={href(l.to)}
            aria-current={current === l.to ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </a>
        ))}
      </div>
      <button
        className="theme-toggle"
        onClick={cycle}
        aria-label={`配色：${THEME_LABEL[theme]}。点击切换。`}
      >
        {theme === 'day' ? '☀' : theme === 'night' ? '✦' : '◐'}
        <span>{THEME_LABEL[theme]}</span>
      </button>
      <button className="nav__menu" aria-label={open ? '收起导航' : '展开导航'} aria-controls="main-navigation" aria-expanded={open} onClick={() => setOpen(v => !v)}><span/><span/></button>
    </nav>
  );
}
