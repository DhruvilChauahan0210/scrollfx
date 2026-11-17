'use client';

/**
 * ink-signature — a name written out by a pen, stroke by stroke, in writing
 * order and at one steady speed, then underlined with a flourish in the
 * accent pen. The name is set in Hershey's script, a single-stroke
 * handwriting font, so every line is drawn once, as a hand draws it. Or pass
 * your own signature as SVG paths.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/plotter and lib/ink (installed with it).
 * Styling: Tailwind CSS. The ink is `currentColor` unless you pass `color`.
 *
 * The name is in the server HTML (as the drawing's accessible name) and the
 * drawing's box is laid out there too, so nothing moves when it is drawn; the
 * strokes are made in the browser. Reduced motion shows the name written.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import 'svg-scroll-draw/no-flash.css';
import { paced, random, type Line, type Point, type Stroke } from '@/lib/plotter';
import { script, useInk, type InkTrigger } from '@/lib/ink';

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

/** A swash under the writing: in from below the first letters, a long shallow curve, and a lift at the end. */
function swash(w: number, baseline: number, size: number, seed: number): Point[] {
  const rand = random(seed);
  const x0 = w * (0.04 + rand() * 0.06), x1 = w * (0.97 + rand() * 0.02);
  const y = baseline + size * 0.16;
  const sag = size * (0.07 + rand() * 0.05);
  const pts: Point[] = [];
  const n = Math.max(30, Math.round((x1 - x0) / 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // Down into the stroke, a long sag, then up and away at the end.
    pts.push([x0 + (x1 - x0) * t, y + sag * Math.sin(Math.PI * t * 0.92) - size * 0.12 * t ** 6 + (1 - t) ** 8 * -size * 0.06]);
  }
  return pts;
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
  const laid = useMemo(() => script(name, { size, slant, pad: Math.ceil(strokeWidth * 2) }), [name, size, slant, strokeWidth]);
  const extra = flourish && !paths ? Math.round(size * 0.32) : 0;
  const box = paths ? viewBox ?? '0 0 300 120' : `0 0 ${laid.w} ${laid.h + extra}`;
  const [, , bw, bh] = box.split(/[\s,]+/).map(Number);

  const [strokes, setStrokes] = useState<Stroke[] | null>(null);
  useEffect(() => {
    if (paths) return setStrokes(paths.map((d) => ({ d, pen: 0 })));
    // Even pieces, one after another: the pen writes at one speed.
    const lines: Line[] = laid.lines.map((pts) => ({ pts, pen: 0 }));
    if (flourish) lines.push({ pts: swash(laid.w, laid.baseline, size, seed), pen: 1 });
    setStrokes(paced(lines, Math.max(4, size / 9)));
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
