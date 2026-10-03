import { memo, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react';
import { usePrefersReducedMotion } from '../../hooks/useLocalStorage';
import { FIELDERS } from '../../content/fielders';
import {
  BASES,
  BATTER_SPOT,
  CATCHER_SPOT,
  FIELDER_SPOTS,
  MOUND,
  VIEWBOX,
  type ViewKey,
  basePath,
  batterBoxPath,
  diamondPath,
  fairTerritoryPath,
  fencePath,
  foulLinePath,
  homePlatePath,
  infieldDirtPath,
  mownBandPaths,
  runningLanePath,
  stadiumFloorPath,
  toSvg,
} from './geometry';
import { FieldDefs } from './FieldDefs';
import { HOME_POOL, LIGHT_POOLS, TOWERS } from './lighting';
import { Silhouette } from './Silhouettes';
import { Stadium } from './Stadium';
import { Baseball } from './Baseball';
import type { FieldArrow, FieldMarker } from './markers';

/**
 * 生长的球场。全站的视觉核心。
 *
 * 同一个 SVG，随着章节推进一块块「点亮」：
 *   第 0 层  黑暗里只有本垒一小片光，一条粉笔线从投手连到捕手
 *   第 1 层  本垒板上方浮现好球带柱体
 *   第 2 层  照明塔点亮、草坪铺开、两条 90° 界线展开、一垒出现
 *   第 3 层  二三垒出现，菱形闭合，跑垒路线描出
 *   第 4 层  跑者离垒、投手板、牵制箭头
 *   第 5 层  跑垒道画出
 *
 * 材质分三样：光（光池、辉光、暗角）、土（颗粒）、石灰（粉尘毛边）。
 * 具体的渐变和纹理都在 FieldDefs.tsx；这里只管图层顺序。
 * 顺序是有讲究的：光池压在草和土**之上**（光是落在地面上的），
 * 但压在石灰线和所有教学信息**之下**（不能为了好看牺牲可读性）。
 *
 * 其他组件（强迫链、情境模拟器、赛跑计时）复用同一个球场，
 * 通过 overlay 往上叠跑者、箭头和标记。
 */

export type Layer = 0 | 1 | 2 | 3 | 4 | 5;

export interface FieldCanvasProps {
  /** 画到第几层。传 'full' 显示整座球场。 */
  layer: Layer | 'full';
  /** 取景。不传就按 layer 自动选。 */
  view?: ViewKey;
  /** 直接给一个 viewBox 字符串，用于镜头推拉的逐帧动画（首页开场） */
  viewBoxRaw?: string;
  /** 叠加的跑者、球、标记 */
  markers?: FieldMarker[];
  /** 叠加的箭头 */
  arrows?: FieldArrow[];
  /** 高亮某几个垒（垒包描边发光） */
  highlightBases?: (1 | 2 | 3 | 4)[];
  /** 给读屏用户的描述。会写进 SVG 的 <title>。 */
  title: string;
  /** 得分瞬间：整座球场闪一下照明金 */
  celebrate?: boolean;
  className?: string;
  /** A camera can update the SVG viewport without rendering the whole scene every frame. */
  cameraRef?: Ref<SVGSVGElement>;
  cameraMoving?: boolean;
  overlay?: ReactNode;
}

const LAYER_VIEW: Record<Layer | 'full', ViewKey> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  full: 'full',
};

/** 某一层要不要显示某个元素 */
function shows(layer: Layer | 'full', from: Layer): boolean {
  return layer === 'full' || layer >= from;
}

function parseViewBox(s: string): [number, number, number, number] {
  const n = s.trim().split(/[\s,]+/).map(Number);
  return [n[0], n[1], n[2], n[3]];
}

