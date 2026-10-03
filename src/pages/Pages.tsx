import { PageBanner } from '../components/PageBanner';
import { DilemmaPlayer } from '../components/DilemmaPlayer';
import { FieldCanvas } from '../components/field/FieldCanvas';
import { PrinciplesMap } from '../components/PrinciplesMap';
import { QuizCard } from '../components/Quiz';
import { useQuizProgress } from '../hooks/useQuizProgress';
import { RaceTimeline } from '../components/RaceTimeline';
import { Rich } from '../components/Rich';
import { SituationLab } from '../components/SituationLab';
import { PITFALLS, searchTerms, TERMS } from '../content/glossary';
import { LIVE_DEAD_SECTIONS } from '../content/liveDead';
import { PRESET } from '../content/lab';
import { PEOPLE_SECTIONS } from '../content/people';
import { CLOSING, GOAL, PARAMETERS, PRINCIPLES } from '../content/principles';
import { QUIZ } from '../content/quiz';
import { ABS, STORIES, STORIES_REVIEWED, type StorySource } from '../content/stories';
import { TACTICS } from '../content/tactics';
import { TIMING_FACTS } from '../content/timing';
import { useState } from 'react';
import { SectionPage } from './SectionPage';

/* ── 活球与死球 ───────────────────────────────── */

export function LiveDead() {
  return (
    <SectionPage
      title="活球与死球"
      lede="这一节在教学顺序上是后补的，但它其实贯穿全场：前面每一层都在悄悄用它。"
      sections={LIVE_DEAD_SECTIONS}
    />
  );
}

/* ── 人员、打序、换人 ─────────────────────────── */

export function People() {
  return (
    <SectionPage
      title="人员、打序与换人"
      lede="场上有哪些人、谁能换谁、为什么有一条规则是为一个人写的。"
      sections={PEOPLE_SECTIONS}
    >
      <div style={{ maxWidth: '34rem', marginBottom: 'var(--sp-6)' }}>
        <FieldCanvas
          layer="full"
          view="full"
          title="整座球场与 9 个守备位置：1 投手、2 捕手、3 一垒手、4 二垒手、5 三垒手、6 游击手、7 左外野手、8 中外野手、9 右外野手。"
        />
        <p style={{ fontSize: '0.84rem', color: 'var(--ink-faint)' }}>
          把鼠标移到编号上、或者用 Tab 键聚焦，看每个位置的中日英名称。
        </p>
      </div>
    </SectionPage>
  );
}

/* ── 时间尺度 ─────────────────────────────────── */

