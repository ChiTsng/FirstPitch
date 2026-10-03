import { useEffect, useRef, useState } from 'react';
import { DILEMMAS } from '../content/dilemmas';
import { usePrefersReducedMotion } from '../hooks/useLocalStorage';
import { Rich } from './Rich';

/**
 * 两难演示：左右两条分支同步推进，一步一步揭开，最后给结论。
 *
 * 之所以左右并排而不是分开讲，是因为「两条路都通向双杀」这件事
 * 只有并排看才成立 —— 分开看每条都像是跑者自己判断失误。
 *
 * 开了「减少动态效果」时不自动播，直接全部展开。
 */

export function DilemmaPlayer({ id }: { id: (typeof DILEMMAS)[number]['id'] }) {
  const dilemma = DILEMMAS.find((d) => d.id === id)!;
  const reduced = usePrefersReducedMotion();
  const maxSteps = Math.max(...dilemma.branches.map((b) => b.steps.length));

  const [step, setStep] = useState(reduced ? maxSteps : 0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!playing) return;
    if (step >= maxSteps) {
      setPlaying(false);
      return;
    }
    timer.current = window.setTimeout(() => setStep((s) => s + 1), 1100);
    return () => window.clearTimeout(timer.current);
  }, [playing, step, maxSteps]);

  const done = step >= maxSteps;

  return (
    <div className="panel">
      <div className="panel__title">{dilemma.title}</div>
      <p className="panel__hint">
        <Rich>{dilemma.setup}</Rich>
      </p>

      <div className="btn-row" style={{ marginTop: 0 }}>
        {!reduced && (
          <button
            className="btn btn--sm btn--accent"
            onClick={() => {
              if (done) setStep(0);
              setPlaying(true);
            }}
            disabled={playing}
          >
            {playing ? '演示中…' : done ? '再看一次' : '开始演示'}
          </button>
        )}
        <button
          className="btn btn--sm"
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.min(maxSteps, s + 1));
          }}
          disabled={done}
        >
          下一步
        </button>
        <button
          className="btn btn--sm btn--ghost"
          onClick={() => {
            setPlaying(false);
            setStep(maxSteps);
          }}
          disabled={done}
        >
          全部展开
        </button>
      </div>

      <div className="dilemma">
        {dilemma.branches.map((branch) => (
          <div key={branch.title} className="dilemma__side">
            <h4>{branch.title}</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>
              <Rich>{branch.choice}</Rich>
            </p>
            <ol className="dilemma__steps">
              {branch.steps.map((s, i) => (
                <li key={i} className={i < step ? 'is-shown' : ''}>
                  <Rich>{s}</Rich>
                </li>
              ))}
            </ol>
            {done && (
              <p
                className="explain"
                style={{
                  borderLeftColor:
                    branch.tone === 'bad'
                      ? 'var(--lamp-out)'
                      : branch.tone === 'good'
                        ? 'var(--lamp-ball)'
                        : 'var(--ink-faint)',
                }}
              >
                <Rich>{branch.outcome}</Rich>
              </p>
            )}
          </div>
        ))}
      </div>

      {done && (
        <div className="verdict" aria-live="polite">
          <p>
            <Rich>{dilemma.verdict}</Rich>
          </p>
        </div>
      )}
    </div>
  );
}
