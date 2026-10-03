import type { ReactNode } from 'react';
import { SceneArt } from './SceneArt';

export function PageBanner({ children, scene = 3 }: { children: ReactNode; scene?: number }) {
  return <header className="page__head page-banner"><div className="page-banner__copy"><span className="eyebrow">FIRST PITCH / 场边笔记</span>{children}</div><div className="page-banner__art"><span className="page-banner__orbit"/><SceneArt chapter={scene}/></div></header>;
}
