'use client';

/**
 * ink-progress — a value plotted as the reader reaches it: a bar whose fill a
 * pen hatches in from the left and stops at the value, a ring with a band in
 * the accent pen out to it, or an instrument gauge ticked clockwise with a
 * needle on it.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/plotter and lib/ink (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens; figures in `font-serif`.
 *
 * The label and the value are in the server HTML (role="progressbar", with
 * aria-valuenow); the drawing is made in the browser and goes as far as the
 * value. Reduced motion shows it drawn.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ScrollCounter } from 'svg-scroll-draw/react';
import 'svg-scroll-draw/no-flash.css';
import { dial, gauge, hatch, scrollWindow, seedOf, sketchRect, type Stroke } from '@/lib/plotter';
import { useInk, useSize, type InkTrigger } from '@/lib/ink';

export type InkProgressVariant = 'bar' | 'ring' | 'gauge';

export interface InkProgressProps {
  value: number;
  max?: number;
  variant?: InkProgressVariant;
  /** What the value is of, shown with it and read out with it. */
  label?: string;
  /** Show the value as a figure. */
  showValue?: boolean;
  /** Show the figure as a percentage of max (the default), or as the value itself. */
  display?: 'percent' | 'value';
  /** Set before and after the figure; after a percentage, `%` unless you pass one. */
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** The ring's or gauge's width and height, in px. */
  size?: number;
  /** The ink's colour. */
  color?: string;
  /** The accent pen's colour: the fill, the band. */
  accent?: string;
  strokeWidth?: number;
  /** Shapes the strokes; by default taken from the label. */
  seed?: number;
  /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: InkTrigger;
  /** With `view`, the drawing's length in ms. */
  duration?: number;
  className?: string;
}

/** The figure: counted up with the drawing on scroll, plain otherwise. Its final number is in the server HTML either way. */
type FigureProps = Pick<InkProgressProps, 'display' | 'prefix' | 'suffix' | 'decimals'> & { value: number; max: number; trigger: InkTrigger; className: string; style?: CSSProperties };

function Figure({ value, max, display = 'percent', prefix = '', suffix, decimals = 0, trigger, className, style }: FigureProps) {
  const f = display === 'percent' ? { value: (value / max) * 100, prefix, suffix: suffix ?? '%', decimals } : { value, prefix, suffix: suffix ?? '', decimals };
  return (
    <span className={`tabular-nums ${className}`} style={style}>
      {f.prefix}
      {trigger === 'scroll' ? <ScrollCounter to={f.value} decimals={f.decimals ?? 0} trigger={scrollWindow()} /> : f.value.toFixed(f.decimals ?? 0)}
      {f.suffix}
    </span>
  );
}

function Drawing({ strokes, w, h, view, spread, color, accent, strokeWidth, trigger, duration, className = '', style }: { strokes: Stroke[]; w: number; h: number; view?: string; spread: number; color: string; accent: string; strokeWidth: number; trigger: InkTrigger; duration: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<SVGSVGElement>(null);
  useInk(ref, { paths: strokes.length, spread, trigger, duration, version: strokes });
  return (
    <svg ref={ref} data-scroll-draw-pending="" data-ink={trigger} aria-hidden width={w} height={h} viewBox={view ?? `0 0 ${w} ${h}`} className={`block overflow-visible ${className}`} style={style} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {strokes.map((s, i) => <path key={i} d={s.d} stroke={s.pen ? accent : undefined} strokeWidth={s.pen ? strokeWidth * 1.15 : undefined} />)}
    </svg>
  );
}

const BAR_H = 18;

/** The bar's strokes: its outline, a scale under it, the hatching out to the value, and a mark at the value. */
function barStrokes(w: number, share: number, seed: number): Stroke[] {
  const out: Stroke[] = [sketchRect({ w, h: BAR_H, seed, wobble: 0.7, r: 2 })[0]];
  for (let i = 0; i <= 10; i++) {
    const x = 1 + ((w - 2) * i) / 10;
    out.push({ d: `M${x.toFixed(1)} ${BAR_H + 5}L${x.toFixed(1)} ${BAR_H + (i % 5 === 0 ? 11 : 8)}`, pen: 0 });
  }
  const fill = Math.max(0, (w - 6) * share);
  if (fill > 1) {
    // hatch() draws from the box's corner; each of its strokes is `Mx yLx y`, moved in 3 px here.
    const shift = (d: string) => d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => `${(+x + 3).toFixed(1)} ${(+y + 3).toFixed(1)}`);
    for (const h of hatch({ w: fill, h: BAR_H - 6, gap: 3.4, angle: 58 })) out.push({ d: shift(h.d), pen: 1 });
  }
  const x = 3 + fill;
  out.push({ d: `M${x.toFixed(1)} -4L${(x + 0.4).toFixed(1)} ${BAR_H + 4}`, pen: 0 });
  return out;
}

export function InkProgress({
  value,
  max = 100,
  variant = 'bar',
  label,
  showValue = true,
  display = 'percent',
  prefix,
  suffix,
  decimals,
  size = 128,
  color = 'currentColor',
  accent = '#e0482a',
  strokeWidth = 1.1,
  seed,
  trigger = 'scroll',
  duration = 1600,
  className = '',
}: InkProgressProps) {
  const share = Math.max(0, Math.min(1, value / max));
  const s = seed ?? seedOf(label ?? `${variant}`);
  const pen = { color, accent, strokeWidth, trigger, duration };
  const figure = { value, max, display, prefix, suffix, decimals, trigger };
  const aria = { role: 'progressbar', 'aria-valuenow': value, 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-label': label } as const;

  const bar = useRef<HTMLDivElement>(null);
  const barSize = useSize(bar);
  const [round, setRound] = useState<Stroke[] | null>(null);
  useEffect(() => {
    if (variant === 'ring') setRound(dial({ size: 100, seed: s, share }));
    else if (variant === 'gauge') setRound(gauge({ seed: s, size: 100, share }));
  }, [variant, s, share]);

  const strokes = useMemo(() => (variant === 'bar' && barSize && barSize.w > 10 ? barStrokes(barSize.w, share, s) : null), [variant, barSize, share, s]);

  if (variant === 'bar') {
    return (
      <div {...aria} className={`w-full ${className}`}>
        {(label || showValue) && (
          <div className="mb-3 flex items-baseline justify-between gap-4">
            {label && <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>}
            {showValue && <Figure {...figure} className="font-serif text-2xl tracking-[-0.02em]" />}
          </div>
        )}
        <div ref={bar} className="relative h-[30px] w-full">
          {/* The outline and the scale first, then the fill hatched in to the value. */}
          {strokes && <Drawing key={barSize!.w} {...pen} strokes={strokes} w={barSize!.w} h={BAR_H + 12} spread={1} className="absolute inset-0" />}
        </div>
      </div>
    );
  }

  return (
    <div {...aria} className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {round && <Drawing {...pen} strokes={round} w={size} h={size} view="0 0 100 100" spread={variant === 'gauge' ? 0.8 : 0.6} strokeWidth={strokeWidth * (100 / size)} className="absolute inset-0" />}
        {showValue && (
          <Figure
            {...figure}
            className={`absolute inset-x-0 text-center font-serif leading-none tracking-[-0.03em] ${variant === 'gauge' ? 'bottom-[4%]' : 'top-1/2 -translate-y-1/2'}`}
            style={{ fontSize: Math.round(size * (variant === 'gauge' ? 0.2 : 0.24)) }}
          />
        )}
      </div>
      {label && <span className="mt-4 max-w-[16rem] text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>}
    </div>
  );
}
