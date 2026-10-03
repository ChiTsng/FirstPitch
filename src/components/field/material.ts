// A reusable, deterministic texture tile. No live SVG noise filter or random render work.
export const GRAIN_PATHS = Array.from({ length: 3 }, (_, tone) => {
  let seed = 41 + tone * 199;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: 160 }, () => {
    const x = (random() * 8).toFixed(3);
    const y = (random() * 8).toFixed(3);
    const w = (0.025 + random() * 0.055).toFixed(3);
    return `M${x} ${y}h${w}v.04h-${w}Z`;
  }).join(' ');
});
