'use client';

/**
 * plotted-chart — figures beside a chart a pen plots as you scroll: the area
 * under the curve is hatched in, stroke by stroke from left to right, the
 * curve is drawn over it in the accent colour, and the figures count up.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`.
 *
 * The figures and the axis labels are in the server HTML. The drawing is made
 * in the browser from `data`. Reduced motion shows everything drawn.
 */

import { useEffect, useState } from 'react';
import { ScrollCounter, ScrollDraw } from 'svg-scroll-draw/react';
import 'svg-scroll-draw/no-flash.css';
import { curveY, scrollWindow, smooth, staggerFor } from '@/lib/plotter';

export interface Stat {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface PlottedChartProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  /** The series, left to right. */
  data?: { label: string; value: number }[];
  stats?: Stat[];
  caption?: string;
  accent?: string;
  className?: string;
}

const DEFAULT_DATA = [
  { label: 'Jan', value: 1.2 }, { label: 'Feb', value: 1.5 }, { label: 'Mar', value: 1.9 }, { label: 'Apr', value: 1.7 },
  { label: 'May', value: 1.6 }, { label: 'Jun', value: 2.2 }, { label: 'Jul', value: 2.8 }, { label: 'Aug', value: 2.7 },
  { label: 'Sep', value: 3.4 }, { label: 'Oct', value: 3.6 }, { label: 'Nov', value: 4.2 }, { label: 'Dec', value: 4.6 },
];

const DEFAULT_STATS: Stat[] = [
  { value: 4.6, decimals: 1, suffix: 'M', label: 'Events a day, in December' },
  { value: 283, suffix: '%', label: 'Growth over the year' },
  { value: 38, suffix: ' ms', label: 'Median time to the dashboard' },
];

function Heading({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

const W = 1000, H = 420, TOP = 40, BASE = 400, X0 = 10, X1 = 990;

export function PlottedChart({
  eyebrow = 'A year in numbers',
  heading = 'Growth, *plotted*.',
  description = 'Sample figures. Swap in your own series and the chart is drawn from them.',
  data = DEFAULT_DATA,
  stats = DEFAULT_STATS,
  caption = 'Fig. 1 — Events per day, millions',
  accent = '#e0482a',
  className = '',
}: PlottedChartProps) {
  const [drawing, setDrawing] = useState<{ curve: string; hatch: string[] } | null>(null);

  useEffect(() => {
    const max = Math.max(...data.map((d) => d.value)) * 1.08;
    const pts = data.map((d, i): [number, number] => [X0 + (i / (data.length - 1)) * (X1 - X0), BASE - (d.value / max) * (BASE - TOP)]);
    const hatch: string[] = [];
    for (let x = X0 + 3; x < X1; x += 7) hatch.push(`M${x.toFixed(1)} ${BASE}L${x.toFixed(1)} ${(curveY(pts, x) + 6).toFixed(1)}`);
    setDrawing({ curve: smooth(pts), hatch });
  }, [data]);

  // The hatching sweeps left to right and the curve keeps pace with it; both
  // finish as the chart reaches the middle of the screen.
  const SPREAD = 1.2;

  return (
    <section className={`mx-auto max-w-7xl px-6 py-28 sm:px-10 ${className}`}>
      <div className="grid gap-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-20">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
            <Heading text={heading} />
          </h2>
          <p className="mt-6 max-w-sm text-pretty leading-relaxed text-muted-foreground">{description}</p>
          <dl className="mt-12 divide-y border-y">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between gap-6 py-5">
                <dt className="max-w-[12rem] text-sm text-muted-foreground">{s.label}</dt>
                <dd className="font-serif text-4xl tracking-[-0.02em] tabular-nums">
                  {s.prefix}
                  <ScrollCounter to={s.value} decimals={s.decimals ?? 0} trigger={scrollWindow()} />
                  {s.suffix}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="self-end">
          <div className="relative aspect-[1000/420] w-full">
            {drawing ? (
              <>
                <ScrollDraw stagger={staggerFor(drawing.hatch.length, SPREAD)} easing="linear" trigger={scrollWindow(SPREAD)} className="absolute inset-0" aria-hidden>
                  <svg viewBox={`0 0 ${W} ${H}`} className="size-full" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity={0.75}>
                    {drawing.hatch.map((d, i) => <path key={i} d={d} />)}
                  </svg>
                </ScrollDraw>
                <ScrollDraw easing="linear" trigger={scrollWindow()} className="absolute inset-0" aria-hidden>
                  <svg viewBox={`0 0 ${W} ${H}`} className="size-full overflow-visible" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d={drawing.curve} />
                  </svg>
                </ScrollDraw>
              </>
            ) : null}
            <div className="absolute inset-x-0 bottom-[4.5%] border-t border-foreground/60" />
          </div>
          <div className="mt-3 flex justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {data.map((d, i) => <span key={d.label} className={i % 2 ? 'hidden sm:inline' : ''}>{d.label}</span>)}
          </div>
          <figcaption className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
