'use client';

import { useState, type ReactNode } from 'react';
import { CopyButton } from '@/components/site/copy-button';
import { FRAMEWORK_LABEL, type Framework } from '@/lib/frameworks';
import { EXAMPLES, type Example } from '@/registry/examples';
import { SHEETS } from '@/registry/sheets';
import type { Detail } from '@/registry/sheets/types';
import { DrawingField } from './drawing-field';
import { Frame } from './frame';
import { PENS } from './pens';
import { setFramework, useFramework } from './framework';

const LETTERS = 'ABCDEFGHIJ';

export interface SheetProps {
  slug: string;
  name: string;
  family: string;
  /** This sheet's number and how many are in the set. */
  no: string;
  total: string;
  rev: string;
  /** The install line in each framework the component ships in. */
  installs: Partial<Record<Framework, string>>;
  /** The frameworks it ships in, React first. */
  frameworks: Framework[];
  /** The title is the page's h1 on its own page, an h2 in the set. */
  heading: 'h1' | 'h2';
  /** How the drawing is first made: with the scroll (in the set) or on arrival (on its own page). */
  initial: 'scroll' | 'view';
  /** Server-rendered parts of the sheet. */
  notes: ReactNode;
  /** Per variant (by example name): its own note and its usage. */
  variantNotes: Record<string, ReactNode>;
  schedule: ReactNode;
  /** The source, or a link to it. What differs by framework is marked `data-fw`; the picked one shows. */
  source: ReactNode;
  parts: ReactNode;
}

/**
 * One component as a drawing sheet: the drawing, plotted with its callouts;
 * its variants as details in the margin, drawn small and finished; notes and
 * schedules under it; and the title block in the corner, which holds the
 * sheet's controls (the view shown, the pen loaded, a re-plot) as rows of the
 * block itself.
 */
