'use client';

/**
 * ink-signature — a name written out by a pen, stroke by stroke, in writing
 * order and at one steady speed, then underlined with a flourish in the
 * accent pen. The name is set in Hershey's script, a single-stroke
 * handwriting font, so every line is drawn once, as a hand draws it. Or pass
 * your own signature as SVG paths.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/plotter, lib/ink-core and lib/ink (installed with it).
 * Styling: Tailwind CSS. The ink is `currentColor` unless you pass `color`.
 *
 * The name is in the server HTML (as the drawing's accessible name) and the
 * drawing's box is laid out there too, so nothing moves when it is drawn; the
 * strokes are made in the browser. Reduced motion shows the name written.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import 'svg-scroll-draw/no-flash.css';
import { type Stroke } from '@/lib/plotter';
import { signatureLayout, signatureStrokes } from '@/lib/ink-core';
import { useInk, type InkTrigger } from '@/lib/ink';

export interface InkSignatureProps {
  /** The name to write. Letters outside ASCII lose their accents; others are left out. */
  name?: string;
  /** The size of the writing: px to the em. */
  size?: number;
  /** How far the writing leans: x moved right per unit up. */
  slant?: number;
  /** Underline the name with a flourish in the accent pen. */
  flourish?: boolean;
  /**
   * Your own signature instead: SVG path data, one string per stroke, in the
   * order they were written, inside `viewBox`. Each stroke takes one beat.
   */
  paths?: string[];
  /** The box `paths` are drawn in, as an SVG viewBox ("0 0 w h"). */
  viewBox?: string;
  /** The ink's colour. */
  color?: string;
  /** The flourish's colour. */
  accent?: string;
  strokeWidth?: number;
  /** Shapes the flourish. */
  seed?: number;
  /** `scroll`: written as it rises, done at mid-screen. `view`: written once as it comes into view. */
  trigger?: InkTrigger;
  /** With `view`, how long the writing takes, in ms. */
  duration?: number;
  className?: string;
}

export function InkSignature({
  name = 'Ada Marlow',
  size = 56,
  slant = 0.2,
  flourish = true,
  paths,
  viewBox,
  color = 'currentColor',
  accent = '#e0482a',
  strokeWidth = 1.7,
  seed = 1,
  trigger = 'scroll',
  duration = 2600,
  className = '',
}: InkSignatureProps) {
  const ref = useRef<SVGSVGElement>(null);
  // Laid out on the server as well, so the box is the right size from the first paint.
  const { laid, box, w: bw, h: bh } = useMemo(() => signatureLayout({ name, size, slant, strokeWidth, flourish, paths, viewBox }), [name, size, slant, strokeWidth, flourish, paths, viewBox]);

  const [strokes, setStrokes] = useState<Stroke[] | null>(null);
  useEffect(() => {
    // Even pieces, one after another: the pen writes at one speed.
    setStrokes(signatureStrokes({ laid, flourish, size, seed, paths }));
  }, [paths, laid, flourish, size, seed]);

  const n = strokes?.length ?? 0;
  useInk(ref, { paths: n, spread: Math.max(0, n - 1), trigger, duration, version: strokes });

  return (
    <span role="img" aria-label={paths ? `Signature: ${name}` : name} className={`inline-block align-middle ${className}`}>
      <svg
        ref={ref}
        key={strokes ? 'drawn' : 'empty'}
        data-scroll-draw-pending=""
        data-ink={trigger}
        aria-hidden
        width={bw}
        height={bh}
        viewBox={box}
        className="block h-auto max-w-full overflow-visible"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {strokes?.map((s, i) => <path key={i} d={s.d} stroke={s.pen ? accent : undefined} />)}
      </svg>
    </span>
  );
}
