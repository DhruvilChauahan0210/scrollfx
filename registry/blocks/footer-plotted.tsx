'use client';

/**
 * footer-plotted — a footer under a horizon: ridgelines a pen plots back to
 * front as the footer comes into view, the nearest in the accent colour, with
 * the hidden lines removed. Link columns and a closing line below.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens.
 *
 * A footer is at the bottom of the page and may never reach the middle of the
 * screen, so the horizon plays once when it comes into view instead of
 * following the scroll. The links are plain HTML. Reduced motion shows it drawn.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import 'svg-scroll-draw/no-flash.css';
import { ridgelines, staggerFor, type Stroke } from '@/lib/plotter';

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterPlottedProps {
  /** The name, top left. */
  brand?: ReactNode;
  /** A sentence or two beside the name. */
  note?: ReactNode;
  columns?: FooterColumn[];
  /** The closing line, bottom left. */
  legal?: ReactNode;
  seed?: number;
  accent?: string;
  className?: string;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  { title: 'Product', links: [{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }, { label: 'Changelog', href: '#' }] },
  { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Contact', href: '#' }] },
  { title: 'Resources', links: [{ label: 'Docs', href: '#' }, { label: 'Guides', href: '#' }, { label: 'Status', href: '#' }] },
];

const STROKE_MS = 900;
const TOTAL_MS = 3200;

export function FooterPlotted({
  brand = 'Acme',
  note = 'Dashboards that show the shape of your data, not just its totals.',
  columns = DEFAULT_COLUMNS,
  legal = `© ${new Date().getFullYear()} Acme. All rights reserved.`,
  seed = 9,
  accent = '#e0482a',
  className = '',
}: FooterPlottedProps) {
  const [strokes, setStrokes] = useState<Stroke[] | null>(null);
  useEffect(() => setStrokes(ridgelines({ seed })), [seed]);

  return (
    <footer className={`overflow-hidden border-t ${className}`}>
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        {/* On a phone the full range would be a thin strip: show its middle, larger. */}
        <div className="relative -mx-6 aspect-[3/1] sm:-mx-10 sm:aspect-[1200/260]">
          {strokes && (
            // Plays once on arrival: each ridge in STROKE_MS, back to front, all
            // of them within TOTAL_MS.
            <ScrollDraw autoplay duration={STROKE_MS} stagger={staggerFor(strokes.length, TOTAL_MS / STROKE_MS - 1)} easing="ease-out" className="absolute inset-0" aria-hidden>
              <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" className="size-full" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                {strokes.map((s, i) => <path key={i} d={s.d} stroke={s.pen ? accent : undefined} strokeWidth={s.pen ? 1.6 : undefined} />)}
              </svg>
            </ScrollDraw>
          )}
        </div>

        <div className="grid gap-12 border-t py-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="max-w-sm">
            <p className="font-serif text-3xl tracking-[-0.02em]">{brand}</p>
            {note && <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{note}</p>}
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{col.title}</p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="underline-offset-4 hover:underline">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t py-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{legal}</div>
      </div>
    </footer>
  );
}
