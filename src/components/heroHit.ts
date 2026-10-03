/** One clock for the bat, contact, recoil, ball and its short wake. Times are milliseconds. */
export const CONTACT = 220;
export const HIT_STOP = 45;
export const FLIGHT = 1250;
export const HIT_DURATION = CONTACT + HIT_STOP + FLIGHT;

export const HITS = [
  { name: '一记平射', note: '咔！球窜进了中外野。', x: .708, y: .555, lift: .14 },
  { name: '高飞长打', note: '这一棒，飞进灯光下的看台。', x: .775, y: .455, lift: .25 },
  { name: '直奔深处', note: '漂亮！飞向右中外野的草地。', x: .805, y: .57, lift: .10 },
] as const;

type Point = { x: number; y: number };
/** Anchors are on the 1672 × 941 stadium artwork, NOT on the animation container.
 * The painted element's rect includes its scale/parallax; cover crops from each edge
 * according to background-position. Return a viewport point to bridge both layers.
 */
export function stadiumPoint(anchor: Point, box: { left: number; top: number; width: number; height: number }, position: Point) {
  const scale = Math.max(box.width / 1672, box.height / 941);
  const width = 1672 * scale, height = 941 * scale;
  return {
    x: box.left + (box.width - width) * position.x + anchor.x * width,
    y: box.top + (box.height - height) * position.y + anchor.y * height,
  };
}

export function hitFlight(start: Point, origin: Point, end: Point, height: number, shot: number, rotation: number) {
  const hit = HITS[shot % HITS.length];
  const control = { x: start.x + (end.x - start.x) * .55, y: start.y + (end.y - start.y) * .55 - height * hit.lift };
  const launch = CONTACT + HIT_STOP;
  const pose = (x: number, y: number, size: number, stretch: number, spin: number) =>
    `translate3d(${x - origin.x}px, ${y - origin.y}px, 0) rotate(-25deg) scale(${size * stretch}, ${size / stretch}) rotate(${spin + 25}deg)`;
  const hold = pose(start.x, start.y, 1, 1, rotation);
  const ball: Keyframe[] = [
    { offset: 0, transform: hold, opacity: 1 },
    { offset: CONTACT / HIT_DURATION, transform: hold, opacity: 1 },
    { offset: (CONTACT + 18) / HIT_DURATION, transform: pose(start.x, start.y, 1, .85, rotation), opacity: 1 },
    { offset: launch / HIT_DURATION, transform: hold, opacity: 1 },
  ];
  const wake: Keyframe[] = [{ offset: 0, strokeDashoffset: .08, strokeDasharray: '.08 1', opacity: 0 }, { offset: launch / HIT_DURATION, strokeDashoffset: .08, strokeDasharray: '.08 1', opacity: 0 }];
  const samples: Point[] = [];
  // Perspective does the acceleration: most screen-space travel happens immediately,
  // then the ball becomes a distant speck. No ease-in and no floating apex nearby.
  for (let i = 0; i <= 75; i++) {
    const t = i / 75;
    const depth = 1 + 14 * t + 16 * t * t;
    const p = (1 - 1 / depth) / (1 - 1 / 31), q = 1 - p;
    samples.push({ x: q*q*start.x + 2*q*p*control.x + p*p*end.x, y: q*q*start.y + 2*q*p*control.y + p*p*end.y });
  }
  // Dash offsets are arc lengths, not Bezier parameters: match the wake to the ball.
  const lengths = [0];
  for (let i = 1; i < samples.length; i++) lengths.push(lengths[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y));
  samples.forEach((point, i) => {
    const t = i / 75, offset = (launch + t * FLIGHT) / HIT_DURATION;
    const size = 1 / (1 + 14 * t + 16 * t * t);
    ball.push({ offset, transform: pose(point.x, point.y, size, 1 + .16 * Math.sin(Math.PI * Math.min(1, t / .14)), rotation + 900 * t), opacity: t > .94 ? (1 - t) / .06 : 1 });
    const tail = .075 * (1 - t) + .005;
    wake.push({ offset, strokeDashoffset: tail - lengths[i] / lengths[75], strokeDasharray: `${tail} 1`, opacity: t < .04 ? t / .04 : (1 - t) * .75 });
  });
  return { ball, wake, end, path: `M${start.x} ${start.y}Q${control.x} ${control.y} ${end.x} ${end.y}` };
}
