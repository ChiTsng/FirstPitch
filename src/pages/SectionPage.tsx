import { PageBanner } from '../components/PageBanner';
import { Aside, Rich, UL } from '../components/Rich';
import type { Section } from '../content/people';

/**
 * 通用的「小节页面」：活球与死球、人员与换人都用它。
 * 内容来自 src/content/*.ts 里的 Section[]，这里只管排版。
 */

export function SectionPage({
  title,
  lede,
  sections,
  children,
}: {
  title: string;
  lede: string;
  sections: Section[];
  children?: React.ReactNode;
}) {
  return (
    <main className="page" id="main">
      <PageBanner scene={title.includes('人员') ? 3 : 2}>
        <h1>{title}</h1>
        <p className="page__lede">
          <Rich>{lede}</Rich>
        </p>
      </PageBanner>

      {children}

      {sections.map((s) => (
        <section key={s.id} id={s.id} className="section">
          <h2>{s.title}</h2>
          {s.blocks.map((b, i) => {
            switch (b.t) {
              case 'p':
                return (
                  <p key={i}>
                    <Rich>{b.text}</Rich>
                  </p>
                );
              case 'ul':
                return <UL key={i} items={b.items} />;
              case 'aside':
                return <Aside key={i} label={b.label} text={b.text} />;
              case 'table':
                return (
                  <div key={i} className="table-scroll">
                    <table className="data-table">
                      {b.caption && <caption>{b.caption}</caption>}
                      <thead>
                        <tr>
                          {b.head.map((h) => (
                            <th key={h} scope="col">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((row, r) => (
                          <tr key={r}>
                            {row.map((cell, c) => (
                              <td key={c}>
                                <Rich>{cell}</Rich>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
            }
          })}
        </section>
      ))}
    </main>
  );
}
