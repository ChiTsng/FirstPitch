import { Fragment, useState, type ReactNode } from 'react';
import { TERM_INDEX } from '../content/glossary';

/**
 * 内容文件里用的一小套标记，只有两种：
 *
 *   **粗体**       强调
 *   [[本垒打]]     术语，自动挂上日英对照的悬停提示
 *   [[术语|显示文字]]  术语，但正文里显示别的字
 *
 * 故意做得很小：内容是给人改的，不是给人学语法的。
 */

const TOKEN = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g;

export function Rich({ children }: { children: string }): ReactNode {
  return <>{parse(children, false)}</>;
}

/**
 * 两种标记会**互相嵌套**：`**投手不能[[balk]]**` 里粗体包着术语。
 * 所以粗体里的内容要再解析一遍，否则 `[[...]]` 会原样印在页面上。
 *
 * inBold 决定要不要把数字染成照明金 —— 只有加粗的数字才是「规则选定的那个数」。
 */
function parse(text: string, inBold: boolean): ReactNode[] {
  return text
    .split(TOKEN)
    .filter((p) => p !== '')
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{parse(part.slice(2, -2), true)}</strong>;
      }
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const [key, shown] = part.slice(2, -2).split('|');
        return <TermTip key={i} termKey={key} label={shown ?? key} />;
      }
      return <Fragment key={i}>{inBold ? numerals(part) : part}</Fragment>;
    });
}

/**
 * 加粗里的数字换成照明金 + 等宽数字。
 *
 * 只认**加粗里**的数字，因为加粗的就是「规则选定的那个数」——
 * 3 出局、4 坏球、27.43 m。读者会慢慢认出这个信号。
 * 全文的数字都染色就成了噪音，所以不做。
 */
const DIGITS = /(\d+(?:\.\d+)?)/g;

function numerals(text: string): ReactNode {
  // split 带捕获组时，奇数位就是捕获到的数字，不用再 test 一遍
  // （/g 的 test 会推进 lastIndex，逐个判断会漏掉一半）
  const parts = text.split(DIGITS);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span className="num" key={i}>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** 正文里的术语：悬停或聚焦时显示日英对照。 */
export function TermTip({ termKey, label }: { termKey: string; label: string }) {
  const [open, setOpen] = useState(false);
  const term = TERM_INDEX.get(termKey);

  if (!term) return <>{label}</>;

  return (
    <span
      className="term"
      tabIndex={0}
      role="button"
      aria-label={`${term.zh}，日语 ${term.ja}，英语 ${term.en}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {label}
      {open && (
        <span className="term__pop" aria-hidden="true">
          <b>{term.ja}</b>
          <i>{term.en}</i>
        </span>
      )}
    </span>
  );
}

/** 段落。内容里一段一段写，这里统一渲染。 */
export function P({ children }: { children: string }) {
  return (
    <p>
      <Rich>{children}</Rich>
    </p>
  );
}

/**
 * 旁注。两种语气，差别不是装饰而是内容性质：
 *
 *   批注   史话、为什么、日语陷阱 —— 缩进、小字、左侧一列点，像写在页边
 *   核对   标题带 ⏱ 或者就叫「说清楚」—— 石灰线描的框，字面意思上「画在场地上」
 *
 * ⏱ 是内容里既有的约定（页脚也在解释它），所以这里直接认它，
 * 不用再往每个内容文件的 Block 类型里加一个字段。
 */
export function Aside({
  label,
  text,
  wide = false,
}: {
  label: string;
  text: string;
  wide?: boolean;
}) {
  const checked = label.startsWith('⏱') || label === '说清楚';
  return (
    <p className={`aside${checked ? ' aside--checked' : ''}${wide ? ' aside--wide' : ''}`}>
      <span className="aside__label">{label}</span>
      <Rich>{text}</Rich>
    </p>
  );
}

export function UL({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((it, i) => (
        <li key={i}>
          <Rich>{it}</Rich>
        </li>
      ))}
    </ul>
  );
}
