import { GRAIN_PATHS } from './material';
import { LIGHT_POOLS, TOWERS } from './lighting';
import { toSvg } from './geometry';

/**
 * 球场 SVG 的 <defs>：渐变、静态纹理、裁切、遮罩。
 *
 * 单独成文件是因为这一坨和「画什么」无关，只和「什么材质」有关，
 * 混在 FieldCanvas 里会把真正的图层结构埋掉。
 *
 * 两条硬性约束：
 *  1. 所有 id 都带 uid 前缀 —— 一个页面里会同时存在好几个球场实例。
 *  2. 材质用静态图案，辉光用渐变，不使用全场噪声或模糊滤镜。
 */

export interface FieldDefsProps {
  uid: string;
  /** 当前取景，[x, y, w, h]。天空和暗角要跟着镜头走。 */
  vb: [number, number, number, number];
  /** 界内区域路径，用来裁切草皮与条纹 */
  fair: string;
  /** 内野土路径，用来裁切颗粒 */
  dirt: string;
}

export function FieldDefs({ uid, vb, fair, dirt }: FieldDefsProps) {
  const [vx, vy, vw, vh] = vb;
  const cx = vx + vw / 2;
  const skyCy = vy + vh * 0.04;
  const vigCy = vy + vh * 0.46;
  const vigR = vw * 0.62;

  return (
    <defs>
      <pattern id={`${uid}-grain`} width="8" height="8" patternUnits="userSpaceOnUse">
        {GRAIN_PATHS.map((d, i) => <path key={i} d={d} fill={['#ffffff', '#000000', '#bfc7ad'][i]} />)}
      </pattern>
      <radialGradient id={`${uid}-ball-surface`} cx="32%" cy="24%" r="85%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor="#f6f0dc" />
        <stop offset="100%" stopColor="#899c9d" />
      </radialGradient>
      <radialGradient id={`${uid}-ball-glow`}>
        <stop offset="0%" stopColor="#fff7db" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#fff7db" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-score-bloom`} gradientUnits="userSpaceOnUse" cx="0" cy="-12" r="75">
        <stop offset="0%" stopColor="#ffe5a0" stopOpacity="0.28" />
        <stop offset="40%" stopColor="#f1c46a" stopOpacity="0.09" />
        <stop offset="100%" stopColor="#f1c46a" stopOpacity="0" />
      </radialGradient>
      {TOWERS.map((t, i) => {
        const p = toSvg(t.at);
        return (
          <linearGradient key={t.id} id={`${uid}-beam-${i}`} gradientUnits="userSpaceOnUse"
            x1={p.x} y1={p.y} x2={LIGHT_POOLS[i].cx} y2={LIGHT_POOLS[i].cy}>
            <stop offset="0%" stopColor="#e2f6ff" stopOpacity="0.13" />
            <stop offset="35%" stopColor="#cee7e1" stopOpacity="0.026" />
            <stop offset="100%" stopColor="#ffe8b4" stopOpacity="0" />
          </linearGradient>
        );
      })}
      {/* 夜空：跟着取景走，所以不论镜头推到哪一层，天光都在画面上方 */}
      <radialGradient
        id={`${uid}-sky`}
        gradientUnits="userSpaceOnUse"
        cx={cx}
        cy={skyCy}
        r={Math.max(vw, vh) * 1.1}
      >
        <stop offset="0%" stopColor="var(--field-sky)" />
        <stop offset="60%" stopColor="var(--field-sky-deep)" />
        <stop offset="100%" stopColor="var(--bg-sunken)" />
      </radialGradient>

      {/* 全场暗角。「孤岛般的一片光」是靠它来的，不是靠把光调亮。 */}
      <radialGradient
        id={`${uid}-vignette`}
        gradientUnits="userSpaceOnUse"
        cx={cx}
        cy={vigCy}
        r={vigR}
        gradientTransform={`translate(${cx} ${vigCy}) scale(1 ${(vh / vw).toFixed(4)}) translate(${-cx} ${-vigCy})`}
      >
        <stop offset="0%" stopColor="#000000" stopOpacity="0" />
        <stop offset="52%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.56" />
      </radialGradient>

      {/* 照明塔投下的光池。四个池子共用这一个渐变，各自的椭圆定形状。 */}
      {/* 偏暖：光色越接近纯白，screen 上去越把底下的草和土洗成灰的 */}
      <radialGradient id={`${uid}-pool`}>
        <stop offset="0%" stopColor="#edf8da" stopOpacity="0.9" />
        <stop offset="42%" stopColor="#c9e8bd" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#b1dcbf" stopOpacity="0" />
      </radialGradient>

      {/* 场上的圆盘（野手编号、跑者标记）：上亮下暗的搪瓷片，
          不是一块平涂的圆。 */}
      <radialGradient id={`${uid}-disc`} cx="50%" cy="30%" r="78%">
        <stop offset="0%" stopColor="var(--disc-top)" />
        <stop offset="100%" stopColor="var(--disc-bottom)" />
      </radialGradient>

      {/* 日场的光。白天不是四个光池，是一片方向明确的日照：
          太阳在左上，整片场地被均匀照亮，越靠太阳那一侧越晒白。
          夜场把这一层关掉，日场把四个光池关掉，见 field.css。 */}
      <radialGradient id={`${uid}-sun`}>
        <stop offset="0%" stopColor="#fffdf2" stopOpacity="0.36" />
        <stop offset="45%" stopColor="#fff6da" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#ffeec0" stopOpacity="0.02" />
      </radialGradient>

      {/* 塔顶的辉光：很小的亮核 + 迅速衰减的外圈。
          亮核一大、外圈一淡，叠在近黑的底上就成了一团灰雾 —— 上一版就是这么糊的。
          整组用 screen 叠加，所以这里只管形状。 */}
      <radialGradient id={`${uid}-halo`}>
        <stop offset="0%" stopColor="#fffbf0" stopOpacity="0.92" />
        <stop offset="7%" stopColor="#ffeeb8" stopOpacity="0.42" />
        <stop offset="22%" stopColor="var(--tower-gold)" stopOpacity="0.1" />
        <stop offset="58%" stopColor="var(--tower-gold)" stopOpacity="0.025" />
        <stop offset="100%" stopColor="var(--tower-gold)" stopOpacity="0" />
      </radialGradient>

      {/* 草皮本色：远处的外野沉下去，近处受光。 */}
      <linearGradient
        id={`${uid}-turf`}
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="-132"
        x2="0"
        y2="6"
      >
        <stop offset="0%" stopColor="var(--field-grass-deep)" />
        <stop offset="62%" stopColor="var(--field-grass)" />
        <stop offset="100%" stopColor="var(--field-grass-lit)" />
      </linearGradient>

      {/* 内野土：投手丘一带受光最多 */}
      <radialGradient
        id={`${uid}-soil`}
        gradientUnits="userSpaceOnUse"
        cx="0"
        cy="-18.44"
        r="36"
      >
        <stop offset="0%" stopColor="var(--field-dirt-lit)" />
        <stop offset="100%" stopColor="var(--field-dirt)" />
      </radialGradient>

      {/* 本垒附近减弱割草带，让内野与教学标记更清楚。 */}
      <radialGradient
        id={`${uid}-mowfade-grad`}
        gradientUnits="userSpaceOnUse"
        cx="0"
        cy="0"
        r="138"
      >
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="22%" stopColor="#ffffff" stopOpacity="0.45" />
        <stop offset="48%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
      </radialGradient>
      <mask id={`${uid}-mowfade`} maskUnits="userSpaceOnUse" x="-140" y="-140" width="280" height="150">
        <rect x="-140" y="-140" width="280" height="150" fill={`url(#${uid}-mowfade-grad)`} />
      </mask>

      <clipPath id={`${uid}-fair`}>
        <path d={fair} />
      </clipPath>
      <clipPath id={`${uid}-soilclip`}>
        <path d={dirt} />
      </clipPath>

      <marker
        id={`${uid}-arrow`}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M0 1 L10 5 L0 9 z" fill="context-stroke" />
      </marker>
    </defs>
  );
}
