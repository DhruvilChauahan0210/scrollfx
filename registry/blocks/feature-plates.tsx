'use client';

/**
 * feature-plates — features, each beside a plate a pen draws as you reach it:
 * a topographic map, a wireframe globe, a tunnel of turning squares. Copy on
 * one side, the print on the other, alternating.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. Titles take one emphasised word
 * between asterisks, set in `font-serif`. The prints are `bg-card` sheets.
 *
 * Drawings are made in the browser; the copy is in the server HTML. Pass
 * `art` per feature to choose the drawing. Reduced motion shows them drawn.
 */

import { useEffect, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { contours, globe, tunnel, type Stroke } from '@/lib/plotter';

type Art = 'contours' | 'globe' | 'tunnel';

export interface PlateFeature {
  title: string;
  body: string;
  art?: Art;
  caption?: string;
}

export interface FeaturePlatesProps {
  eyebrow?: string;
  heading?: string;
  features?: PlateFeature[];
  accent?: string;
  className?: string;
}

const ART: Record<Art, () => Stroke[]> = {
  contours: () => contours({ seed: 11 }),
  globe: () => globe({}),
  tunnel: () => tunnel({}),
};

const DEFAULT_FEATURES: PlateFeature[] = [
  { title: 'Every number, *mapped*.', body: 'Dashboards that show the shape of your data, not just its totals. Drill from a year to a minute without losing your place.', art: 'contours', caption: 'Fig. 2 — Contours' },
  { title: 'Data from *everywhere*.', body: 'Events arrive from forty regions and land on one screen in under a second, already joined, already clean.', art: 'globe', caption: 'Fig. 3 — Meridians' },
  { title: 'Go as *deep* as you like.', body: 'Every chart opens into the rows behind it. Every row opens into the event that made it. Nothing is summarised away.', art: 'tunnel', caption: 'Fig. 4 — Tunnel' },
];

function Title({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

function Plate({ art, accent }: { art: Art; accent: string }) {
  const [strokes, setStrokes] = useState<Stroke[] | null>(null);
  useEffect(() => setStrokes(ART[art]()), [art]);
  return (
    <div className="aspect-[4/3] w-full rounded-[3px] bg-card p-[7%] shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-20px_rgba(40,30,10,.28)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05),0_24px_60px_-24px_rgba(0,0,0,.8)]">
      {strokes && (
        // Each stroke draws across the whole trigger and the stagger spreads
        // their starts over 0.6 of it more, so the last lands as the plate's
        // top reaches the middle of the screen, with all of it in view.
        <ScrollDraw stagger={0.6 / strokes.length} easing="ease-out" trigger={{ start: 'top 95%', end: 'top 67%' }} className="size-full" aria-hidden>
          <svg viewBox="0 0 400 300" className="size-full" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
            {strokes.map((s, i) => (s.pen ? <path key={i} d={s.d} stroke={accent} strokeWidth="1.4" /> : <path key={i} d={s.d} />))}
          </svg>
        </ScrollDraw>
      )}
    </div>
  );
}

export function FeaturePlates({
  eyebrow = 'Features',
  heading = 'Drawn from the data up.',
  features = DEFAULT_FEATURES,
  accent = '#e0482a',
  className = '',
}: FeaturePlatesProps) {
  const arts: Art[] = ['contours', 'globe', 'tunnel'];
  return (
    <section className={`mx-auto max-w-7xl px-6 py-28 sm:px-10 ${className}`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-6 max-w-3xl font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">{heading}</h2>

      <div className="mt-24 space-y-28 sm:space-y-40">
        {features.map((ft, i) => (
          <div key={ft.title} className="grid items-center gap-10 md:grid-cols-2 md:gap-20">
            <div className={i % 2 ? 'md:order-2' : ''}>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-5 text-balance font-serif text-[clamp(2rem,3.4vw,3rem)] leading-[1.02] tracking-[-0.025em]">
                <Title text={ft.title} />
              </h3>
              <p className="mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-muted-foreground">{ft.body}</p>
            </div>
            <figure>
              <Plate art={ft.art ?? arts[i % arts.length]} accent={accent} />
              {ft.caption && <figcaption className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{ft.caption}</figcaption>}
            </figure>
          </div>
        ))}
      </div>
    </section>
  );
}
