'use client';

/**
 * ink-divider — a rule between sections that a pen draws across the page:
 * straight, wavy, sketchy (ruled twice, ink then accent), dotted, or a pair
 * of rules drawn outward from a label in the middle.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/plotter and lib/ink (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens; it takes the width it is given.
 *
 * The label is in the server HTML; the rules are made in the browser at the
 * width they find, and made again when it changes. Reduced motion shows them
 * drawn.
 */

import { useEffect, useRef, useState } from 'react';
import 'svg-scroll-draw/no-flash.css';
import { inkDots, inkWave, ruledLine, sketchCircle, sketchLine, type Stroke } from '@/lib/plotter';
import { useInk, useSize, type InkTrigger } from '@/lib/ink';

export type InkDividerVariant = 'straight' | 'wavy' | 'sketchy' | 'dotted' | 'with-label';

export interface InkDividerProps {
  variant?: InkDividerVariant;
  /** The words in the middle, for `with-label`. */
  label?: string;
  /** The ink's colour. */
  color?: string;
  /** The accent pen's colour (the sketchy second pass, the label's dots). */
  accent?: string;
  strokeWidth?: number;
  seed?: number;
  /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: InkTrigger;
  /** With `view`, the drawing's length in ms. */
  duration?: number;
  className?: string;
}

const H = 16;

function strokesFor(variant: Exclude<InkDividerVariant, 'with-label'>, w: number, seed: number): Stroke[] {
  switch (variant) {
    case 'straight': return ruledLine({ w, h: H, seed });
    case 'wavy': return inkWave({ w, h: H, seed, period: 34 });
    case 'sketchy': return sketchLine({ w, h: H, seed, wobble: 0.8 });
    case 'dotted': return inkDots({ w, h: H, seed, gap: 8 });
  }
}

/** One rule, drawn across the box it is given. */
function Rule({ make, color, accent, strokeWidth, trigger, duration, spread, dots }: { make: (w: number) => Stroke[]; color: string; accent: string; strokeWidth: number; trigger: InkTrigger; duration: number; spread: (n: number) => number; dots?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const size = useSize(box);
  const strokes = size && size.w > 4 ? make(size.w) : null;
  const n = strokes?.length ?? 0;
  useInk(svg, { paths: n, spread: spread(n), trigger, duration, version: size?.w });
  return (
    <div ref={box} className="relative h-4 min-w-0 flex-1">
      {strokes && (
        <svg ref={svg} key={size!.w} data-scroll-draw-pending="" data-ink={trigger} aria-hidden width={size!.w} height={H} viewBox={`0 0 ${size!.w} ${H}`} className="absolute inset-0 block overflow-visible" fill="none" stroke={color} strokeWidth={dots ? strokeWidth * 1.7 : strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {strokes.map((s, i) => <path key={i} d={s.d} stroke={s.pen ? accent : undefined} />)}
        </svg>
      )}
    </div>
  );
}

export function InkDivider({
  variant = 'straight',
  label = 'Section',
  color = 'currentColor',
  accent = '#e0482a',
  strokeWidth = 1.1,
  seed = 1,
  trigger = 'scroll',
  duration = 1200,
  className = '',
}: InkDividerProps) {
  const pen = { color, accent, strokeWidth, trigger, duration };
  if (variant === 'with-label') {
    // Two rules drawn outward from the label, both at once.
    return (
      <div role="separator" aria-label={label} className={`flex items-center gap-3 ${className}`}>
        <Rule {...pen} make={(w) => ruledLine({ w, h: H, seed, reverse: true })} spread={() => 0} />
        <Dot {...pen} seed={seed + 1} />
        <span className="shrink-0 px-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
        <Dot {...pen} seed={seed + 2} />
        <Rule {...pen} make={(w) => ruledLine({ w, h: H, seed: seed + 3 })} spread={() => 0} />
      </div>
    );
  }
  return (
    <div role="separator" className={`flex ${className}`}>
      <Rule
        {...pen}
        make={(w) => strokesFor(variant, w, seed)}
        // Dots go down one after another, left to right; the sketchy rule's second pass follows the first.
        spread={(n) => (variant === 'dotted' ? 1 : variant === 'sketchy' ? 0.5 : 0) * (n > 1 ? 1 : 0)}
        dots={variant === 'dotted'}
      />
    </div>
  );
}

/** A small ring in the accent pen beside the label. */
function Dot({ accent, strokeWidth, trigger, duration, seed }: { accent: string; strokeWidth: number; trigger: InkTrigger; duration: number; seed: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  useEffect(() => setStrokes(sketchCircle({ size: 10, seed, r: 2.6 })), [seed]);
  useInk(svg, { paths: strokes.length, trigger, duration: duration * 0.4, version: strokes });
  return (
    <svg ref={svg} data-scroll-draw-pending="" data-ink={trigger} aria-hidden width="10" height="10" viewBox="0 0 10 10" className="shrink-0 overflow-visible" fill="none" stroke={accent} strokeWidth={strokeWidth * 1.2} strokeLinecap="round">
      {strokes.map((s, i) => <path key={i} d={s.d} />)}
    </svg>
  );
}
