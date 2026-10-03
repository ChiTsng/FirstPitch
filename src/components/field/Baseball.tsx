import { memo } from 'react';
import { seamPaths } from './geometry';

const seams = seamPaths();

export const Baseball = memo(function Baseball({ uid, radius = 0.95, spin = false }: {
  uid: string; radius?: number; spin?: boolean;
}) {
  return (
    <g transform={`scale(${radius})`}>
      <circle r="1.8" className="field-ball__glow" fill={`url(#${uid}-ball-glow)`} />
      <g className={spin ? 'field-ball__spin' : undefined}>
        <circle r="1" className="field-ball__body" fill={`url(#${uid}-ball-surface)`} />
        {seams.map((d, i) => <path key={i} d={d} className="field-ball__seam" />)}
        <path d="M-.64 -.52 l-.1 .09 M-.42 -.34 l-.08 .12 M-.16 -.24 l-.03 .13 M.16 -.24 l.03 .13 M.42 -.34 l.08 .12 M.64 -.52 l.1 .09 M-.64 .52 l-.1 -.09 M-.42 .34 l-.08 -.12 M-.16 .24 l-.03 -.13 M.16 .24 l.03 -.13 M.42 .34 l.08 -.12 M.64 .52 l.1 -.09" className="field-ball__stitches" />
      </g>
    </g>
  );
});
