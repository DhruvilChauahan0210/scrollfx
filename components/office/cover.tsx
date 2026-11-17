import Link from 'next/link';
import { COMPONENTS } from '@/lib/components';
import { REV, TOTAL, sheetNo } from '@/lib/office';
import { SITE_URL } from '@/lib/site';
import { SHEETS } from '@/registry/sheets';
import { Frame } from './frame';
import { PENS } from './pens';

const cap = 'drafting block text-[8.5px] tracking-[0.18em] text-muted-foreground';
const cell = 'border-[var(--hair)] px-3 py-2';

/** The symbols a reader meets on the sheets, each drawn as it is drawn there. */
const SYMBOLS: { name: string; says: string; d: string[]; accent?: boolean; dot?: boolean }[] = [
  { name: 'Pen 1, ink', says: 'Axes, outlines, hatching: the ink is your text colour.', d: ['M4 12H60'] },
  { name: 'Pen 2, accent', says: 'The first series, the mark that matters: the `accent` prop.', d: ['M4 12H60'], accent: true },
  { name: 'Callout', says: 'A prop, and the part of the drawing it shapes.', d: ['M4 12H14L50 20', 'M43.2 19.6L50 20L44 16.2Z'] },
  { name: 'Callout to a surface', says: 'A dot where the prop shapes an area, not an edge.', d: ['M4 12H14L50 20'], dot: true },
  { name: 'Dimension', says: 'A size a prop sets, measured off the drawing.', d: ['M6 4V20', 'M58 4V20', 'M6 14H58', 'M3 17L9 11', 'M55 17L61 11'] },
  { name: 'Hatching', says: 'Shade without colour: series told apart by angle and density.', d: ['M8 22L22 4', 'M16 22L30 4', 'M24 22L38 4', 'M32 22L46 4', 'M40 22L54 4'] },
];

