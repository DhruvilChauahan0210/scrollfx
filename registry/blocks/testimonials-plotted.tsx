'use client';

/**
 * testimonials-plotted — quotes on sheets, each stamped with a spiral a pen
 * winds from the rim inward as the card arrives. The spiral is seeded from the
 * person's name, so everyone gets a mark of their own, the same every time;
 * their initials sit in its eye.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`. Cards are `bg-card` sheets.
 *
 * The default quotes are samples: pass your own customers' words. The quotes
 * are in the server HTML; the spirals are drawn in the browser, each finishing
 * as its card reaches the middle of the screen. Reduced motion shows them drawn.
 */

import { useEffect, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { scrollWindow, seedOf, spiral } from '@/lib/plotter';

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface TestimonialsPlottedProps {
  eyebrow?: string;
  heading?: string;
  /** A line under the heading, e.g. where the quotes come from. */
  note?: string;
  testimonials?: Testimonial[];
  accent?: string;
  className?: string;
}

const SAMPLES: Testimonial[] = [
  { quote: 'We replaced three dashboards and a weekly spreadsheet with one page. The Monday meeting is twenty minutes shorter.', name: 'Lena Ortiz', role: 'Head of data' },
  { quote: 'The alerts fire before the customer notices, and the chart in the message already explains why.', name: 'Sam Okafor', role: 'Platform engineer' },
  { quote: 'Our analysts stopped exporting to CSV. Every number opens into the rows behind it, so there is nothing to argue about.', name: 'Mira Chen', role: 'Finance lead' },
];

function Heading({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function Medallion({ name, accent, first }: { name: string; accent: string; first: boolean }) {
  const [d, setD] = useState<string | null>(null);
  useEffect(() => setD(spiral(seedOf(name))[0].d), [name]);
  return (
    <div className="relative size-20 shrink-0">
      {d && (
        <ScrollDraw easing="linear" trigger={scrollWindow()} className="absolute inset-0" aria-hidden>
          <svg viewBox="0 0 100 100" className="size-full" fill="none" stroke={first ? accent : 'currentColor'} strokeWidth="0.8" strokeLinecap="round">
            <path d={d} />
          </svg>
        </ScrollDraw>
      )}
      <span className="absolute inset-0 grid place-items-center font-serif text-lg" aria-hidden>{initials(name)}</span>
    </div>
  );
}

export function TestimonialsPlotted({
  eyebrow = 'In their words',
  heading = 'What teams *say*.',
  note = 'Sample quotes: replace them with your customers’ own words.',
  testimonials = SAMPLES,
  accent = '#e0482a',
  className = '',
}: TestimonialsPlottedProps) {
  return (
    <section className={`mx-auto max-w-7xl px-6 py-28 sm:px-10 ${className}`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
        <Heading text={heading} />
      </h2>
      {note && <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{note}</p>}

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <figure key={t.name} className="flex flex-col rounded-[3px] bg-card p-8 shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-24px_rgba(40,30,10,.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05)]">
            <Medallion name={t.name} accent={accent} first={i === 0} />
            <blockquote className="mt-8 flex-1 text-pretty font-serif text-[1.35rem] leading-snug tracking-[-0.01em]">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t.name} · {t.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
