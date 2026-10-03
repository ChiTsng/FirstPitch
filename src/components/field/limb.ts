/**
 * 人物剪影的肢体路径。纯函数，单独成文件：组件文件里混进普通函数导出，
 * React Fast Refresh 会退化成整页重载。
 */

export interface Pt {
  x: number;
  y: number;
}

const f = (n: number) => n.toFixed(3);

/**
 * 一段肢体：从 a 到 b 的四边形，两端宽 wa / wb。
 * 静止剪影用它 —— 相邻两段在关节处重叠，接缝看不出来。
 */
export function limb(a: Pt, b: Pt, wa: number, wb: number): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const q = [
    [a.x + (nx * wa) / 2, a.y + (ny * wa) / 2],
    [b.x + (nx * wb) / 2, b.y + (ny * wb) / 2],
    [b.x - (nx * wb) / 2, b.y - (ny * wb) / 2],
    [a.x - (nx * wa) / 2, a.y - (ny * wa) / 2],
  ];
  return `M${q.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')} Z`;
}

/**
 * 两端带圆头的一段肢体（略带锥度的胶囊形）。
 * 会动的人偶用它：关节一弯，方头的四边形在外侧会露出缺口，圆头不会。
 */
export function capsule(a: Pt, b: Pt, wa: number, wb: number): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / len;
  const ny = dx / len;
  const ra = wa / 2;
  const rb = wb / 2;
  return (
    `M${f(a.x + nx * ra)} ${f(a.y + ny * ra)} L${f(b.x + nx * rb)} ${f(b.y + ny * rb)} ` +
    // 两个端头都是逆时针（屏幕上 y 向下，sweep = 0）绕到外侧；方向反了圆弧会凹进肢体里
    `A${f(rb)} ${f(rb)} 0 0 0 ${f(b.x - nx * rb)} ${f(b.y - ny * rb)} ` +
    `L${f(a.x - nx * ra)} ${f(a.y - ny * ra)} ` +
    `A${f(ra)} ${f(ra)} 0 0 0 ${f(a.x + nx * ra)} ${f(a.y + ny * ra)} Z`
  );
}
