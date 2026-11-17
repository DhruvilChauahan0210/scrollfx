import type { ReactNode } from 'react';
import { CodeBlock } from '@/components/site/code-block';
import { getComponent } from '@/lib/components';
import { REV, TOTAL, partsList, sheetNo, sheetOf } from '@/lib/office';
import { installCommand } from '@/lib/site';
import { componentApi, componentSource, exampleSources } from '@/lib/source';
import { EXAMPLES } from '@/registry/examples';
import { SHEETS } from '@/registry/sheets';
import { Sheet } from './sheet';

const FAMILY_NOTE: Record<string, string> = {
  Charts:
    'Labels, ticks, the legend and a data table for screen readers are in the server HTML. The strokes are made in the browser at the chart’s measured size, so the hatching keeps its spacing at any width.',
  Ink: 'The words and content it marks stay in the server HTML. The marks are measured to them in the browser, and made again when the layout changes.',
};

function Note({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.6rem_minmax(0,1fr)]">
      <span className="font-mono text-[11px] leading-[1.9] text-muted-foreground">{n}.</span>
      <div className="min-w-0">{children}</div>
    </li>
  );
}

const code = (s: string) => s.split(/(`[^`]+`)/g).map((part, i) => (part.startsWith('`') ? <code key={i} className="font-mono text-[12px]">{part.slice(1, -1)}</code> : part));

/**
 * One component's sheet, assembled on the server: its notes, the usage of
 * each variant, the schedule of its props and its parts list, handed to the
 * sheet with the drawing. The source follows it on the component's own page.
 */
export async function SheetFor({ slug, heading, initial, source }: { slug: string; heading: 'h1' | 'h2'; initial: 'scroll' | 'view'; source: 'fold' | 'link' }) {
  const c = getComponent(slug)!;
  const spec = SHEETS[slug];
  const examples = EXAMPLES[slug] ?? [];
  const usage = exampleSources(slug);
  const { props } = componentApi(slug);
  const parts = partsList(slug);
  const no = sheetNo(sheetOf(slug));
  const general = [
    c.description,
    FAMILY_NOTE[c.family] ?? FAMILY_NOTE.Ink,
    'Tied to the scroll by default: the last stroke lands as the drawing reaches the middle of the screen. With `trigger="view"` it plays once as it comes into view instead. Reduced motion shows it drawn.',
  ];
  const notes = (
    <ol className="mt-3 max-w-[70ch] space-y-2 text-[13.5px] leading-relaxed text-foreground/85">
      {general.map((t, i) => <Note key={i} n={i + 1}>{code(t)}</Note>)}
    </ol>
  );
  const variantNotes: Record<string, ReactNode> = {};
  spec.details.forEach((d, i) => {
    const ex = examples.find((e) => e.name === d.example);
    if (!ex) return;
    const letter = 'ABCDEFGHIJ'[i];
    variantNotes[d.example] = (
      <ol className="mt-2 max-w-[70ch] space-y-2 text-[13.5px] leading-relaxed text-foreground/85">
        <Note n={general.length + 1}>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Detail {letter}, {ex.title}.</span> {code(ex.description ?? '')}
        </Note>
        {usage[d.example] && (
          <Note n={general.length + 2}>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Usage, as drawn:</span>
            <pre className="mt-2 max-h-[22rem] overflow-auto border border-[var(--hair)] px-4 py-3 font-mono text-[11.5px] leading-[1.6] text-foreground/90">{usage[d.example]}</pre>
          </Note>
        )}
      </ol>
    );
  });

  const schedule = (
    <>
      {props.length > 0 && (
        <section>
          <h3 className="drafting text-muted-foreground">Schedule of props</h3>
          <div className="mt-3 overflow-x-auto border border-[var(--line)]">
            <table className="schedule min-w-[640px] text-[12.5px]">
              <thead>
                <tr>
                  <th scope="col" className="w-12">Mark</th>
                  <th scope="col">Prop</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {props.map((p, i) => (
                  <tr key={p.name}>
                    <td className="font-mono text-[10.5px] text-muted-foreground">P{i + 1}</td>
                    <td className="whitespace-nowrap font-mono text-[12px]">{p.name}{p.optional ? '' : <span title="Required" className="text-muted-foreground">*</span>}</td>
                    <td className="font-mono text-[11px] text-muted-foreground">{p.type}</td>
                    <td className="font-mono text-[11px] text-muted-foreground">{p.default ?? '—'}</td>
                    <td className="text-pretty text-[12.5px] leading-snug text-foreground/80">{p.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {props.some((p) => !p.optional) && <p className="mt-2 font-mono text-[10px] text-muted-foreground">* required</p>}
        </section>
      )}
    </>
  );
  const sourceRow = (
    <>
      {source === 'fold' ? (
        <details id="source" className="group mt-8 scroll-mt-24">
          <summary className="drafting flex cursor-pointer list-none items-center gap-3 text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span aria-hidden className="grid size-4 place-items-center border border-[var(--line)] text-[11px] leading-none">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
            View source <span className="normal-case tracking-normal">· components/scrollfx/{slug}.tsx</span>
          </summary>
          <CodeBlock code={componentSource(slug)} className="mt-4" />
        </details>
      ) : (
        <a href={`/components/${slug}#source`} className="drafting group mt-8 inline-flex items-center gap-3 text-muted-foreground hover:text-foreground">
          <span aria-hidden className="grid size-4 place-items-center border border-[var(--line)] text-[11px] leading-none">+</span>
          View source <span className="normal-case tracking-normal">· on sheet {no}</span>
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </a>
      )}
    </>
  );

  const partsTable = (
    <section>
      <h3 className="drafting px-3 pb-1 pt-3 text-muted-foreground">Parts list</h3>
      <table className="schedule text-[12px]">
        <thead>
          <tr>
            <th scope="col" className="w-12">Item</th>
            <th scope="col">Part, as installed</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((p, i) => (
            <tr key={p.path}>
              <td className="font-mono text-[10.5px] text-muted-foreground">{i + 1}</td>
              <td>
                <span className="block break-all font-mono text-[11.5px]">{p.path}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">{p.what}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  return (
    <Sheet
      slug={slug}
      name={c.name}
      family={c.family}
      no={no}
      total={sheetNo(TOTAL)}
      rev={REV}
      install={installCommand(slug)}
      heading={heading}
      initial={initial}
      notes={notes}
      variantNotes={variantNotes}
      schedule={schedule}
      source={sourceRow}
      parts={partsTable}
    />
  );
}
