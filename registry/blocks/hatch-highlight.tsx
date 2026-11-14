'use client';

/**
 * hatch-highlight — a large statement whose key phrases a pen hatches over as
 * they are read: diagonal strokes plotted one after another, the way you would
 * mark up a proof.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The statement is set in `font-serif`.
 *
 * Mark a phrase with asterisks: `Most sections *sit still*.` Each mark is
 * measured and hatched to fit, and again when the layout changes. The words
 * are plain text throughout. Reduced motion shows the hatching drawn.
 */

import { useEffect, useRef, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { hatch, type Stroke } from '@/lib/plotter';

export interface HatchHighlightProps {
  eyebrow?: string;
  /** The statement. Phrases between asterisks get hatched. */
  text?: string;
  /** The hatching's colour. */
  accent?: string;
  className?: string;
}

function Mark({ children, accent }: { children: string; accent: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ w: number; h: number; lines: Stroke[] } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.offsetWidth + 12);
      const h = Math.round(el.offsetHeight * 0.62);
      setBox((b) => (b && b.w === w && b.h === h ? b : { w, h, lines: hatch({ w, h, gap: 5, angle: 62 }) }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <span ref={ref} className="relative isolate inline-block whitespace-nowrap">
      {box && (
        // The last stroke lands while the phrase is still in the lower half of
        // the screen: the stagger spreads half a range, the range ends at 75%.
        <ScrollDraw key={`${box.w}x${box.h}`} stagger={0.5 / box.lines.length} easing="linear" trigger={{ start: 'top 92%', end: 'top 75%' }} className="absolute -left-1.5 top-[30%] -z-10" aria-hidden>
          <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" className="block opacity-80">
            {box.lines.map((l, i) => <path key={i} d={l.d} />)}
          </svg>
        </ScrollDraw>
      )}
      {children}
    </span>
  );
}

export function HatchHighlight({
  eyebrow = 'In short',
  text = 'Most sections *sit still*. These are *drawn in* as you read, every line plotted by a pen that keeps pace *with the reader*.',
  accent = '#e0482a',
  className = '',
}: HatchHighlightProps) {
  return (
    <section className={`mx-auto max-w-5xl px-6 py-32 sm:px-10 ${className}`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      {/* A div, not a p: each mark holds the drawing's wrapper div. */}
      <div className="mt-10 text-balance font-serif text-[clamp(2.2rem,4.8vw,4.4rem)] leading-[1.12] tracking-[-0.025em]">
        {text.split(/(\*[^*]+\*)/).map((part, i) =>
          part.startsWith('*') ? <Mark key={i} accent={accent}>{part.slice(1, -1)}</Mark> : <span key={i}>{part}</span>,
        )}
      </div>
    </section>
  );
}