export const FieldCanvas = memo(function FieldCanvas({
  layer,
  view,
  viewBoxRaw,
  markers = [],
  arrows = [],
  highlightBases = [],
  title,
  celebrate = false,
  className,
  cameraRef,
  cameraMoving = false,
  overlay,
}: FieldCanvasProps) {
  const uid = useId().replace(/:/g, '');
  const [hovered, setHovered] = useState<number | null>(null);
  const viewBox = viewBoxRaw ?? VIEWBOX[view ?? LAYER_VIEW[layer]];
  const ownCamera = useRef<SVGSVGElement>(null);
  const initialViewBox = useRef(viewBox);
  const reduced = usePrefersReducedMotion();
  const sceneBox = cameraRef ? VIEWBOX.full : viewBox;
  const vb = useMemo(() => parseViewBox(sceneBox), [sceneBox]);

  /**
   * 镜头在逐帧动的时候（首页开场）暂时收起细颗粒，稳定之后再恢复。
   * 纹理是可复用的静态图案，不在滚动时计算 SVG 噪声滤镜。
   */
  const textured = !cameraMoving;

  // Chapter cameras ease between real geometries without a React render on every frame.
  useEffect(() => {
    if (cameraRef || !ownCamera.current) return;
    const svg = ownCamera.current;
    const from = parseViewBox(svg.getAttribute('viewBox') ?? viewBox);
    const to = parseViewBox(viewBox);
    if (reduced || from.every((n, i) => n === to[i])) {
      svg.setAttribute('viewBox', viewBox);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 760);
      const k = 1 - Math.pow(1 - t, 3);
      svg.setAttribute('viewBox', from.map((n, i) => (n + (to[i] - n) * k).toFixed(3)).join(' '));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [viewBox, cameraRef, reduced]);

  const paths = useMemo(
    () => ({
      fair: fairTerritoryPath(),
      fence: fencePath(),
      dirt: infieldDirtPath(),
      diamond: diamondPath(),
      foulRight: foulLinePath('right'),
      foulLeft: foulLinePath('left'),
      lane: runningLanePath(),
      boxLeft: batterBoxPath('left'),
      boxRight: batterBoxPath('right'),
      plate: homePlatePath(),
      floor: stadiumFloorPath(),
      mown: mownBandPaths(),
    }),
    [],
  );

  const [vx, vy, vw, vh] = vb;
  /** 背景要盖住 letterbox 出来的边条，所以按取景向外放一圈 */
  const bg = { x: vx - vw * 0.6, y: vy - vh * 0.6, width: vw * 2.2, height: vh * 2.2 };

  const lit = shows(layer, 2);
  const showFirst = shows(layer, 2);
  const showDiamond = shows(layer, 3);
  const pools = lit ? LIGHT_POOLS : [HOME_POOL];

  return (
    <svg
      ref={cameraRef ?? ownCamera}
      className={`field ${celebrate ? 'field--celebrate' : ''} ${className ?? ''}`}
      viewBox={cameraRef ? viewBox : initialViewBox.current}
      role="img"
      aria-labelledby={`${uid}-title`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={`${uid}-title`}>{title}</title>

      <FieldDefs uid={uid} vb={vb} fair={paths.fair} dirt={paths.dirt} />

      {/* ── 地面 ───────────────────────────────── */}

      <rect {...bg} fill={`url(#${uid}-sky)`} />
      {/* 场外的地面也要有颗粒：光落在没有质感的纯色上只会读成一团雾，
          读成地面才会读成灯。取景那一块就够，letterbox 的边条不用管。 */}
      {textured && (
        <rect
          x={vx}
          y={vy}
          width={vw}
          height={vh}
          className="field__grain field__grain--ground"
          fill={`url(#${uid}-grain)`}
        />
      )}

      {/* 界外的地坪。草皮的边缘直接切在纯黑上会很假，
          而且光池落在没有地面的地方只会读成一团雾。 */}
      <g className={`field__floor-g ${lit ? 'is-on' : ''}`}>
        <path d={paths.floor} className="field__floor" />
      </g>

      <Stadium uid={uid} lit={lit} />

      <g className={`field__grass ${lit ? 'is-on' : ''}`} clipPath={`url(#${uid}-fair)`}>
        <path d={paths.fair} fill={`url(#${uid}-turf)`} />
        {/* Clipped diagonal mowing lanes give the turf direction without radiating like a diagram. */}
        <g className="field__mown" mask={`url(#${uid}-mowfade)`}>
          {paths.mown.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {textured && (
          <rect
            x="-140"
            y="-142"
            width="280"
            height="146"
            className="field__grain field__grain--turf"
            fill={`url(#${uid}-grain)`}
          />
        )}
      </g>

      <g className={`field__fence ${lit ? 'is-on' : ''}`}>
        <path d={paths.fence} className="field__warning-track" />
        <path d={paths.fence} className="field__wall-shadow" />
        <path d={paths.fence} className="field__wall" />
        <path d={paths.fence} className="field__wall-rim" />
      </g>

      {/* 甲子园式的黑土内野 */}
      <g className={`field__dirt ${showFirst ? 'is-on' : ''}`}>
        <path d={paths.dirt} fill={`url(#${uid}-soil)`} />
        {textured && (
          <g clipPath={`url(#${uid}-soilclip)`}>
            <rect
              x="-36"
              y="-54"
              width="72"
              height="64"
              className="field__grain field__grain--soil"
              fill={`url(#${uid}-grain)`}
            />
          </g>
        )}
      </g>

      {/* 投手丘 */}
      <g className={`field__mound ${shows(layer, 2) ? 'is-on' : ''}`}>
        <ellipse cx={toSvg(MOUND).x} cy={toSvg(MOUND).y + 0.4} rx="2.75" ry="2.6" />
        <rect
          x={toSvg(MOUND).x - 0.9}
          y={toSvg(MOUND).y - 0.2}
          width="1.8"
          height="0.4"
          className="field__rubber"
          rx="0.08"
        />
      </g>

      {/* ── 光 ─────────────────────────────────── */}

      {/* 光池：落在地面上，所以压在草和土之上。screen 是因为光是相加的。 */}
      <g className="field__pools" aria-hidden="true">
        {!lit && <ellipse cx="0" cy="-18.44" rx="6" ry="4" opacity="0.14" fill={`url(#${uid}-pool)`} />}
        {pools.map((p, i) => (
          <ellipse
            key={i}
            cx={p.cx}
            cy={p.cy}
            rx={p.rx}
            ry={p.ry}
            opacity={p.peak}
            transform={`rotate(${p.rotate.toFixed(1)} ${p.cx} ${p.cy})`}
            fill={`url(#${uid}-pool)`}
          />
        ))}
      </g>

      {/* 暗角：四角沉进黑暗，那片光才成为孤岛。压在教学信息之下。 */}
      <rect {...bg} className="field__score-light" fill={`url(#${uid}-score-bloom)`} aria-hidden="true" />
      <rect {...bg} className="field__vignette" fill={`url(#${uid}-vignette)`} aria-hidden="true" />

      {/* 日照：太阳在左上，一片均匀的暖光压过整个场地。
          夜场里这一层被关掉（field.css），两套主题各用各的光。 */}
      <g className="field__sun" aria-hidden="true">
        <ellipse cx="-52" cy="-78" rx="185" ry="165" fill={`url(#${uid}-sun)`} />
      </g>

      {/* 塔顶的辉光与灯盘。画在**暗角之上** —— 光源是直接看见的，
          被暗角压住的光源就不成其为光源了。只有全景镜头看得见，近景会裁掉。 */}
      <g className={`field__towers ${lit ? 'is-on' : ''}`} aria-hidden="true">
        {TOWERS.map((t, i) => {
          const p = toSvg(t.at);
          return (
            // --i 给 CSS 算点灯的先后：四座塔依次亮起，不是一起亮
            <g key={t.id} className="tower" style={{ '--i': i } as CSSProperties}>
              <circle cx={p.x} cy={p.y} r={t.glow} fill={`url(#${uid}-halo)`} />
              <path d={`M${p.x - 10} ${p.y - 0.6} H${p.x + 10} M${p.x} ${p.y - 7} V${p.y + 6}`} className="tower__flare" />
              <rect className="tower__mast" x={p.x - 0.4} y={p.y + 1} width="0.8" height="9" />
              <rect
                className="tower__bank"
                x={p.x - 3.2}
                y={p.y - 2.6}
                width="6.4"
                height="3.8"
                rx="0.4"
              />
              {[-2.25, -0.75, 0.75, 2.25].map((dx) =>
                [-1.3, 0.1].map((dy) => (
                  <circle
                    key={`${dx}:${dy}`}
                    className="tower__lamp"
                    cx={p.x + dx}
                    cy={p.y + dy - 0.35}
                    r="0.55"
                  />
                )),
              )}
            </g>
          );
        })}
      </g>

      {/* ── 石灰 ───────────────────────────────── */}

      <g className="field__chalk-set">
        {/* 界线：第 2 层从本垒展开 */}
        <g className={`field__foul ${showFirst ? 'is-on' : ''}`}>
          <Chalk d={paths.foulRight} draw />
          <Chalk d={paths.foulLeft} draw />
        </g>

        {/* 跑垒道：第 5 层才画 */}
        <g className={`field__lane ${shows(layer, 5) ? 'is-on' : ''}`}>
          <path d={paths.lane} className="field__lane-fill" />
          <Chalk d={paths.lane} w={0.3} dash="1.6 1.2" />
        </g>

        {/* 跑垒路线（菱形）：第 3 层闭合 */}
        <g className={`field__diamond ${showDiamond ? 'is-on' : ''}`}>
          <Chalk d={paths.diamond} w={0.32} dash="2.4 2" />
        </g>

        {/* 打者区与本垒板：第 1 层才出现 */}
        <g className={`field__home ${shows(layer, 1) ? 'is-on' : ''}`}>
          <Chalk d={paths.boxLeft} w={0.076} />
          <Chalk d={paths.boxRight} w={0.076} />
          <path d={paths.plate} className="field__plate" />
        </g>

        {/* 第 0 层的那条粉笔线：投手 → 捕手 */}
        <g className={`field__battery ${layer === 0 || layer === 1 ? 'is-on' : ''}`}>
          <line
            x1={toSvg(MOUND).x}
            y1={toSvg(MOUND).y}
            x2={toSvg(CATCHER_SPOT).x}
            y2={toSvg(CATCHER_SPOT).y}
            className="chalk chalk--core"
            strokeWidth="0.14"
            strokeOpacity="0.6"
            strokeDasharray="0.9 1.1"
          />
        </g>
      </g>

      {/* 垒包 */}
      {(['first', 'second', 'third'] as const).map((name, i) => {
        const baseNo = (i + 1) as 1 | 2 | 3;
        const visible = baseNo === 1 ? showFirst : showDiamond;
        return (
          <g key={name} className={`field__base ${visible ? 'is-on' : ''}`}>
            <path
              d={basePath(BASES[name])}
              className={highlightBases.includes(baseNo) ? 'is-lit' : undefined}
            />
          </g>
        );
      })}
      {highlightBases.includes(4) && (
        <path d={homePlatePath(4)} fill="none" className="is-lit" />
      )}

      {/* 好球带：第 1 层浮现，本垒板正上方的立体区域 */}
      <g className={`field__zone ${shows(layer, 1) ? 'is-on' : ''}`} aria-hidden="true">
        <StrikeZone />
      </g>

      {/* 野手 1–9：第 2 层淡入 */}
      <g className={`field__fielders ${shows(layer, 2) ? 'is-on' : ''}`}>
        {FIELDERS.map((f) => {
          const p = toSvg(FIELDER_SPOTS[f.no]);
          // 第 2–5 层镜头在内野，外野手画出来也看不见，索性只在全景显示
          const outfieldHidden = f.zone === '外野' && layer !== 'full';
          if (outfieldHidden) return null;
          return (
            <g
              key={f.no}
              className="fielder"
              tabIndex={shows(layer, 2) ? 0 : -1}
              role="button"
              aria-label={`${f.no} 号位 ${f.zh}，日语 ${f.ja}，英语 ${f.en}`}
              onMouseEnter={() => setHovered(f.no)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(f.no)}
              onBlur={() => setHovered(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="2.1"
                className="fielder__disc"
                fill={`url(#${uid}-disc)`}
              />
              <text x={p.x} y={p.y} className="fielder__no" dy="0.7">
                {f.no}
              </text>
              {hovered === f.no && (
                <g className="fielder__tip" aria-hidden="true">
                  <rect x={p.x - 9} y={p.y - 9.6} width="18" height="6" rx="0.8" />
                  <text x={p.x} y={p.y - 6.6} className="fielder__tip-zh">
                    {f.zh}
                  </text>
                  <text x={p.x} y={p.y - 5.4} className="fielder__tip-en" dy="0.9">
                    {f.en}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* 投手、打者、捕手的姿态剪影 —— 第 0 层的「三个人」，也是全图唯一的比例尺。
          第 2 层起野手换成 1–9 的编号盘，投捕的剪影就撤掉，免得叠在一起。 */}
      <g className="field__people" aria-hidden="true">
        {!shows(layer, 2) && <Silhouette at={MOUND} role="pitcher" />}
        <Silhouette at={BATTER_SPOT} role="batter" />
        {!shows(layer, 2) && <Silhouette at={CATCHER_SPOT} role="catcher" />}
      </g>

      {/* ── 以下是各组件叠上来的内容 ───────────────── */}

      <g className="field__arrows">
        {arrows.map((a) => {
          const from = toSvg(a.from);
          const to = toSvg(a.to);
          return (
            <line
              key={a.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={`field-arrow field-arrow--${a.tone ?? 'free'}`}
              pathLength={a.dashed ? undefined : 1}
              strokeDasharray={a.dashed ? '1.8 1.4' : undefined}
              markerEnd={a.tone === 'streak' ? undefined : `url(#${uid}-arrow)`}
            />
          );
        })}
      </g>

      <g className="field__markers">
        {markers.map((m) => {
          const p = toSvg(m.at);
          if (m.kind === 'ball') {
            return (
              <g key={m.id} className="field-ball field-token" style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
                <Baseball uid={uid} />
              </g>
            );
          }
          if (m.kind === 'note') {
            return (
              <text key={m.id} x={p.x} y={p.y} className="field-note">
                {m.label}
              </text>
            );
          }
          return (
            <g key={m.id} className={`field-token field-runner field-runner--${m.kind.replace('runner-', '')}`} style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
              <circle r="3.5" className="field-runner__halo" />
              <circle r="2.3" className="field-runner__disc" fill={`url(#${uid}-disc)`} />
              {m.label && (
                <text dy="0.75">
                  {m.label}
                </text>
              )}
            </g>
          );
        })}
      </g>
      {overlay}
    </svg>
  );
});

/**
 * 一条石灰线。
 *
 * 真实的石灰线有粉尘、有毛边、宽窄不匀，不是数学上完美的一条白带。
 * 粉尘用两道加宽的低透明度描边叠出来（比 feGaussianBlur 便宜得多），
 * 保持核心界线的真实几何，粉尘只通过低透明度的外层表现。
 */
function Chalk({
  d,
  w = 0.42,
  dash,
  draw = false,
}: {
  d: string;
  w?: number;
  dash?: string;
  /** 入场时用 stroke-dashoffset 把线「画出来」。和 dash 互斥。 */
  draw?: boolean;
}) {
  // pathLength=1 把路径长度归一化，CSS 里就能直接写 dasharray: 1
  const extra = draw ? { pathLength: 1 } : {};
  return (
    <>
      <path
        d={d}
        {...extra}
        className={`chalk chalk--bloom ${draw ? 'is-drawn' : ''}`}
        strokeWidth={w * 2.2}
        strokeDasharray={dash}
      />
      <path
        d={d}
        {...extra}
        className={`chalk chalk--haze ${draw ? 'is-drawn' : ''}`}
        strokeWidth={w * 1.5}
        strokeDasharray={dash}
      />
      <path
        d={d}
        {...extra}
        className={`chalk chalk--core ${draw ? 'is-drawn' : ''}`}
        strokeWidth={w}
        strokeDasharray={dash}
      />
    </>
  );
}

/**
 * 好球带：本垒板正上方的**立体**区域。
 *
 * 尺寸按真实比例，因为它就站在 1.9 m 的打者剪影旁边，读者是拿人去量它的：
 *   宽   = 本垒板宽度 0.432 m
 *   上沿 = 肩膀与腰带的中点，约身高的 0.56 → 1.06 m
 *   下沿 = 膝盖下方的凹陷，约身高的 0.27 → 0.51 m
 * 画成一个带厚度的柱体，提醒它是三维的、而且因人而异。
 *
 * （上一版画成了 3 倍宽、2.1 m 高的大柜子，比打者还高一截 ——
 * 剪影换成真实比例之后这个错就藏不住了。）
 */
function StrikeZone() {
  const w = 0.432;
  const top = -1.06; // SVG 里 y 向上为负
  const bottom = -0.51;
  const depth = 0.3;
  const half = w / 2;
  return (
    <g transform={`translate(${-depth / 2} ${depth / 2})`}>
      {/* 后面 */}
      <rect
        x={-half + depth}
        y={top - depth}
        width={w}
        height={bottom - top}
        className="zone__face zone__face--back"
      />
      {/* 连接棱 */}
      {[
        [-half, top, -half + depth, top - depth],
        [half, top, half + depth, top - depth],
        [-half, bottom, -half + depth, bottom - depth],
        [half, bottom, half + depth, bottom - depth],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="zone__edge" />
      ))}
      {/* 前面 */}
      <rect
        x={-half}
        y={top}
        width={w}
        height={bottom - top}
        className="zone__face zone__face--front"
      />
    </g>
  );
}