const code = (s: string) => s.split(/(`[^`]+`)/g).map((part, i) => (part.startsWith('`') ? <code key={i} className="font-mono text-[11.5px]">{part.slice(1, -1)}</code> : part));

/**
 * Sheet 00: the cover of the set. Its title, what the drawings are and how
 * to read them (a legend of the symbols), the contents (every sheet, as the
 * register lists it) and a title block of its own.
 */
export function Cover() {
  return (
    <Frame id="cover" label={`Cover sheet: Components, a set of drawings, ${TOTAL} sheets`}>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="px-5 pb-10 pt-9 sm:px-8 lg:px-12 lg:pb-14 lg:pt-14">
          <p className="drafting text-muted-foreground">scrollfx · Components · Set of drawings, {TOTAL} sheets</p>
          <h1 className="mt-7 font-serif text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] tracking-[-0.035em]">
            Components,
            <br />
            <em className="italic">drawn to scale.</em>
          </h1>
          <p className="mt-7 max-w-[34rem] text-pretty text-[16px] leading-relaxed text-foreground/80">
            Pen plotters were made to draw engineering drawings, so each component here is a sheet of one, plotted live: the
            component in the middle, its props called out round it, its variants as details in the margin, and its parts in
            the corner. Click a detail and the pen draws it again. Each is installed on its own with the shadcn CLI.
          </p>

          <section className="mt-12 max-w-[36rem]" aria-labelledby="legend">
            <h2 id="legend" className="drafting text-muted-foreground">Legend of symbols</h2>
            <ul className="mt-4 border-t border-[var(--line)]">
              {SYMBOLS.map((s) => (
                <li key={s.name} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-4 border-b border-[var(--hair)] py-2.5 sm:grid-cols-[4.5rem_10rem_minmax(0,1fr)]">
                  <svg aria-hidden viewBox="0 0 64 24" className="h-6 w-16 overflow-visible" fill="none" stroke={s.accent ? PENS[0].color : 'currentColor'} strokeWidth={s.accent ? 1.8 : 0.9} strokeLinecap="round" strokeLinejoin="round">
                    {s.d.map((d) => <path key={d} d={d} />)}
                    {s.dot && <circle cx="50" cy="20" r="1.6" strokeWidth="1.4" />}
                  </svg>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em]">{s.name}</span>
                  <span className="col-span-2 text-[13px] leading-snug text-muted-foreground sm:col-span-1">{code(s.says)}</span>
                </li>
              ))}
              <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-4 border-b border-[var(--hair)] py-2.5 sm:grid-cols-[4.5rem_10rem_minmax(0,1fr)]">
                <span aria-hidden className="relative grid size-[30px] grid-rows-2 place-items-center rounded-full border border-[var(--line)] font-mono leading-none">
                  <span className="self-end pb-[2px] text-[10px]">B</span>
                  <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--line)]" />
                  <span className="self-start pt-[3px] text-[7.5px] opacity-80">03</span>
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Detail</span>
                <span className="col-span-2 text-[13px] leading-snug text-muted-foreground sm:col-span-1">A variant, drawn small: detail B on sheet 03. Click one to draw it on the sheet.</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="flex flex-col border-t border-[var(--line)] lg:border-l lg:border-t-0">
          <section aria-labelledby="contents" className="flex-1">
            <h2 id="contents" className="drafting px-3 pb-1 pt-4 text-muted-foreground">Contents · drawing list</h2>
            <table className="schedule text-[12.5px]">
              <thead>
                <tr>
                  <th scope="col" className="w-12">Sheet</th>
                  <th scope="col">Title</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {COMPONENTS.map((c, i) => (
                  <tr key={c.slug}>
                    <td className="font-mono text-[10.5px] tabular-nums text-muted-foreground">{sheetNo(i + 1)}</td>
                    <td>
                      <Link href={`/components/${c.slug}`} className="hover:underline hover:underline-offset-4">{c.name}</Link>
                      <span className="ml-2 font-mono text-[10.5px] text-muted-foreground">{c.slug}</span>
                    </td>
                    <td className="font-mono text-[10.5px] tracking-[0.12em] text-muted-foreground">{'ABCDEFGHIJ'.slice(0, SHEETS[c.slug]?.details.length ?? 0).split('').join(' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* The set's own title block. */}
          <div className="mt-6 border-t border-[var(--line)] text-[13px]">
            <div className={`${cell} border-b`}>
              <span className={cap}>Install any sheet</span>
              <code className="mt-1.5 block font-mono text-[11px] leading-[1.55]">
                <span className="text-muted-foreground">npx shadcn@latest add</span>
                <br />
                <span className="break-all">{SITE_URL}/r/&lt;drawing no.&gt;.json</span>
              </code>
            </div>
            <div className={`${cell} flex items-end justify-between gap-4 border-b py-3`}>
              <span>
                <span className={cap}>Title</span>
                <span className="mt-1 block font-serif text-[28px] leading-none tracking-[-0.02em]">Components</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 pb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <svg aria-hidden viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="12" cy="12" r="9.5" />
                  <circle cx="12" cy="12" r="6.25" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                scrollfx
              </span>
            </div>
            <dl className="grid grid-cols-[1.35fr_1fr_0.8fr_1fr] font-mono text-[12px]">
              <div className={cell}><dt className={cap}>Dwg no.</dt><dd className="mt-1">set</dd></div>
              <div className={`${cell} border-l`}><dt className={cap}>Sheet</dt><dd className="mt-1 whitespace-nowrap tabular-nums">00/{sheetNo(TOTAL)}</dd></div>
              <div className={`${cell} border-l`}><dt className={cap}>Scale</dt><dd className="mt-1">As shown</dd></div>
              <div className={`${cell} border-l`}><dt className={cap}>Rev</dt><dd className="mt-1 tabular-nums">{REV}</dd></div>
              <div className={`${cell} col-span-3 flex items-baseline gap-2 border-t`}><dt className={cap}>Drawn by</dt><dd>svg-scroll-draw</dd></div>
              <div className={`${cell} flex items-baseline gap-2 border-l border-t`}><dt className="sr-only">Licence</dt><dd className="text-muted-foreground">MIT</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </Frame>
  );
}
