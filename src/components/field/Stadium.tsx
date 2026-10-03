import { memo } from 'react';
import { fenceDistance, polar, toSvg } from './geometry';
import { LIGHT_POOLS, TOWERS } from './lighting';

// Architectural detail stays outside the playing surface. All geometry is in metres.
const rows = Array.from({ length: 5 }, (_, row) => {
  const points = Array.from({ length: 73 }, (_, i) => {
    const angle = ((i - 36) * 1.36 * Math.PI) / 180;
    const p = toSvg(polar(angle, fenceDistance(angle) + 5.2 + row * 2.25));
    return `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  });
  return points.join(' ');
});
const seats = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: 67 }, (_, i) => {
    const degrees = (i - 33) * 1.44;
    const angle = (degrees * Math.PI) / 180;
    return { ...toSvg(polar(angle, fenceDistance(angle) + 5.8 + row * 2.25)), degrees, row, i };
  }).filter(({ i }) => i % 12 !== 0 && i % 12 !== 1),
).flat();

export const Stadium = memo(function Stadium({ uid, lit }: { uid: string; lit: boolean }) {
  return (
    <g className={`field__stadium ${lit ? 'is-on' : ''}`} aria-hidden="true">
      <g className="stadium__terraces">
        {rows.map((d, i) => <path key={i} d={d} />)}
      </g>
      <g className="stadium__seats">
        {seats.map((s) => (
          <rect key={`${s.row}-${s.i}`} x={s.x - 0.55} y={s.y - 0.4} width="1.1" height="0.7"
            rx="0.15" transform={`rotate(${s.degrees} ${s.x} ${s.y})`}
            className={(s.i * 7 + s.row * 11) % 19 === 0 ? 'is-spark' : undefined} />
        ))}
      </g>
      <g className="stadium__concourse">
        {[-1, 1].map((side) => (
          <g key={side} transform={`translate(${side * 38} -13) rotate(${side * -44})`}>
            <rect x="-3.7" y="-15" width="7.4" height="30" rx="0.7" />
            {[0, 1, 2].map((i) => <path key={i} d={`M${i * 2.1 - 2.1} -13 V13`} />)}
          </g>
        ))}
      </g>
      <g className="stadium__beams">
        {TOWERS.map((t, i) => {
          const source = toSvg(t.at);
          const pool = LIGHT_POOLS[i];
          return (
            <path key={t.id} d={`M${source.x} ${source.y} L${pool.cx - 24} ${pool.cy + 12} Q${pool.cx} ${pool.cy + 24} ${pool.cx + 24} ${pool.cy + 12} Z`}
              fill={`url(#${uid}-beam-${i})`} />
          );
        })}
      </g>
    </g>
  );
});
