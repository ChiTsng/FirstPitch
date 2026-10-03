import { useRef, useState } from 'react';
import { DERIVED_RULES, PRINCIPLES } from '../content/principles';
import { Rich } from './Rich';

/**
 * 原理推导图。左列 5+1 条原理，右列具体规则。
 *
 * 双向的：点原理 → 高亮它推出的所有规则；点规则 → 高亮它来自的原理。
 * 有几条规则同时来自两三条原理（比如内野高飞必死），这一点很重要，
 * 所以刻意没有做成一对多的树。
 *
 * 选中原理时，右列只留下它推出的规则（否则排在下面的要滚很远才找得到）；
 * 窄屏上两列叠成一列，连其他原理也一并收起，选中的原理下面紧跟它的规则。
 * 选中规则时仍然只做高亮/变暗，因为要看的是它和左列多条原理的关系。
 */

type Selection = { kind: 'principle' | 'rule'; id: string } | null;

const NARROW = '(max-width: 820px)';

export function PrinciplesMap() {
  const [sel, setSel] = useState<Selection>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const pickPrinciple = (id: string) => {
    const again = sel?.kind === 'principle' && sel.id === id;
    setSel(again ? null : { kind: 'principle', id });
    // 窄屏上其他原理收起后列表变短，点的若是靠下的原理，视口会落在空白处；滚到组件顶部，让「显示全部」按钮也在眼前
    if (!again && window.matchMedia(NARROW).matches) {
      requestAnimationFrame(() => rootRef.current?.scrollIntoView({ block: 'start' }));
    }
  };

  const litRules = new Set<string>();
  const litPrinciples = new Set<string>();

  if (sel?.kind === 'principle') {
    litPrinciples.add(sel.id);
    for (const r of DERIVED_RULES) if (r.from.includes(sel.id)) litRules.add(r.id);
  } else if (sel?.kind === 'rule') {
    litRules.add(sel.id);
    const rule = DERIVED_RULES.find((r) => r.id === sel.id);
    for (const p of rule?.from ?? []) litPrinciples.add(p);
  }

  const active = sel !== null;
  const byPrinciple = sel?.kind === 'principle';
  const cls = (lit: boolean, isSource: boolean, hide = '') =>
    `map__item ${!active ? '' : isSource ? 'is-source' : lit ? 'is-lit' : hide || 'is-dim'}`;

  const selectedRule = sel?.kind === 'rule' ? DERIVED_RULES.find((r) => r.id === sel.id) : null;
  const selectedPrinciple =
    sel?.kind === 'principle' ? PRINCIPLES.find((p) => p.id === sel.id) : null;

  return (
    <div ref={rootRef}>
      <div className="btn-row">
        <button className="btn btn--sm btn--ghost" onClick={() => setSel(null)} disabled={!active}>
          {byPrinciple ? '显示全部' : '清除高亮'}
        </button>
        <span style={{ alignSelf: 'center', fontSize: '0.86rem', color: 'var(--ink-faint)' }}>
          点原理只看它推出的规则，点规则看它从哪来。
        </span>
      </div>

      <div className="map">
        <div className="map__col">
          <h3>原理</h3>
          {PRINCIPLES.map((p) => (
            <button
              key={p.id}
              className={cls(
                litPrinciples.has(p.id),
                byPrinciple && sel.id === p.id,
                byPrinciple ? 'is-dim is-hidden-narrow' : '',
              )}
              onClick={() => pickPrinciple(p.id)}
              aria-pressed={sel?.kind === 'principle' && sel.id === p.id}
            >
              <strong>
                {p.no}　{p.name}
              </strong>
              <small>
                <Rich>{p.body}</Rich>
              </small>
            </button>
          ))}
        </div>

        <div className="map__col">
          <h3>{selectedPrinciple ? `${selectedPrinciple.name} 推出的规则` : '推出的规则'}</h3>
          {DERIVED_RULES.map((r) => (
            <button
              key={r.id}
              className={cls(
                litRules.has(r.id),
                sel?.kind === 'rule' && sel.id === r.id,
                byPrinciple ? 'is-hidden' : '',
              )}
              onClick={() => setSel({ kind: 'rule', id: r.id })}
              aria-pressed={sel?.kind === 'rule' && sel.id === r.id}
            >
              <strong>{r.name}</strong>
              <small>
                <Rich>{r.note}</Rich>
              </small>
            </button>
          ))}
        </div>
      </div>

      <p className="explain" aria-live="polite">
        {selectedPrinciple && (
          <>
            <Rich>{`**${selectedPrinciple.name}** 推出这 ${DERIVED_RULES.filter((r) => r.from.includes(selectedPrinciple.id)).length} 条规则。`}</Rich>
          </>
        )}
        {selectedRule && (
          <Rich>
            {`**${selectedRule.name}** 来自 ${selectedRule.from
              .map((id) => PRINCIPLES.find((p) => p.id === id)?.name)
              .filter(Boolean)
              .join(' + ')}。${
              selectedRule.from.length > 1
                ? '来自不止一条原理 —— 大多数真正棘手的规则都是这样，所以不要指望能把它们排成一棵树。'
                : ''
            }`}
          </Rich>
        )}
        {!sel && '选一条看看。'}
      </p>
    </div>
  );
}
