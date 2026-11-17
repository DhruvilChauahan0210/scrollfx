'use client';

/**
 * sparkline — a tiny line, the size of a word, for tables and stat cards. A
 * pen draws it left to right as it reaches the middle of the screen, over a
 * hatched area if you like, and ends on a dot in the accent colour.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/chart and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. Size it with `className`
 * (h-8 w-28 by default); it sits inline, on the text's baseline.
 *
 * Its label for screen readers is in the server HTML; the strokes are made in
 * the browser at its size. Reduced motion shows it drawn.
 */

import { useMemo } from 'react';
import 'svg-scroll-draw/no-flash.css';
import { ACCENT, PenLayers, circle, curvePath, curvePoints, hatchMarks, linear, useSize, type Curve, type Mark, type Pen, type Pt } from '@/lib/chart';

export interface SparklineProps {
  /** The values, left to right. */
  data?: number[];
  /** A line alone, or a line over a hatched area. */
  variant?: 'line' | 'area';
  /** How the pen joins the points. */
  curve?: Curve;
  /** A dot on the last value. */
  dot?: boolean;
  /** The line's colour; the hatching is in the ink. */
  color?: string;
  /** What it shows, for screen readers. Defaults to the first and last values. */
  label?: string;
  className?: string;
}

const SAMPLE = [12, 14, 13, 17, 16, 21, 19, 24, 23, 28, 27, 31];

export function Sparkline({ data = SAMPLE, variant = 'line', curve = 'smooth', dot = true, color = ACCENT, label, className = 'h-8 w-28' }: SparklineProps) {
  const [ref, size] = useSize<HTMLSpanElement>();
  const lo = Math.min(...data), hi = Math.max(...data);

  const pens = useMemo((): Pen[] | null => {
    if (!size || data.length < 2) return null;
    const { w, h } = size;
    // Room for the pen's width and the end dot, so nothing is clipped.
    const pad = dot ? 4 : 2;
    const y = linear(lo, hi === lo ? lo + 1 : hi, h - 2, 2);
    const pts: Pt[] = data.map((v, i) => [pad / 2 + (i / (data.length - 1)) * (w - pad * 1.5), y(v)]);
    const fill: Mark[] = variant === 'area'
      ? hatchMarks([...curvePoints(pts, curve), [pts[pts.length - 1][0], h], [pts[0][0], h]], { angle: 90, gap: 3 }, { opacity: 0.55, width: 0.8, inset: 1.6 })
      : [];
    const [ex, ey] = pts[pts.length - 1];
    return [
      { marks: fill, from: 1.05, to: 0.7, spread: 2 },
      { marks: [{ d: curvePath(pts, curve), color, width: 1.6 }], from: 0.82, to: dot ? 0.56 : 0.5 },
      // The end dot: two turns of the pen, so it reads solid.
      { marks: dot ? [{ d: circle(ex, ey, 2.3), color, width: 1.5 }, { d: circle(ex, ey, 0.9), color, width: 1.6 }] : [], from: 0.6, to: 0.5, spread: 0.5 },
    ];
  }, [size, data, variant, curve, dot, color, lo, hi]);

  return (
    <span
      ref={ref}
      role="img"
      aria-label={label ?? `Trend from ${data[0]} to ${data[data.length - 1]}, ${data.length} values`}
      className={`relative inline-block align-middle ${className}`}
    >
      {size && pens ? <PenLayers size={size} pens={pens} /> : null}
    </span>
  );
}