export function Sheet({ slug, name, family, no, total, rev, installs, frameworks, heading, initial, notes, variantNotes, schedule, source, parts }: SheetProps) {
  const spec = SHEETS[slug];
  const examples = EXAMPLES[slug] ?? [];
  const details: (Detail & { ex: Example })[] = spec.details.flatMap((d) => {
    const ex = examples.find((e) => e.name === d.example);
    return ex ? [{ ...d, ex }] : [];
  });
  const [shown, setShown] = useState(0);
  const [pen, setPen] = useState(0);
  const [plot, setPlot] = useState(0);
  const [mode, setMode] = useState<'scroll' | 'view'>(initial);
  const current = details[shown];
  const accent = PENS[pen].color;
  const replot = (next: Partial<{ shown: number; pen: number }>) => {
    if (next.shown !== undefined) setShown(next.shown);
    if (next.pen !== undefined) setPen(next.pen);
    setMode('view');
    setPlot((p) => p + 1);
  };
  const Title = heading;
  const View = current?.ex.Component;
  // The reader's framework, where this component ships in it; React otherwise.
  const picked = useFramework();
  const fw = frameworks.includes(picked) ? picked : 'react';

  return (
    <Frame id={slug} label={`Sheet ${no} of ${total}: ${name}`} framework={fw}>
      {/* One grid: on a phone the drawing, its details, the title block, then the rest; on a wide sheet
          the drawing and a band of details across, the schedule under them, and the notes beside the
          parts list and the title block in the corner. */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:grid-rows-[auto_auto_auto_1fr_auto]">
        <section aria-label={`${name}, as drawn`} className="order-1 min-w-0 lg:order-none lg:col-span-2 lg:row-start-1">
          {View && (
            <DrawingField callouts={current.callouts ?? []} dimensions={current.dimensions ?? []} mode={mode} version={`${shown}:${pen}:${plot}`} viewClass={spec.view}>
              <div data-example={current.example}>
                <View key={`${shown}:${pen}:${plot}`} accent={accent} trigger={mode} />
              </div>
            </DrawingField>
          )}
        </section>

        <aside aria-label="Details: the variants" className="order-2 min-w-0 border-t border-[var(--line)] lg:order-none lg:col-span-2 lg:row-start-2">
          <div className="flex flex-col gap-3.5 py-5 lg:px-8 lg:py-6">
            <p className="drafting px-4 text-muted-foreground sm:px-6 lg:px-0">
              Details <span className="normal-case tracking-normal">· the variants, drawn small; click one to draw it above</span>
            </p>
            <ul className="flex snap-x scroll-px-4 gap-6 overflow-x-auto px-4 pb-1 sm:scroll-px-6 sm:px-6 lg:flex-wrap lg:gap-x-7 lg:gap-y-7 lg:overflow-visible lg:px-0">
              {details.map((d, i) => (
                <li key={d.example} className="shrink-0 snap-start">
                  <DetailView
                    detail={d}
                    letter={LETTERS[i]}
                    no={no}
                    shape={spec.shape}
                    scale={spec.scale}
                    accent={accent}
                    active={i === shown}
                    onSelect={() => replot({ shown: i })}
                  />
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="order-5 min-w-0 border-t border-[var(--line)] px-4 py-6 sm:px-6 lg:order-none lg:col-span-2 lg:row-start-3 lg:px-8 lg:py-7">{schedule}</div>

        <div className="order-4 min-w-0 border-t border-[var(--line)] px-4 py-6 sm:px-6 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-4 lg:px-8 lg:py-7">
          <p className="drafting text-muted-foreground">Notes</p>
          {notes}
          {details.map((d) => (
            <div key={d.example} hidden={d !== current}>
              {variantNotes[d.example]}
            </div>
          ))}
          {source}
        </div>
        <div className="order-6 border-t border-[var(--line)] lg:order-none lg:col-start-2 lg:row-start-4 lg:border-l">{parts}</div>
        <div className="order-3 border-t border-[var(--line)] lg:order-none lg:col-start-2 lg:row-start-5 lg:border-l">
          <TitleBlock
            Title={Title}
            name={name}
            family={family}
            slug={slug}
            no={no}
            total={total}
            rev={rev}
            install={installs[fw] ?? installs.react ?? ''}
            frameworks={frameworks}
            fw={fw}
            details={details}
            shown={shown}
            pen={pen}
            onShow={(i) => replot({ shown: i })}
            onPen={(i) => replot({ pen: i })}
            onReplot={() => replot({})}
          />
        </div>
      </div>
    </Frame>
  );
}

/** The detail marker of drafting: a circle split across, the detail's letter over the sheet it is on. */
function DetailMark({ letter, no, active }: { letter: string; no: string; active?: boolean }) {
  return (
    <span aria-hidden className={`relative grid size-[30px] shrink-0 grid-rows-2 place-items-center rounded-full border font-mono leading-none ${active ? 'border-foreground bg-foreground text-[var(--paper)]' : 'border-[var(--line)]'}`}>
      <span className="self-end pb-[2px] text-[10px]">{letter}</span>
      <span className={`absolute inset-x-0 top-1/2 h-px ${active ? 'bg-[var(--paper)]' : 'bg-[var(--line)]'}`} />
      <span className="self-start pt-[3px] text-[7.5px] opacity-80">{no}</span>
    </span>
  );
}

function DetailView({ detail, letter, no, shape, scale, accent, active, onSelect }: { detail: Detail & { ex: Example }; letter: string; no: string; shape: 'circle' | 'box'; scale: number; accent: string; active: boolean; onSelect: () => void }) {
  const W = shape === 'circle' ? 164 : 184;
  // The prop is code: it never breaks. Set on one line, a little smaller if it is long (a mono letter is 0.6 em).
  const propSize = Math.min(11, Math.floor((W / (detail.prop.length * 0.6)) * 10) / 10);
  const H = shape === 'circle' ? W : Math.round(W * 0.68);
  const Ex = detail.ex.Component;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Detail ${letter}, ${detail.ex.title}: draw it on the sheet`}
      className="group block text-left outline-none"
      style={{ width: W }}
    >
      <span
        className={`relative block overflow-hidden border transition-colors ${shape === 'circle' ? 'rounded-full' : ''} ${active ? 'border-foreground' : 'border-[var(--hair)] group-hover:border-[var(--line)] group-focus-visible:border-foreground'}`}
        style={{ width: W, height: H }}
      >
        <span aria-hidden inert className="still detail-scaled pointer-events-none" style={{ width: W * scale, height: H * scale, transform: `scale(${1 / scale})`, padding: 20 * scale }}>
          <span className="block w-full">
            <Ex accent={accent} />
          </span>
        </span>
      </span>
      <span className="mt-2.5 flex items-center gap-2.5">
        <DetailMark letter={letter} no={no} active={active} />
        <span className="drafting text-[9px] leading-snug text-muted-foreground">
          Detail {letter}
          <br />
          Scale 1:{scale}
        </span>
      </span>
      <span className="mt-1.5 block whitespace-nowrap font-mono leading-snug text-foreground/90" style={{ fontSize: propSize }}>{detail.prop}</span>
    </button>
  );
}

const cell = 'border-[var(--hair)] px-3 py-2';
const cap = 'drafting block text-[8.5px] tracking-[0.18em] text-muted-foreground';

function TitleBlock({
  Title, name, family, slug, no, total, rev, install, frameworks, fw, details, shown, pen, onShow, onPen, onReplot,
}: {
  Title: 'h1' | 'h2'; name: string; family: string; slug: string; no: string; total: string; rev: string; install: string;
  frameworks: Framework[]; fw: Framework;
  details: (Detail & { ex: Example })[]; shown: number; pen: number;
  onShow: (i: number) => void; onPen: (i: number) => void; onReplot: () => void;
}) {
  const [cmd, url] = [install.slice(0, install.indexOf(' https')), install.slice(install.indexOf('https'))];
  return (
    <div className="text-[13px]">
      {/* View: which detail is drawn, and a re-plot. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-[var(--hair)]">
        <div className={`${cell}`}>
          <span className={cap}>View</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {details.map((d, i) => (
              <button
                key={d.example}
                type="button"
                onClick={() => onShow(i)}
                aria-pressed={i === shown}
                aria-label={`Draw detail ${LETTERS[i]}, ${d.ex.title}`}
                className={`grid size-6 place-items-center border font-mono text-[10.5px] transition-colors ${i === shown ? 'border-foreground bg-foreground text-[var(--paper)]' : 'border-[var(--hair)] hover:border-[var(--line)]'}`}
              >
                {LETTERS[i]}
              </button>
            ))}
            <span className="ml-1.5 truncate font-serif text-[15px] italic">{details[shown]?.ex.title}</span>
          </span>
        </div>
        <button type="button" onClick={onReplot} className={`${cell} group border-l text-left transition-colors hover:bg-foreground/[0.04]`}>
          <span className={cap}>Re-plot</span>
          <span className="mt-1.5 flex h-6 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]">
            <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 transition-transform duration-500 group-hover:-rotate-180" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
              <path d="M13 8a5 5 0 1 1-1.6-3.7" />
              <path d="M11.8 1.8l-.3 2.7 2.7.2" />
            </svg>
            Again
          </span>
        </button>
      </div>

      {/* Pens: 1 is the ink; 2 is the accent, and another can be loaded. */}
      <div className={`${cell} border-b`}>
        <span className={cap}>Pens</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px]">
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground">1</span>
            <span aria-hidden className="h-[2px] w-5 bg-foreground" />
            ink
          </span>
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground">2</span>
            <span role="radiogroup" aria-label="Pen 2, the accent" className="flex items-center gap-1">
              {PENS.map((p, i) => (
                <button
                  key={p.name}
                  type="button"
                  role="radio"
                  aria-checked={i === pen}
                  aria-label={`${p.name} pen`}
                  title={p.name}
                  onClick={() => onPen(i)}
                  className={`grid size-[18px] place-items-center rounded-full border transition-colors ${i === pen ? 'border-foreground' : 'border-transparent hover:border-[var(--line)]'}`}
                >
                  <span className="size-2.5 rounded-full" style={{ background: p.color }} />
                </button>
              ))}
            </span>
            <span>{PENS[pen].name.toLowerCase()}</span>
          </span>
        </span>
      </div>

      {/* Install: in the framework picked (one choice for every sheet), with that framework's CLI. */}
      <div className={`${cell} relative border-b pr-11`}>
        <span className="flex items-center justify-between gap-3">
          <span className={cap}>Install</span>
          {frameworks.length > 1 && (
            <span role="radiogroup" aria-label="Framework" className="-my-1 flex items-center gap-1">
              {frameworks.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={f === fw}
                  onClick={() => setFramework(f)}
                  className={`border px-1.5 py-[3px] font-mono text-[10px] uppercase leading-none tracking-[0.12em] transition-colors ${f === fw ? 'border-foreground bg-foreground text-[var(--paper)]' : 'border-[var(--hair)] text-muted-foreground hover:border-[var(--line)] hover:text-foreground'}`}
                >
                  {FRAMEWORK_LABEL[f]}
                </button>
              ))}
            </span>
          )}
        </span>
        <code className="mt-1.5 block font-mono text-[11px] leading-[1.55]">
          <span className="text-muted-foreground">{cmd}</span>
          <br />
          <span className="break-all">{url}</span>
        </code>
        <CopyButton text={install} className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2" />
      </div>

      {/* The title, and the sheet's numbers. */}
      <div className={`${cell} flex items-end justify-between gap-4 border-b py-3`}>
        <span className="min-w-0">
          <span className={cap}>Title</span>
          <Title className="mt-1 font-serif text-[28px] leading-none tracking-[-0.02em]">{name}</Title>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 pb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <svg aria-hidden viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="12" cy="12" r="9.5" />
            <circle cx="12" cy="12" r="6.25" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          scrollfx · {family}
        </span>
      </div>
      <dl className="grid grid-cols-[1.35fr_1fr_0.8fr_1fr] font-mono text-[12px]">
        <div className={cell}><dt className={cap}>Dwg no.</dt><dd className="mt-1 truncate">{slug}</dd></div>
        <div className={`${cell} border-l`}><dt className={cap}>Sheet</dt><dd className="mt-1 whitespace-nowrap tabular-nums">{no}/{total}</dd></div>
        <div className={`${cell} border-l`}><dt className={cap}>Scale</dt><dd className="mt-1">1:1</dd></div>
        <div className={`${cell} border-l`}><dt className={cap}>Rev</dt><dd className="mt-1 tabular-nums">{rev}</dd></div>
        <div className={`${cell} col-span-3 flex items-baseline gap-2 border-t`}><dt className={cap}>Drawn by</dt><dd>svg-scroll-draw</dd></div>
        <div className={`${cell} flex items-baseline gap-2 border-l border-t`}><dt className="sr-only">Licence</dt><dd className="text-muted-foreground">MIT</dd></div>
      </dl>
    </div>
  );
}
