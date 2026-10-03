import { useState } from 'react';
import { FieldCanvas, type Layer } from './field/FieldCanvas';
import type { FieldArrow, FieldMarker } from './field/markers';
import { OriginScene } from './OriginScene';
import { StrikeZoneScene } from './StrikeZoneScene';

const SCENES = [
  ['一次抛接球', '让球动起来', '投手投向捕手，打者站在旁边。这就是起点。'],
  ['给投球划一扇窗', '看看好球带', '球数的故事，从本垒板上方的这扇窗开始。'],
  ['向球场展开', '展开界内区域', '两条界线之间，是打出去后可以成为界内球的区域。'],
  ['把路线连成一圈', '连起四个垒', '本垒 → 一垒 → 二垒 → 三垒 → 本垒。'],
  ['离垒的一小步', '看看离垒位置', '跑者可以提前离开垒包，但也承担被触杀的风险。'],
  ['同一片场地，不同的路', '点亮跑垒道', '本垒到一垒的后半程，有一条特别的跑垒道。'],
];

export function ChapterScene({ no }: { no: Layer & number }) {
  if (no === 0) return <OriginScene />;
  if (no === 1) return <StrikeZoneScene />;
  return <FieldChapterScene no={no} />;
}

function FieldChapterScene({ no }: { no: Layer & number }) {
  const [expanded, setExpanded] = useState(false);
  const scene = SCENES[no];
  const markers: FieldMarker[] = no === 4 && expanded ? [{ id: 'lead-runner', at: { x: 15.5, y: 23 }, kind: 'runner', label: '离垒' }] : [];
  const arrows: FieldArrow[] = no === 3 && expanded ? [
    { id: 'r1', from: {x:0,y:0}, to:{x:19.4,y:19.4},tone:'free' },
    { id: 'r2', from: {x:19.4,y:19.4}, to:{x:0,y:38.8},tone:'free' },
    { id: 'r3', from: {x:0,y:38.8}, to:{x:-19.4,y:19.4},tone:'free' },
    { id: 'r4', from: {x:-19.4,y:19.4}, to:{x:0,y:0},tone:'free' },
  ] : [];
  return (
    <figure className="chapter-scene">
      <div className="chapter-scene__top"><span><i/> 观察室</span><span>0{no} / 05</span></div>
      <div className={`chapter-scene__field ${expanded ? 'is-expanded' : ''}`}>
        <FieldCanvas layer={(expanded ? no : no - 1) as Layer} view={no === 5 ? 5 : 'infield'} title={scene[2]} markers={markers} arrows={arrows}/>
      </div>
      <figcaption><span className="chapter-scene__index" aria-hidden="true">0{no}</span><div><strong>{scene[0]}</strong><p>{scene[2]}</p></div></figcaption>
      <button className="scene-trigger" aria-pressed={expanded} onClick={() => setExpanded(v => !v)}><span aria-hidden="true">{expanded ? '↶' : '↗'}</span>{expanded ? '回到起点' : scene[1]}</button>
    </figure>
  );
}
