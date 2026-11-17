'use client';

/**
 * logos-plotted — a logo cloud between two rules a pen draws across the page,
 * each name set beside a simple mark the pen plots line by line as the row
 * arrives: rings, a hatched disc, nested triangles, waves, a ruled square, a
 * burst of rays.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`.
 *
 * The default names are invented: pass your own customers, and swap each
 * cell's mark for their real logo if you have it. Names are in the server
 * HTML; the marks and rules are drawn in the browser, finishing as they reach
 * the middle of the screen. Reduced motion shows them drawn.
 */

import { useEffect, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import 'svg-scroll-draw/no-flash.css';
import { logoMark, scrollWindow, seedOf, sketchLine, staggerFor, type MarkKind, type Stroke } from '@/lib/plotter';

export interface Logo {
  name: string;
  /** The mark drawn beside the name. */
  mark?: MarkKind;
  href?: string;
}

export interface LogosPlottedProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  logos?: Logo[];
  accent?: string;
  className?: string;
}

const SAMPLES: Logo[] = [
  { name: 'Ferrowind', mark: 'rings' },
  { name: 'Quillstone', mark: 'disc' },
  { name: 'Marlow & Pike', mark: 'delta' },
  { name: 'Tessellate', mark: 'grid' },
  { name: 'Brightfold', mark: 'wave' },
  { name: 'Okkara', mark: 'burst' },
];

const MARKS: MarkKind[] = ['rings', 'disc', 'delta', 'grid', 'wave', 'burst'];

// Each mark's lines draw one after another over this many trigger ranges (see scrollWindow).
const SPREAD = 0.6;

function Heading({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

/** A rule across the section, ink then accent, left to right. */
function Rule({ seed, accent }: { seed: number; accent: string }) {
  const [strokes, setStrokes] = useState<Stroke[] | null>(null);
  useEffect(() => setStrokes(sketchLine({ w: 1000, h: 12, seed })), [seed]);
  return (
    <div className="relative h-3 w-full">
      {strokes && (
        <ScrollDraw stagger={0.5} easing="linear" trigger={scrollWindow(0.5)} className="absolute inset-0" aria-hidden>
          <svg viewBox="0 0 1000 12" preserveAspectRatio="none" className="block size-full" fill="none" strokeWidth="1" strokeLinecap="round">
            {strokes.map((s, i) => <path key={i} d={s.d} stroke={s.pen ? accent : 'currentColor'} />)}
          </svg>
        </ScrollDraw>
      )}
    </div>
  );
}

function Mark({ kind, name }: { kind: MarkKind; name: string }) {
  const [strokes, setStrokes] = useState<Stroke[] | null>(null);
  useEffect(() => setStrokes(logoMark(kind, 40, seedOf(name))), [kind, name]);
  return (
    <span className="relative size-9 shrink-0">
      {strokes && (
        <ScrollDraw stagger={staggerFor(strokes.length, SPREAD)} easing="linear" trigger={scrollWindow(SPREAD)} className="absolute inset-0" aria-hidden>
          <svg viewBox="0 0 40 40" className="size-full" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            {strokes.map((s, i) => <path key={i} d={s.d} />)}
          </svg>
        </ScrollDraw>
      )}
    </span>
  );
}

export function LogosPlotted({
  eyebrow = 'In good company',
  heading = 'Used by teams who *read* their numbers.',
  description = 'Invented names: replace them with your customers.',
  logos = SAMPLES,
  accent = '#e0482a',
  className = '',
}: LogosPlottedProps) {
  return (
    <section className={`mx-auto max-w-7xl px-6 py-28 sm:px-10 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-6 font-serif text-[clamp(2rem,3.6vw,3rem)] leading-[1.02] tracking-[-0.025em]">
            <Heading text={heading} />
          </h2>
        </div>
        {description && <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{description}</p>}
      </div>

      <div className="mt-12">
        <Rule seed={11} accent={accent} />
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {logos.map((l, i) => {
            const body = (
              <>
                <Mark kind={l.mark ?? MARKS[i % MARKS.length]} name={l.name} />
                <span className="font-serif text-xl tracking-[-0.015em]">{l.name}</span>
              </>
            );
            return (
              <li key={l.name} className="flex items-center justify-center py-10">
                {l.href ? (
                  <a href={l.href} className="flex items-center gap-3 opacity-80 transition-opacity hover:opacity-100">{body}</a>
                ) : (
                  <span className="flex items-center gap-3 opacity-80">{body}</span>
                )}
              </li>
            );
          })}
        </ul>
        <Rule seed={29} accent={accent} />
      </div>
    </section>
  );
}
