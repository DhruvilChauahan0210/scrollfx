'use client';

/**
 * hero-flow-field — a hero beside a print: a round flow field of several
 * hundred strokes that a pen plots on arrival, top to bottom, in ink and one
 * accent colour. The caption counts the strokes as they land.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The print is a `bg-card` sheet.
 *
 * The drawing is generated in the browser from `seed`, so every visitor sees
 * the same one, and the server HTML stays small. Reduced motion shows it whole.
 */

import { useEffect, useRef, useState } from 'react';
import { scrollDraw } from 'svg-scroll-draw';
import { flowField, type Stroke } from '@/lib/plotter';

export interface HeroFlowFieldProps {
  eyebrow?: string;
  /** One emphasised word between asterisks. */
  heading?: string;
  description?: string;
  primary?: { label: string; href: string };
  /** A command or note shown beside the button. */
  aside?: string;
  caption?: string;
  seed?: number;
  /** The second pen's colour. The first is the text colour. */
  accent?: string;
  /** How long the whole plot takes, in milliseconds. */
  duration?: number;
  className?: string;
}

function Heading({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}
    </>
  );
}

const STROKE_MS = 320;

export function HeroFlowField({
  eyebrow = 'Generative sections for React',
  heading = 'Pages, *plotted* as you read.',
  description = 'Sections whose drawings ink themselves in, stroke by stroke, as the reader arrives and scrolls.',
  primary = { label: 'Get started', href: '#' },
  aside,
  caption = 'Pl. I — Flow field',
  seed = 417,
  accent = '#e0482a',
  duration = 5200,
  className = '',
}: HeroFlowFieldProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setStrokes(flowField({ seed })), [seed]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !strokes.length) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Each stroke draws in STROKE_MS; the offsets spread them over `duration`.
    const stagger = (duration / STROKE_MS - 1) / Math.max(1, strokes.length - 1);
    const draw = scrollDraw(svg, { selector: 'path', autoplay: true, duration: STROKE_MS, stagger, easing: 'ease-out', native: false });
    if (reduce) draw.seek(1);
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = reduce ? 1 : Math.min(1, (performance.now() - start) / duration);
      if (countRef.current) countRef.current.textContent = String(Math.round(t * strokes.length)).padStart(3, '0');
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); draw.destroy(); };
  }, [strokes, duration]);

  return (
    <section className={`relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-10 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:pt-20 ${className}`}>
      <div className="max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-8 font-serif text-[clamp(3rem,6.4vw,6.2rem)] leading-[0.94] tracking-[-0.035em]">
          <Heading text={heading} />
        </h1>
        <p className="mt-8 max-w-md text-pretty text-[17px] leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href={primary.href} className="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-[15px] font-medium text-background transition-transform hover:-translate-y-px">
            {primary.label}
          </a>
          {/* Long commands wrap at their space rather than being cut off. */}
          {aside && <code className="max-w-full rounded-2xl border px-5 py-3 font-mono text-[12.5px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{aside}</code>}
        </div>
      </div>

      {/* The print: a sheet, the drawing, and its plate caption. On a phone it comes first. */}
      <figure className="order-first lg:order-none">
        <div className="aspect-square w-full rounded-[3px] bg-card p-[6%] shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-18px_rgba(40,30,10,.3),0_2px_6px_-2px_rgba(40,30,10,.12)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05),0_24px_60px_-20px_rgba(0,0,0,.8)]">
          <svg ref={svgRef} viewBox="0 0 1000 1000" className="size-full" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="A flow field plotted in ink">
            {strokes.map((s, i) => (s.pen ? <path key={i} d={s.d} stroke={accent} strokeWidth="1.9" /> : <path key={i} d={s.d} />))}
          </svg>
        </div>
        <figcaption className="mt-4 flex items-baseline justify-between gap-4 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>{caption}</span>
          <span>
            <span ref={countRef}>000</span> / {String(strokes.length).padStart(3, '0')} strokes<span className="hidden sm:inline"> · seed {seed}</span>
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
