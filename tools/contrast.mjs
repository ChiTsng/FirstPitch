// 对比度验收：把 tokens.css 里的颜色解析出来，按「前景 / 背景」成对算 WCAG 对比度。
// 两套主题下正文、次要文字、强调色、按钮文字都必须 ≥ 4.5:1。
// 用法: node tools/contrast.mjs

import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

/** 取一个选择器块里的所有自定义属性 */
function block(selector) {
  const i = css.indexOf(selector);
  if (i < 0) throw new Error(`找不到选择器 ${selector}`);
  const open = css.indexOf('{', i);
  let depth = 0;
  let end = open;
  for (let j = open; j < css.length; j++) {
    if (css[j] === '{') depth++;
    else if (css[j] === '}' && --depth === 0) {
      end = j;
      break;
    }
  }
  const out = {};
  for (const m of css.slice(open, end).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

const root = block(':root {');
const day = { ...root, ...block(":root[data-theme='day']") };

function resolve(vars, value, depth = 0) {
  if (depth > 8) throw new Error(`var() 套太深: ${value}`);
  const m = value.match(/^var\((--[\w-]+)\)$/);
  return m ? resolve(vars, vars[m[1]], depth + 1) : value;
}

/** #rgb / #rrggbb / rgba() → [r, g, b, a]，0–255 与 0–1 */
function parse(c) {
  if (c.startsWith('#')) {
    const h = c.length === 4 ? [...c.slice(1)].map((x) => x + x).join('') : c.slice(1);
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1);
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`解析不了颜色: ${c}`);
  const n = m[1].split(',').map((x) => Number(x.trim()));
  return [n[0], n[1], n[2], n[3] ?? 1];
}

/** 半透明前景要先和背景合成，否则算出来的对比度是假的 */
function flatten(fg, bg) {
  const a = fg[3];
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
}

function luminance([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** [前景 token, 背景 token, 说明] */
const PAIRS = [
  ['--ink', '--bg', '正文'],
  ['--ink-muted', '--bg', '次要文字'],
  ['--ink-faint', '--bg', '最弱的文字（页脚、注释）'],
  ['--ink', '--surface', '规则块里的正文'],
  ['--ink-muted', '--surface', '规则块里的次要文字'],
  ['--ink-faint', '--surface', '规则块里最弱的文字'],
  ['--ink', '--bg-raised', '浮起面板的正文'],
  ['--ink-muted', '--bg-raised', '浮起面板的次要文字'],
  ['--ink', '--bg-sunken', '球场底色上的文字'],
  ['--ink-muted', '--bg-sunken', '球场底色上的次要文字'],
  ['--accent-text', '--bg', '漏洞标签'],
  ['--accent-text', '--surface', '规则块里的漏洞标签'],
  ['--highlight', '--bg', '照明金的文字'],
  ['--highlight', '--surface', '规则块里的照明金文字'],
  ['--accent-ink', '--accent', '主按钮'],
  ['--lamp-ball-ink', '--lamp-ball', '坏球灯上的字'],
  ['--lamp-out-ink', '--lamp-out', '出局灯上的字'],
  ['--instrument-ink', '--instrument', '器械面板的正文'],
  ['--instrument-ink-muted', '--instrument', '器械面板的次要文字'],
  ['--instrument-ink-faint', '--instrument', '器械面板最弱的文字'],
  ['--instrument-ink', '--instrument-raised', '器械面板里凸起件上的正文'],
  ['--instrument-ink-faint', '--instrument-raised', '器械面板里凸起件上的弱字'],
  /* 亮起的键帽面色是 color-mix 出来的，脚本算不了，
     用纯照明金近似 —— 实际键面比它略暗，所以这是保守估计。 */
  ['--key-lit-ink', '--tower-gold', '亮起的键帽上的字'],
];

let failed = 0;
for (const [name, vars] of [
  ['夜场', root],
  ['日场', day],
]) {
  console.log(`\n── ${name} ───────────────────────────────`);
  for (const [fgName, bgName, label] of PAIRS) {
    const bg = parse(resolve(vars, vars[bgName]));
    const fg = flatten(parse(resolve(vars, vars[fgName])), bg);
    const r = ratio(fg, bg);
    const ok = r >= 4.5;
    if (!ok) failed++;
    console.log(
      `${ok ? ' ok ' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  ${fgName} / ${bgName}  ${label}`,
    );
  }
}

console.log(failed ? `\n${failed} 对没到 4.5:1` : '\n全部通过（≥ 4.5:1）');
process.exit(failed ? 1 : 0);
