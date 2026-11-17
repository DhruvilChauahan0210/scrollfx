'use client';

/**
 * stats-plotted — a row of figures that count up, each over a gauge a pen
 * plots tick by tick, clockwise, as the figure arrives: the ticks in ink, a
 * band in the accent colour out to the figure's share of the dial, and a
 * needle pointing at it.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`.
 *
 * The default figures are placeholders: pass your own. The figures are in the
 * server HTML (each counter renders its final number); the gauges are drawn in
 * the browser, each finishing as it reaches the middle of the screen, and each
 * is seeded from its label. Reduced motion shows the final figures and the
 * gauges drawn.
 */

import { useEffect, useState } from 'react';
import { ScrollCounter, ScrollDraw } from 'svg-scroll-draw/react';
import 'svg-scroll-draw/no-flash.css';
import { gauge, scrollWindow, seedOf, staggerFor, type Stroke } from '@/lib/plotter';

export interface Figure {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  /** How far round the gauge the accent band goes, 0 to 1. */
  share?: number;
}

export interface StatsPlottedProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  figures?: Figure[];
  caption?: string;
  accent?: string;
  className?: string;
}

const SAMPLES: Figure[] = [
  { value: 120, suffix: '+', label: 'Sample figure: teams on board', share: 0.6 },
  { value: 99.9, decimals: 1, suffix: '%', label: 'Sample figure: uptime', share: 0.999 },
  { value: 4.8, decimals: 1, suffix: '/5', label: 'Sample figure: average rating', share: 0.96 },
  { value: 36, suffix: ' h', label: 'Sample figure: hours saved a month', share: 0.45 },
];

// The ticks draw one after another over this many trigger ranges (see scrollWindow).
const SPREAD = 0.8;

function Heading({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

function Gauge({ label, share, accent }: { label: string; share: number; accent: string }) {
  const [strokes, setStrokes] = useState<Stroke[] | null>(null);
  useEffect(() => setStrokes(gauge({ seed: seedOf(label), share })), [label, share]);
  if (!strokes) return null;
  return (
    <ScrollDraw stagger={staggerFor(strokes.length, SPREAD)} easing="linear" trigger={scrollWindow(SPREAD)} className="absolute inset-0" aria-hidden>
      <svg viewBox="0 0 100 100" className="size-full" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
        {strokes.map((s, i) => (s.pen ? <path key={i} d={s.d} stroke={accent} strokeWidth="1.3" /> : <path key={i} d={s.d} />))}
      </svg>
    </ScrollDraw>
  );
}

export function StatsPlotted({
  eyebrow = 'In numbers',
  heading = 'The figures, *plotted*.',
  description = 'Placeholder figures: replace them with your own before you ship.',
  figures = SAMPLES,
  caption = 'Fig. — Sample figures, not measurements',
  accent = '#e0482a',
  className = '',
}: StatsPlottedProps) {
  return (
    <section className={`mx-auto max-w-7xl px-6 py-28 sm:px-10 ${className}`}>
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
          <Heading text={heading} />
        </h2>
        {description && <p className="mt-6 max-w-lg text-pretty text-[17px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>

      <ul className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
        {figures.map((s) => (
          <li key={s.label} className="border-t pt-8">
            <div className="relative size-28">
              <Gauge label={s.label} share={s.share ?? 0.7} accent={accent} />
            </div>
            <p className="mt-8 font-serif text-6xl tracking-[-0.03em] tabular-nums">
              {s.prefix}
              <ScrollCounter to={s.value} decimals={s.decimals ?? 0} trigger={scrollWindow()} />
              {s.suffix}
            </p>
            <p className="mt-3 max-w-[16rem] text-pretty text-[15px] leading-relaxed text-muted-foreground">{s.label}</p>
          </li>
        ))}
      </ul>
      {caption && <p className="mt-14 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{caption}</p>}
    </section>
  );
}
