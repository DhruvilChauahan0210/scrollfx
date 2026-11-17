'use client';

/**
 * ink-frame — a border a pen draws round anything: a card, a figure, an
 * image, a quote. `rect` and `rounded` go round twice, ink then accent, never
 * quite on the same line; `double` draws a second, finer frame inside the
 * first; `corner-marks` sets crop marks at the corners, as on a proof.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/plotter and lib/ink (installed with it).
 * Styling: Tailwind CSS. The frame draws on the box's edge: give the box its
 * own padding (and a `bg-card` if it should read as a sheet).
 *
 * What it frames is in the server HTML; the frame is made in the browser at
 * the size it finds, and made again when that changes. Reduced motion shows
 * it drawn.
 */

import { useRef, type ReactNode } from 'react';
import 'svg-scroll-draw/no-flash.css';
import { cropMarks, sketchRect, type Stroke } from '@/lib/plotter';
import { useInk, useSize, type InkTrigger } from '@/lib/ink';

export type InkFrameVariant = 'rect' | 'rounded' | 'double' | 'corner-marks';

export interface InkFrameProps {
  children: ReactNode;
  variant?: InkFrameVariant;
  /** The ink's colour. */
  color?: string;
  /** The accent pen's colour (the second pass, the inner frame). */
  accent?: string;
  strokeWidth?: number;
  seed?: number;
  /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: InkTrigger;
  /** With `view`, the drawing's length in ms. */
  duration?: number;
  className?: string;
}

/** How far the drawing reaches past the box on each side, so strokes on its edge are not cut. */
const BLEED = 10;

type Placed = Stroke & { at: number };

function strokesFor(variant: InkFrameVariant, w: number, h: number, seed: number): Placed[] {
  // Each frame is drawn in its own box, moved `at` px in from the drawing's corner.
  const place = (s: Stroke[], at: number) => s.map((k) => ({ ...k, at }));
  switch (variant) {
    case 'rect':
      return place(sketchRect({ w: w + 4, h: h + 4, seed, wobble: 1.3, r: 3 }), BLEED - 2);
    case 'rounded':
      return place(sketchRect({ w: w + 4, h: h + 4, seed, wobble: 1.3, r: 16 }), BLEED - 2);
    case 'double':
      return [
        ...place(sketchRect({ w: w + 4, h: h + 4, seed, wobble: 1.2, r: 3 }).slice(0, 1), BLEED - 2),
        ...place(sketchRect({ w: w - 10, h: h - 10, seed: seed + 5, wobble: 0.9, r: 2 }).slice(0, 1).map((k) => ({ ...k, pen: 1 as const })), BLEED + 5),
      ];
    case 'corner-marks':
      return place(cropMarks({ w: w + 2 * BLEED, h: h + 2 * BLEED, seed, len: Math.min(22, Math.max(10, Math.min(w, h) * 0.08)), inset: 2 }), 0);
  }
}

export function InkFrame({
  children,
  variant = 'rect',
  color = 'currentColor',
  accent = '#e0482a',
  strokeWidth = 1.1,
  seed = 1,
  trigger = 'scroll',
  duration = 1400,
  className = '',
}: InkFrameProps) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const size = useSize(box);
  const strokes = size ? strokesFor(variant, size.w, size.h, seed) : null;
  const n = strokes?.length ?? 0;
  // The second pass follows the first; crop marks go down one corner after another.
  useInk(svg, { paths: n, spread: n > 1 ? 0.5 : 0, trigger, duration, version: size && `${size.w}x${size.h}` });
  return (
    <div ref={box} className={`relative ${className}`}>
      {children}
      {size && strokes && (
        <svg
          ref={svg}
          key={`${size.w}x${size.h}`}
          data-scroll-draw-pending=""
          data-ink={trigger}
          aria-hidden
          width={size.w + 2 * BLEED}
          height={size.h + 2 * BLEED}
          viewBox={`0 0 ${size.w + 2 * BLEED} ${size.h + 2 * BLEED}`}
          className="pointer-events-none absolute overflow-visible"
          style={{ left: -BLEED, top: -BLEED }}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {strokes.map((s, i) => <path key={i} d={s.d} transform={s.at ? `translate(${s.at} ${s.at})` : undefined} stroke={s.pen ? accent : undefined} strokeWidth={s.pen && variant === 'double' ? strokeWidth * 0.8 : undefined} />)}
        </svg>
      )}
    </div>
  );
}