export function Timing() {
  return (
    <main className="page" id="main">
      <PageBanner scene={4}>
        <h1>时间尺度</h1>
        <p className="page__lede">
          棒球里的「来不来得及」往往差在十分之一秒。把几个常用数字记住，很多战术就能自己验算了。
        </p>
      </PageBanner>

      <section className="section">
        <h2>赛跑计时</h2>
        <p>拖动滑块改变任何一段的用时，看结果怎么翻过来。</p>
        <RaceTimeline />
      </section>

      <section className="section">
        <h2>常用数字</h2>
        <p className="page__lede" style={{ marginTop: 0 }}>
          MLB 水平，都是约数。高中棒球整体更慢，但比例关系仍然成立。
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">项目</th>
                <th scope="col">用时</th>
                <th scope="col">备注</th>
              </tr>
            </thead>
            <tbody>
              {TIMING_FACTS.map((f) => (
                <tr key={f.item}>
                  <td>{f.item}</td>
                  <td style={{ fontFamily: 'var(--font-dot)' }}>{f.value}</td>
                  <td style={{ color: 'var(--ink-faint)' }}>{f.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/* ── 原理总结 ─────────────────────────────────── */

export function Principles() {
  return (
    <main className="page" id="main">
      <PageBanner>
        <h1>原理</h1>
        <p className="page__lede">
          六层讲完之后，全部规则可以收敛成：一个目标 + 五条原理 + 一条元原理 + 几个参数。
        </p>
      </PageBanner>

      <section className="section">
        <h2>{GOAL.title}</h2>
        <p>
          <Rich>{GOAL.body}</Rich>
        </p>
        <p className="pull">
          {GOAL.oneLine}
        </p>
      </section>

      <section className="section">
        <h2>推导图</h2>
        <PrinciplesMap />
      </section>

      <section className="section">
        <h2>参数</h2>
        <p>
          <Rich>
            {'这些是历史**调**出来的数值，不改变结构。把 3 改成 4、把 9 局改成 7 局，棒球还是棒球；把「强迫」或「接杀」拿掉，它就不是了。'}
          </Rich>
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">参数</th>
                <th scope="col">值</th>
                <th scope="col">备注</th>
              </tr>
            </thead>
            <tbody>
              {PARAMETERS.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td style={{ fontFamily: 'var(--font-dot)' }}>{p.value}</td>
                  <td style={{ color: 'var(--ink-faint)' }}>{p.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {CLOSING.map((c, i) => (
          <p key={i}>
            <Rich>{c}</Rich>
          </p>
        ))}
      </section>

      <section className="section">
        <h2>一句话版本</h2>
        {PRINCIPLES.map((p) => (
          <p key={p.id}>
            <strong>
              {p.no}　{p.name}
            </strong>
            <Rich>{p.body}</Rich>
          </p>
        ))}
      </section>
    </main>
  );
}

/* ── 情境模拟器 ───────────────────────────────── */

export function Lab() {
  return (
    <main className="page" id="main">
      <PageBanner>
        <h1>情境模拟器</h1>
        <p className="page__lede">
          摆一个局面，选一种击球结果，看规则把它展开成什么 —— 以及防守方要在哪里做决定。
        </p>
      </PageBanner>

      <section className="section">
        <div className="aside aside--wide">
          <span className="aside__label">预设示例</span>
          <Rich>{PRESET.body}</Rich>
        </div>
        <SituationLab />
      </section>

      <section className="section">
        <h2>两出局满垒 3-2：为什么所有人都要起跑</h2>
        <p className="page__lede" style={{ marginTop: 0 }}>
          棒球里少见的「没有代价的选择」。把每种结果都列一遍就明白了。
        </p>
        <DilemmaPlayer id="count32" />
      </section>

      <section className="section">
        <h2>常见战术</h2>
        <p className="page__lede" style={{ marginTop: 0 }}>
          战术没有免费的。每一条都写清了什么时候用、代价是什么。
        </p>
        {TACTICS.map((t) => (
          <div key={t.id} className="story">
            <h3>{t.name}</h3>
            <p className="story__meta">{t.when}</p>
            {t.body.map((b, i) => (
              <p key={i}>
                <Rich>{b}</Rich>
              </p>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}

/* ── 测验 ─────────────────────────────────────── */

export function QuizPage() {
  const [progress] = useQuizProgress();
  const answered = QUIZ.filter((q) => progress[q.id]).length;
  const correct = QUIZ.filter((q) => progress[q.id] === 'correct').length;

  return (
    <main className="page" id="main">
      <PageBanner scene={1}>
        <h1>测验</h1>
        <p className="page__lede">
          <Rich>
            {'题目全部来自那次教学对话里真实答错过的地方。情境用词是精确的 —— 看到「**直接接住**」就一定是接杀，看到「落地后捡起」就一定不是。'}
          </Rich>
        </p>
        <p className="quiz-progress">
          已作答 {answered} / {QUIZ.length}　答对 {correct}
        </p>
      </PageBanner>

      <section className="section">
        <h2>第一轮</h2>
        {QUIZ.filter((q) => q.id.startsWith('R1')).map((q) => (
          <QuizCard key={q.id} q={q} showLink />
        ))}
      </section>

      <section className="section">
        <h2>第二轮：谁被迫、谁不被迫</h2>
        {QUIZ.filter((q) => q.id.startsWith('R2')).map((q) => (
          <QuizCard key={q.id} q={q} showLink />
        ))}
      </section>
    </main>
  );
}

/* ── 术语表 ───────────────────────────────────── */

export function Glossary() {
  const [query, setQuery] = useState('');
  const results = searchTerms(query);
  const cats = [...new Set(results.map((t) => t.cat))];

  return (
    <main className="page" id="main">
      <PageBanner scene={0}>
        <h1>术语表</h1>
        <p className="page__lede">
          中日英对照，共 {TERMS.length} 条。三种语言任一都能搜。
        </p>
      </PageBanner>

      <section className="section">
        <label htmlFor="glossary-q" className="sr-only">
          搜索术语（中文、日语或英语）
        </label>
        <input
          id="glossary-q"
          className="glossary-search"
          type="search"
          placeholder="搜索：封杀 / フォースアウト / force out"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="quiz-progress" aria-live="polite" style={{ marginTop: 'var(--sp-3)' }}>
          {results.length} 条
        </p>

        {cats.map((cat) => (
          <div key={cat}>
            <h3>{cat}</h3>
            <div className="table-scroll">
              <table className="term-table">
                <thead>
                  <tr>
                    <th scope="col">中文</th>
                    <th scope="col">日本語</th>
                    <th scope="col">English</th>
                  </tr>
                </thead>
                <tbody>
                  {results
                    .filter((t) => t.cat === cat)
                    .map((t) => (
                      <tr key={t.zh + t.en}>
                        <td>{t.zh}</td>
                        <td>{t.ja}</td>
                        <td>{t.en}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section className="section">
        <h2>易错对照</h2>
        {PITFALLS.map((p) => (
          <div key={p.title} className="pitfall">
            <h3>{p.title}</h3>
            <p style={{ marginBottom: 0 }}>
              <Rich>{p.body}</Rich>
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}

/* ── 故事 ─────────────────────────────────────── */

/**
 * 首字下沉只给「实心」的汉字。一二三十 下沉后只剩几道杠（「十」像个加号），
 * 数字和拉丁字母则会把年份、人名、缩写拆开（「1」+「992」、「M」+「LB」）。
 * 开头不合适就不下沉 —— 内容文件随时会加新故事，不能指望每篇都恰好写对。
 */
function dropCapReady(text: string | undefined): boolean {
  const first = (text ?? '').replace(/^(\*\*|\[\[)/, '')[0] ?? '';
  return /[\u4e00-\u9fff]/.test(first) && !'一二三十'.includes(first);
}

function StorySources({ sources }: { sources: StorySource[] }) {
  return <footer className="story-sources"><span>查阅出处</span>{sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a>)}</footer>;
}

export function Stories() {
  return (
    <main className="page" id="main">
      <PageBanner scene={2}>
        <h1>规则背后的故事</h1>
        <p className="page__lede">
          真实比赛中的选择与争议，让规则有了具体的面孔。
        </p>
      </PageBanner>

      <section className="section">
        <p className="story__meta">史实核对 · {STORIES_REVIEWED} · 每篇附查阅出处</p>
        <nav className="story-jumps" aria-label="故事目录">{STORIES.map((s, i) => <a key={s.id} href={`#/stories#${s.id}`}>{String(i + 1).padStart(2, '0')} · {s.title.split('：')[0]}</a>)}</nav>
        {STORIES.map((s) => (
          <article key={s.id} id={s.id} className={`story${dropCapReady(s.paragraphs[0]) ? ' story--drop' : ''}`}>
            <p className="story__meta">{s.meta}</p>
            <h3>{s.title}</h3>
            {s.paragraphs.map((p, i) => (
              <p key={i}>
                <Rich>{p}</Rich>
              </p>
            ))}
            <p className="story__lesson"><Rich>{s.lesson}</Rich></p>
            <StorySources sources={s.sources}/>
          </article>
        ))}
      </section>

      <section className="section" id="abs">
        <h2>{ABS.title}</h2>
        <h3>为什么好球带这么难判</h3>
        {ABS.why.map((w, i) => (
          <p key={i}>
            <Rich>{w}</Rich>
          </p>
        ))}

        <h3>ABS 挑战系统怎么运作</h3>
        <div className="table-scroll">
          <table className="data-table">
            <tbody>
              {ABS.system.map((f) => (
                <tr key={f.label}>
                  <td>{f.label}</td>
                  <td>
                    <Rich>{f.value}</Rich>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>{ABS.snapshotLabel}</h3>
        <div className="table-scroll">
          <table className="data-table">
            <tbody>
              {ABS.results.map((f) => (
                <tr key={f.label}>
                  <td>{f.label}</td>
                  <td style={{ fontFamily: 'var(--font-dot)' }}>{f.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="explain">
          <Rich>{ABS.takeaway}</Rich>
        </p>
        <StorySources sources={ABS.sources}/>
      </section>
    </main>
  );
}
