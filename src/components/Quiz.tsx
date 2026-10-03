import { useState } from 'react';
import { QUIZ_BY_ID, type QuizQuestion } from '../content/quiz';
import { withBases } from '../engine';
import { href } from '../hooks/useHashRoute';
import { useQuizProgress } from '../hooks/useQuizProgress';
import { FieldCanvas } from './field/FieldCanvas';
import { runnerMarker } from './field/markers';
import { Rich } from './Rich';

/**
 * 测验。两种题型：
 *   选择题       选完立刻判对错，并给出这个选项错在哪
 *   「先想再看」  没有选项，自己想好再点开答案
 *
 * 进度存在 localStorage 里；存储不可用时照常做题，只是不记录。
 */

export function QuizCard({
  q,
  showField = true,
  showLink = false,
}: {
  q: QuizQuestion;
  showField?: boolean;
  showLink?: boolean;
}) {
  const [progress, setProgress] = useQuizProgress();
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const done = revealed || picked !== null;

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const ok = q.choices![i].correct;
    setProgress((p) => ({ ...p, [q.id]: ok ? 'correct' : 'wrong' }));
  }

  function reveal() {
    setRevealed(true);
    setProgress((p) => ({ ...p, [q.id]: p[q.id] ?? 'revealed' }));
  }

  const bases = withBases(...q.bases);
  const runners = ([1, 2, 3] as const).filter((b) => bases[b]);

  return (
    <article className="quiz-card">
      <span className="quiz-card__id">{q.id}</span>
      <p className="quiz-card__setup">
        {q.setup}
        {progress[q.id] === 'correct' && ' ✓'}
      </p>
      <h3 className="quiz-card__q">
        <Rich>{q.question}</Rich>
      </h3>

      {showField && (
        <div style={{ maxWidth: '20rem', marginBottom: 'var(--sp-4)' }}>
          <FieldCanvas
            layer={3}
            view="infield"
            title={`局面：${q.setup}。${runners.length ? `${runners.join('、')}垒有跑者。` : '垒上无人。'}`}
            markers={runners.map((b) => runnerMarker(b))}
            highlightBases={runners}
          />
        </div>
      )}

      {q.choices ? (
        <div className="choices">
          {q.choices.map((c, i) => {
            const state =
              picked === null
                ? ''
                : c.correct
                  ? 'is-correct'
                  : picked === i
                    ? 'is-wrong'
                    : '';
            return (
              <button
                key={i}
                className={`choice ${state}`}
                onClick={() => choose(i)}
                disabled={picked !== null}
              >
                <span className="choice__mark">{'ABCD'[i]}</span>
                <span>
                  <Rich>{c.text}</Rich>
                  {picked === i && !c.correct && c.why && (
                    <em
                      style={{
                        display: 'block',
                        marginTop: 'var(--sp-2)',
                        color: 'var(--ink-muted)',
                        fontStyle: 'normal',
                        fontSize: '0.9rem',
                      }}
                    >
                      <Rich>{c.why}</Rich>
                    </em>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        !revealed && (
          <button className="btn" onClick={reveal}>
            先自己想一想，然后看答案
          </button>
        )
      )}

      {done && (
        <div className="answer">
          <h4>答案</h4>
          {q.answer.split('\n\n').map((para, i) => (
            <p key={i}>
              <Rich>{para}</Rich>
            </p>
          ))}
          {q.extension && (
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
              <strong>延伸　</strong>
              <Rich>{q.extension}</Rich>
            </p>
          )}
          {showLink && (
            <p style={{ marginBottom: 0 }}>
              <a href={href('/', q.layer)}>回到相关章节 →</a>
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/** 章节末尾的小测验。做对才高亮「下一层」按钮，但不强制，可以跳过。 */
export function LayerQuiz({ ids, nextId, nextTitle }: { ids: string[]; nextId?: string; nextTitle?: string }) {
  const [progress] = useQuizProgress();
  if (ids.length === 0 && !nextId) return null;

  const passed = ids.length === 0 || ids.every((id) => progress[id] === 'correct');

  return (
    <div className="layer-quiz">
      {ids.length > 0 && (
        <>
          <p className="layer-quiz__head">练一题</p>
          {ids.map((id) => {
            const q = QUIZ_BY_ID[id];
            return q ? <QuizCard key={id} q={q} showField={false} /> : null;
          })}
        </>
      )}
      {nextId && (
        <a className={`next-layer ${passed ? 'is-unlocked' : ''}`} href={href('/', nextId)}>
          {passed ? '继续：' : '跳到：'}
          {nextTitle}
          <span aria-hidden="true">→</span>
        </a>
      )}
    </div>
  );
}
