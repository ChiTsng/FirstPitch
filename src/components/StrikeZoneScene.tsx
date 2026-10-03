import { useId, useState } from 'react';
import { Silhouette } from './field/Silhouettes';

const PITCHES = [
  { label: '正中穿过', x: 285, y: 223, strike: true, note: '球穿过区域内部：好球。' },
  { label: '擦过边缘', x: 336, y: 223, strike: true, note: '球心在外面，但球的一部分擦到区域：仍是好球。' },
  { label: '完全偏出', x: 408, y: 223, strike: false, note: '整颗球都在区域之外，打者也没有挥棒：坏球。' },
];

export function StrikeZoneScene() {
  const id = useId().replace(/:/g, '');
  const [pitch, setPitch] = useState(0);
  const selected = PITCHES[pitch];
  return (
    <figure className="chapter-scene zone-scene" data-pitch={pitch}>
      <div className="chapter-scene__top"><span><i/> 观察室</span><span>01 / 05</span></div>
      <svg className="zone-scene__drawing" viewBox="0 0 560 420" role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>本垒板上方的立体好球带：上沿是肩膀与球裤上沿的中点，下沿是膝盖下方凹处。{selected.note}</title>
        <defs><linearGradient id={`${id}-glass`} x2="1" y2="1"><stop stopColor="#80edc5" stopOpacity=".32"/><stop offset="1" stopColor="#4ab49e" stopOpacity=".07"/></linearGradient></defs>
        <ellipse cx="275" cy="345" rx="200" ry="33" fill="#8ec6a9" fillOpacity=".07"/>
        <g transform="translate(184 340) scale(130)"><Silhouette at={{ x: 0, y: 0 }} role="batter"/></g>
        <path d="M244 330H330L356 312 339 295 270 312Z" fill="#f4edcf" stroke="#fff9e8" strokeWidth="2"/>
        <path d="M244 272V330M330 272V330M339 237V295" stroke="#eddfb1" strokeOpacity=".4" strokeDasharray="3 5"/>
        <path d="M244 174H330L356 156 339 139 270 156Z" fill={`url(#${id}-glass)`} stroke="#87e3bf" strokeWidth="1.5"/>
        <path d="M330 174 356 156 339 139V237L356 254 330 272Z" fill="#71caa8" fillOpacity=".13" stroke="#87e3bf" strokeWidth="1.5"/>
        <path d="M244 174 270 156V254L244 272Z" fill="#71caa8" fillOpacity=".07" stroke="#87e3bf" strokeOpacity=".5"/>
        <path d="M244 174V272H330V174Z" fill={`url(#${id}-glass)`} stroke="#bdffdc" strokeWidth="2"/>
        <path d="M244 272 270 254 339 237M270 254V156" fill="none" stroke="#87e3bf" strokeDasharray="4 5" opacity=".6"/>
        <path d="M273 174V272M302 174V272M244 207H330M244 240H330" stroke="#c5f1cf" strokeOpacity=".25"/>
        <path d="M120 137H206M120 210H206M120 174H244M120 272H244" stroke="#eddda8" strokeOpacity=".5" strokeDasharray="3 5"/>
        <path d="M114 137V210M109 137H119M109 210H119" stroke="#e2c78c"/>
        <g className="zone-scene__labels"><text x="25" y="130">肩膀上沿</text><text x="25" y="215">球裤上沿</text><text x="25" y="180" className="zone-scene__gold">两者中点</text><text x="25" y="274" className="zone-scene__gold">膝盖下方<tspan x="25" dy="19">凹处</tspan></text><text x="388" y="115">立体好球带</text><text x="388" y="135" className="zone-scene__muted">沿本垒板向后延伸</text><path d="M380 140 346 162" stroke="#b2d9c3"/><text x="305" y="377" textAnchor="middle">本垒板 · 宽 43.18 cm</text><text x="280" y="27" textAnchor="middle" className="zone-scene__muted">斜前方视角 · 打者保持准备击球的站姿</text></g>
        {/* 球从上一个位置滑到新位置：CSS 过渡，见 teaching.css。首次渲染不播放；
            减少动态效果时由 base.css 的全局规则压成瞬移。 */}
        <g className="zone-scene__ball" style={{ transform: `translate(${selected.x}px, ${selected.y}px)` }}>
          <path d="M0 0 32-22" stroke={selected.strike ? '#f4d182' : '#f3a291'} strokeWidth="2" strokeDasharray="3 4"/>
          <circle r="16" fill={selected.strike ? '#f4d182' : '#f3a291'} opacity=".12"/><circle r="8" fill="#fff1d1" stroke={selected.strike ? '#e9c277' : '#de877c'} strokeWidth="1.5"/><path d="M-3-6Q3 0-3 6" stroke="#ac4740" fill="none"/>
        </g>
      </svg>
      <div className="scene-steps zone-choices" aria-label="选择投球位置">{PITCHES.map((p, i) => <button key={p.label} aria-pressed={pitch === i} onClick={() => setPitch(i)}>{p.label}</button>)}</div>
      <figcaption><span className={`zone-verdict ${selected.strike ? 'is-strike' : ''}`}>{selected.strike ? 'S' : 'B'}</span><div role="status"><strong>{selected.strike ? '好球' : '坏球'} · 假设打者没有挥棒</strong><p>{selected.note}</p></div></figcaption>
      <p className="zone-scene__footnote">范围随打者站姿而变。此处画规则书的立体区域；<a href="#/stories#abs">MLB ABS 使用二维判定平面 ↗</a></p>
    </figure>
  );
}
