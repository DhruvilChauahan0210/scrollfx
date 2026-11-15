'use client';

/**
 * team-plotted — the people behind the product, each over a fingerprint a pen
 * draws ring by ring, from the core outward, as their card arrives. The print
 * is seeded from the person's name, so everyone has one of their own, the same
 * every time.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`. Cards are `bg-card` sheets.
 *
 * The default people are samples: pass your own team. Names and roles are in
 * the server HTML; the prints are drawn in the browser, each finishing as its
 * card reaches the middle of the screen. Reduced motion shows them drawn.
 */

import { useEffect, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { fingerprint, scrollWindow, seedOf, staggerFor, type Stroke } from '@/lib/plotter';

export interface Person {
  name: string;
  role: string;
  /** A line about them. */
  note?: string;
}

export interface TeamPlottedProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  people?: Person[];
  accent?: string;
  className?: string;
}

const SAMPLES: Person[] = [
  { name: 'Lena Ortiz', role: 'Founder', note: 'Ran data for a logistics company for nine years.' },
  { name: 'Sam Okafor', role: 'Engineering', note: 'Builds the query engine and keeps it fast.' },
  { name: 'Mira Chen', role: 'Design', note: 'Turns tables into pictures people read.' },
  { name: 'Theo Varga', role: 'Customers', note: 'Answers every message within a day.' },
];

// The rings draw one after another over this many trigger ranges (see scrollWindow).
const SPREAD = 0.6;

function Heading({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

function Print({ name, stroke }: { name: string; stroke: string }) {
  const [rings, setRings] = useState<Stroke[] | null>(null);
  useEffect(() => setRings(fingerprint(seedOf(name), 100)), [name]);
  if (!rings) return null;
  return (
    <ScrollDraw stagger={staggerFor(rings.length, SPREAD)} easing="linear" trigger={scrollWindow(SPREAD)} className="absolute inset-0" aria-hidden>
      <svg viewBox="0 0 100 100" className="size-full" fill="none" stroke={stroke} strokeWidth="0.55" strokeLinecap="round">
        {rings.map((r, i) => <path key={i} d={r.d} />)}
      </svg>
    </ScrollDraw>
  );
}

export function TeamPlotted({
  eyebrow = 'The people',
  heading = 'Made by a *small* team.',
  description = 'Sample people: replace them with your own.',
  people = SAMPLES,
  accent = '#e0482a',
  className = '',
}: TeamPlottedProps) {
  return (
    <section className={`mx-auto max-w-7xl px-6 py-28 sm:px-10 ${className}`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
        <Heading text={heading} />
      </h2>
      {description && <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{description}</p>}

      <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {people.map((p, i) => (
          <li key={p.name} className="flex flex-col rounded-[3px] bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-24px_rgba(40,30,10,.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05)]">
            <div className="relative aspect-square w-full">
              <Print name={p.name} stroke={i === 0 ? accent : 'currentColor'} />
            </div>
            <p className="mt-6 font-serif text-2xl tracking-[-0.015em]">{p.name}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{p.role}</p>
            {p.note && <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground">{p.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
