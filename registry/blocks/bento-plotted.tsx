'use client';

/**
 * bento-plotted — a bento grid of cards in mixed sizes, each with a drawing of
 * its own a pen plots as the card arrives: a moiré of two ring sets, a
 * Lissajous knot, a rosette, ridgelines and a wireframe globe.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`. Cards are `bg-card` sheets.
 *
 * The default cards are samples: pass your own. The first card is the large
 * one; the next two stack beside it and the last two share a row. Copy is in
 * the server HTML; the drawings are made in the browser, each finishing as its
 * card's drawing reaches the middle of the screen. Reduced motion shows them
 * drawn.
 */

import { useEffect, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import 'svg-scroll-draw/no-flash.css';
import { globe, lissajous, moire, ridgelines, rosette, scrollWindow, staggerFor, type Stroke } from '@/lib/plotter';

type Art = 'moire' | 'lissajous' | 'rosette' | 'ridgelines' | 'globe';

export interface BentoCard {
  title: string;
  body: string;
  art?: Art;
}

export interface BentoPlottedProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  cards?: BentoCard[];
  accent?: string;
  className?: string;
}

/** Each drawing with its viewBox and its pen weight, in viewBox units (about a pixel on screen). */
const ART: Record<Art, { box: [number, number]; weight: number; draw: () => Stroke[] }> = {
  moire: { box: [400, 400], weight: 0.6, draw: () => moire({ seed: 5 }) },
  lissajous: { box: [400, 400], weight: 1, draw: () => lissajous(2) },
  rosette: { box: [100, 100], weight: 0.3, draw: () => rosette(14) },
  ridgelines: { box: [600, 220], weight: 1.2, draw: () => ridgelines({ seed: 4, w: 600, h: 220, rows: 12 }) },
  globe: { box: [600, 220], weight: 1.2, draw: () => globe({ w: 600, h: 220, step: 15 }) },
};

const ARTS: Art[] = ['moire', 'lissajous', 'rosette', 'ridgelines', 'globe'];

const SAMPLES: BentoCard[] = [
  { title: 'One place for *everything*.', body: 'Sample copy: the feature you lead with, given the most room. Say what it does in a sentence or two.', art: 'moire' },
  { title: 'Fast by default', body: 'Sample copy: a second feature, in a line.', art: 'lissajous' },
  { title: 'Yours to shape', body: 'Sample copy: a third feature, in a line.', art: 'rosette' },
  { title: 'Built for the long run', body: 'Sample copy: a wider card for a feature that needs a sentence more.', art: 'ridgelines' },
  { title: 'Wherever you work', body: 'Sample copy: the last card, beside it on the same row.', art: 'globe' },
];

// The card spans in a six-column grid on large screens, by position.
const SPANS = ['lg:col-span-4 lg:row-span-2', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-3'];
// Each drawing's strokes are spread over this many trigger ranges (see scrollWindow).
// A drawing of one line (the rosette) has nothing to spread.
const SPREAD = 0.8;
const spreadFor = (paths: number) => (paths > 1 ? SPREAD : 0);

function Title({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

function Drawing({ art, accent }: { art: Art; accent: string }) {
  const [strokes, setStrokes] = useState<Stroke[] | null>(null);
  useEffect(() => setStrokes(ART[art].draw()), [art]);
  const [w, h] = ART[art].box;
  const weight = ART[art].weight;
  if (!strokes) return null;
  return (
    <ScrollDraw stagger={staggerFor(strokes.length, SPREAD)} easing="linear" trigger={scrollWindow(spreadFor(strokes.length))} className="absolute inset-0" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} className="size-full" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
        {strokes.map((s, i) => (s.pen ? <path key={i} d={s.d} stroke={accent} strokeWidth={weight * 1.5} /> : <path key={i} d={s.d} />))}
      </svg>
    </ScrollDraw>
  );
}

export function BentoPlotted({
  eyebrow = 'At a glance',
  heading = 'Everything, *in its place*.',
  description = 'Sample cards: put your own features in them.',
  cards = SAMPLES,
  accent = '#e0482a',
  className = '',
}: BentoPlottedProps) {
  return (
    <section className={`mx-auto max-w-7xl px-6 py-28 sm:px-10 ${className}`}>
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
          <Title text={heading} />
        </h2>
        {description && <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{description}</p>}
      </div>

      <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
        {cards.map((c, i) => {
          const art = c.art ?? ARTS[i % ARTS.length];
          const big = i === 0;
          return (
            <li key={c.title} className={`flex flex-col rounded-[3px] bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-24px_rgba(40,30,10,.3)] sm:p-8 dark:shadow-[0_0_0_1px_rgba(255,255,255,.05)] ${big ? 'sm:col-span-2' : ''} ${SPANS[i] ?? 'lg:col-span-2'}`}>
              <div className={`relative w-full ${big ? 'aspect-square sm:aspect-[16/10] lg:aspect-auto lg:min-h-[22rem] lg:flex-1' : ART[art].box[0] > ART[art].box[1] ? 'aspect-[600/220]' : 'aspect-[4/3]'}`}>
                <Drawing art={art} accent={accent} />
              </div>
              <h3 className={`mt-6 font-serif tracking-[-0.02em] ${big ? 'text-4xl' : 'text-2xl'}`}>
                <Title text={c.title} />
              </h3>
              <p className="mt-2 text-pretty text-[15px] leading-relaxed text-muted-foreground">{c.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
