import { useState } from 'react';
import { DERIVED_RULES, PRINCIPLES } from '../content/principles';
import { Rich } from './Rich';

/**
 * 原理推导图。左列 5+1 条原理，右列具体规则。
 *
 * 双向的：点原理 → 高亮它推出的所有规则；点规则 → 高亮它来自的原理。
 * 有几条规则同时来自两三条原理（比如内野高飞必死），这一点很重要，
 * 所以刻意没有做成一对多的树。
 */

type Selection = { kind: 'principle' | 'rule'; id: string } | null;

export function PrinciplesMap() {
  const [sel, setSel] = useState<Selection>(null);

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
  const cls = (lit: boolean, isSource: boolean) =>
    `map__item ${!active ? '' : isSource ? 'is-source' : lit ? 'is-lit' : 'is-dim'}`;

  const selectedRule = sel?.kind === 'rule' ? DERIVED_RULES.find((r) => r.id === sel.id) : null;
  const selectedPrinciple =
    sel?.kind === 'principle' ? PRINCIPLES.find((p) => p.id === sel.id) : null;

  return (
    <div>
      <div className="btn-row">
        <button className="btn btn--sm btn--ghost" onClick={() => setSel(null)} disabled={!active}>
          清除高亮
        </button>
        <span style={{ alignSelf: 'center', fontSize: '0.86rem', color: 'var(--ink-faint)' }}>
          点左边看它推出什么，点右边看它从哪来。
        </span>
      </div>

      <div className="map">
        <div className="map__col">
          <h3>原理</h3>
          {PRINCIPLES.map((p) => (
            <button
              key={p.id}
              className={cls(litPrinciples.has(p.id), sel?.kind === 'principle' && sel.id === p.id)}
              onClick={() => setSel({ kind: 'principle', id: p.id })}
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
          <h3>推出的规则</h3>
          {DERIVED_RULES.map((r) => (
            <button
              key={r.id}
              className={cls(litRules.has(r.id), sel?.kind === 'rule' && sel.id === r.id)}
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
            <Rich>{`**${selectedPrinciple.name}** 推出右边高亮的 ${DERIVED_RULES.filter((r) => r.from.includes(selectedPrinciple.id)).length} 条规则。`}</Rich>
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
