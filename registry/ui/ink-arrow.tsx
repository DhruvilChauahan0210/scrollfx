'use client';

/**
 * ink-arrow — an arrow drawn by hand to point at something: nearly straight,
 * curved to one side, or with a loop thrown half way, ending in a head made
 * in one stroke. The pen goes at one speed, shaft first, then the head.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/plotter and lib/ink (installed with it).
 * Styling: Tailwind CSS. Place it with `className` (absolute, in a flex row,
 * beside a note); `from` and `to` set where it starts and ends in its box.
 *
 * The arrow is made in the browser and hidden from assistive tech: say in
 * text what it points at. Reduced motion shows it drawn.
 */

import { useEffect, useRef, useState } from 'react';
import 'svg-scroll-draw/no-flash.css';
import { inkArrow, type ArrowKind, type Stroke } from '@/lib/plotter';
import { useInk, type InkTrigger } from '@/lib/ink';

export type InkArrowVariant = ArrowKind;

export interface InkArrowProps {
  variant?: InkArrowVariant;
  /** The box the arrow is drawn in, in px. */
  width?: number;
  height?: number;
  /** Where the arrow starts, as a share of the box (0 to 1 across, 0 to 1 down). */
  from?: [number, number];
  /** Where its head is, likewise. */
  to?: [number, number];
  /** How far a curved or looped arrow bends to one side, as a share of its length; negative bends it the other way. */
  bend?: number;
  /** The length of the head's barbs, in px. */
  head?: number;
  /** The pen's colour: the accent, unless you pass `currentColor` for ink. */
  accent?: string;
  strokeWidth?: number;
  seed?: number;
  /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: InkTrigger;
  /** With `view`, how long the arrow takes, in ms. */
  duration?: number;
  className?: string;
}

export function InkArrow({
  variant = 'curved',
  width = 160,
  height = 96,
  from = [0.06, 0.3],
  to = [0.92, 0.74],
  bend = 0.3,
  head = 12,
  accent = '#e0482a',
  strokeWidth = 1.6,
  seed = 1,
  trigger = 'scroll',
  duration = 1100,
  className = '',
}: InkArrowProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<Stroke[] | null>(null);
  const [fx, fy] = from, [tx, ty] = to;
  useEffect(() => {
    setStrokes(inkArrow({ w: width, h: height, kind: variant, from: [fx, fy], to: [tx, ty], bend, seed, head }));
  }, [variant, width, height, fx, fy, tx, ty, bend, seed, head]);
  const n = strokes?.length ?? 0;
  // One piece after another: the pen keeps one speed down the shaft and round the head.
  useInk(ref, { paths: n, spread: Math.max(0, n - 1), trigger, duration, version: strokes });
  return (
    <svg
      ref={ref}
      key={strokes ? strokes.length + strokes[0]?.d : 'empty'}
      data-scroll-draw-pending=""
      data-ink={trigger}
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`pointer-events-none shrink-0 overflow-visible ${className}`}
      fill="none"
      stroke={accent}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {strokes?.map((s, i) => <path key={i} d={s.d} />)}
    </svg>
  );
}
