import { useImperativeHandle, useRef, type Ref } from 'react';
import { capsule } from '../field/limb';
import { fk, type Pose, type Skeleton } from './rig';

/** 外观：和场地上的剪影共用 .person--* 的样式（颜色、透明度） */
export type Look = 'pitcher' | 'batter' | 'catcher';

export interface PuppetHandle {
  /**
   * 每一帧调用。x、y 是脚底在场景里的位置，scale 是每米多少像素。
   * facing 是朝向：1 朝右、-1 朝左，转身时在两者之间连续变化（人被压扁再翻过来）。
   */
  draw(pose: Pose, x: number, y: number, facing: number, scale: number): void;
}

/** 各段肢体两端的粗细（米），和静止剪影保持同一套比例 */
const W = {
  torso: [0.3, 0.25],
  upper: [0.12, 0.1],
  fore: [0.1, 0.085],
  thigh: [0.17, 0.14],
  shin: [0.14, 0.1],
} as const;

type Part = 'armGu' | 'armGf' | 'legBu' | 'legBl' | 'torso' | 'legFu' | 'legFl' | 'armTu' | 'armTf';

/** 从远到近的绘制顺序：远侧的手脚先画，被身体挡住一部分 */
const ORDER: Part[] = ['armGu', 'armGf', 'legBu', 'legBl', 'torso', 'legFu', 'legFl', 'armTu', 'armTf'];

function outline(s: Skeleton): Record<Part, string> {
  return {
    armGu: capsule(s.shoulder, s.elbowG, ...W.upper),
    armGf: capsule(s.elbowG, s.handG, ...W.fore),
    legBu: capsule(s.pelvis, s.kneeB, ...W.thigh),
    legBl: capsule(s.kneeB, s.footB, ...W.shin),
    torso: capsule(s.shoulder, s.pelvis, ...W.torso),
    legFu: capsule(s.pelvis, s.kneeF, ...W.thigh),
    legFl: capsule(s.kneeF, s.footF, ...W.shin),
    armTu: capsule(s.shoulder, s.elbowT, ...W.upper),
    armTf: capsule(s.elbowT, s.handT, ...W.fore),
  };
}

const place = (x: number, y: number, facing: number, scale: number) =>
  `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(facing * scale).toFixed(3)}, ${scale})`;

const headTransform = (s: Skeleton) =>
  `translate(${s.head.x.toFixed(3)} ${s.head.y.toFixed(3)}) rotate(${s.headAngle.toFixed(1)})`;

/**
 * 会动的人。姿势由 rig.ts 的正向运动学算出关节，再画成带圆头的肢体。
 *
 * 首次渲染由 React 画出初始姿势（所以关掉动画时画面也是完整的）；
 * 之后每一帧由 OriginScene 的驱动循环调用 draw()，直接改属性，不经过 React 重渲染。
 *
 * data-person 标在最外层：一个人就是一个 data-person，回归检查靠它数人数。
 */
export function Puppet({
  look,
  pose,
  x,
  y,
  facing,
  scale,
  className,
  handle,
}: {
  look: Look;
  pose: Pose;
  x: number;
  y: number;
  facing: number;
  scale: number;
  className?: string;
  handle: Ref<PuppetHandle>;
}) {
  const root = useRef<SVGGElement>(null);
  const shade = useRef<SVGGElement>(null);
  const head = useRef<SVGGElement>(null);
  const glove = useRef<SVGCircleElement>(null);
  const bat = useRef<SVGLineElement>(null);
  const parts = useRef<Partial<Record<Part, SVGPathElement | null>>>({});

  useImperativeHandle(
    handle,
    () => ({
      draw(next, nx, ny, nf, ns) {
        const s = fk(next);
        const d = outline(s);
        for (const part of ORDER) parts.current[part]?.setAttribute('d', d[part]);
        root.current?.style.setProperty('transform', place(nx, ny, nf, ns));
        head.current?.setAttribute('transform', headTransform(s));
        shade.current?.setAttribute('transform', `translate(${s.pelvis.x.toFixed(3)} 0)`);
        if (glove.current) {
          glove.current.setAttribute('cx', s.handG.x.toFixed(3));
          glove.current.setAttribute('cy', s.handG.y.toFixed(3));
        }
        if (bat.current) {
          bat.current.setAttribute('x1', s.handT.x.toFixed(3));
          bat.current.setAttribute('y1', s.handT.y.toFixed(3));
          bat.current.setAttribute('x2', s.batTip.x.toFixed(3));
          bat.current.setAttribute('y2', s.batTip.y.toFixed(3));
        }
      },
    }),
    [],
  );

  const s = fk(pose);
  const d = outline(s);
  return (
    <g data-person ref={root} className={className} style={{ transform: place(x, y, facing, scale) }}>
      <g className={`person person--${look} puppet`}>
        <g className="person__shade" ref={shade} transform={`translate(${s.pelvis.x.toFixed(3)} 0)`}>
          <ellipse cx="0.04" cy="0.03" rx="0.5" ry="0.15" />
          <ellipse cx="0.03" cy="0.02" rx="0.3" ry="0.1" />
        </g>
        {ORDER.slice(0, 4).map((part) => (
          <path key={part} d={d[part]} ref={(n) => { parts.current[part] = n; }} />
        ))}
        {look !== 'batter' && (
          <circle ref={glove} cx={s.handG.x} cy={s.handG.y} r={look === 'catcher' ? 0.14 : 0.12} />
        )}
        {ORDER.slice(4).map((part) => (
          <path key={part} d={d[part]} ref={(n) => { parts.current[part] = n; }} />
        ))}
        <g ref={head} transform={headTransform(s)}>
          <ellipse className="puppet__head" rx="0.11" ry="0.125" />
          {look === 'batter' && (
            <path
              className="puppet__helmet"
              d="M-.135 0Q-.14-.16-.005-.16Q.14-.16.14 0L.21.01L.21.05L.05.05L.03.12L-.06.12L-.07.02Z"
            />
          )}
          {look === 'catcher' && (
            <path className="puppet__mask" d="M.02-.11Q.17-.09.15.03Q.12.12.02.12M.08-.1V.11M.13-.06V.07" />
          )}
        </g>
        {look === 'batter' && (
          <line ref={bat} className="person__bat" x1={s.handT.x} y1={s.handT.y} x2={s.batTip.x} y2={s.batTip.y} />
        )}
      </g>
    </g>
  );
}
