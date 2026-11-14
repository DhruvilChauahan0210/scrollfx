'use client';

/**
 * steps-route — how it works, as a route on a map: numbered stops a pen rings
 * in turn, joined by a line that wanders from one to the next and ends on a
 * cross in the accent colour. On a phone the steps stack beside a rail that
 * inks down as you read.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`.
 *
 * The steps are plain text in the server HTML; the route is drawn in the
 * browser. Reduced motion shows it drawn.
 */

import { useEffect, useState, type CSSProperties } from 'react';
import { ScrollAnimate, ScrollDraw } from 'svg-scroll-draw/react';
import { route, scrollWindow, staggerFor } from '@/lib/plotter';

export interface Step {
  title: string;
  body: string;
}

export interface StepsRouteProps {
  eyebrow?: string;
  heading?: string;
  steps?: Step[];
  accent?: string;
  seed?: number;
  className?: string;
}

const DEFAULT_STEPS: Step[] = [
  { title: 'Connect a source', body: 'Point it at your database, your warehouse or an event stream. Read-only, and nothing is copied until you say so.' },
  { title: 'Pick what matters', body: 'Choose the tables and events to watch. Sensible dashboards are drafted for you from what it finds.' },
  { title: 'Share the view', body: 'Invite the team, schedule the reports, and set the alerts that should wake someone up.' },
  { title: 'Decide faster', body: 'Every number on the screen is live, and every one opens into the rows behind it.' },
];

function Heading({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

const W = 1000, H = 140, R = 26;

/** A ring round a stop, drawn as one stroke that overshoots its start a little, as a pen does. */
const ring = (x: number, y: number, r: number) =>
  `M${x + r} ${y}A${r} ${r} 0 1 1 ${x + r * Math.cos(-0.35)} ${y + r * Math.sin(-0.35)}`;

export function StepsRoute({
  eyebrow = 'How it works',
  heading = 'Four stops, *one* line.',
  steps = DEFAULT_STEPS,
  accent = '#e0482a',
  seed = 5,
  className = '',
}: StepsRouteProps) {
  const [legs, setLegs] = useState<string[] | null>(null);
  const n = steps.length;
  const xs = steps.map((_, i) => ((i + 0.5) / n) * W);

  useEffect(() => {
    // Across, for wide screens: from ring to ring, leaving each ring on its
    // edge so the line never crosses a number. Down, for phones.
    const stops = xs.map((x): [number, number] => [x, H / 2]);
    setLegs(stops.slice(0, -1).map(([x, y], i) => route([[x + R + 4, y], [stops[i + 1][0] - R - 4, y]], seed + i, 0.9)));
    // xs follows steps.length, which the dependency covers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, seed]);

  const last = xs[n - 1];

  return (
    <section className={`mx-auto max-w-7xl px-6 py-28 sm:px-10 ${className}`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-6 max-w-3xl font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
        <Heading text={heading} />
      </h2>

      {/* Wide screens: the route runs across above the steps. */}
      <div className="relative mt-20 hidden aspect-[1000/140] md:block">
        {legs && (
          // Ring, leg, ring, leg: the pen travels from stop to stop, reaching
          // the last as the route reaches the middle of the screen.
          <ScrollDraw stagger={staggerFor(2 * n, 1.5)} easing="linear" trigger={scrollWindow(1.5)} className="absolute inset-0" aria-hidden>
            <svg viewBox={`0 0 ${W} ${H}`} className="size-full overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              {xs.flatMap((x, i) => [<path key={`r${i}`} d={ring(x, H / 2, R)} />, legs[i] ? <path key={`l${i}`} d={legs[i]} /> : null])}
              <path d={`M${last - 9} ${H / 2 - 9 - R - 14}L${last + 9} ${H / 2 + 9 - R - 14}M${last + 9} ${H / 2 - 9 - R - 14}L${last - 9} ${H / 2 + 9 - R - 14}`} stroke={accent} strokeWidth="2.2" />
            </svg>
          </ScrollDraw>
        )}
        {xs.map((x, i) => (
          <span key={i} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-2xl" style={{ left: `${(x / W) * 100}%` }}>
            {i + 1}
          </span>
        ))}
      </div>

      <ol className="relative mt-14 grid gap-12 md:mt-10 md:grid-cols-[repeat(var(--steps),minmax(0,1fr))] md:gap-10" style={{ '--steps': n } as CSSProperties}>
        {/* Phones: a hairline rail beside the steps, and the ink that runs down it. */}
        <div aria-hidden className="absolute bottom-2 left-6 top-2 w-px bg-border md:hidden" />
        <ScrollAnimate aria-hidden props={{ transform: ['scaleY(0)', 'scaleY(1)'] }} trigger={{ start: 'top 70%', end: 'bottom 70%' }} easing="linear" className="absolute bottom-2 left-6 top-2 w-px origin-top md:hidden">
          <div className="h-full w-px bg-foreground" />
        </ScrollAnimate>
        {steps.map((s, i) => (
          <li key={s.title} className="relative pl-16 md:pl-0 md:text-center">
            <span className="absolute left-[10px] top-0 grid size-7 place-items-center rounded-full border bg-background font-serif text-base md:hidden">{i + 1}</span>
            <h3 className="font-serif text-[1.7rem] leading-tight tracking-[-0.02em]">{s.title}</h3>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground md:mx-auto md:max-w-[17rem]">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
