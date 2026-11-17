'use client';

/**
 * chart-radar — a radar chart a pen plots as you scroll: the rings and spokes
 * first, then each series' shape hatched in, then its outline, the first in
 * the accent colour, with a dot on every reading.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/chart and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens.
 *
 * The axis names, the legend and a data table for screen readers are in the
 * server HTML; the strokes are made in the browser at the chart's size and
 * finish as the chart reaches the middle of the screen. Reduced motion shows
 * the chart drawn.
 */

import { useMemo } from 'react';
import 'svg-scroll-draw/no-flash.css';
import {
  ACCENT, DataTable, Legend, PHASE, PenLayers, hatchMarks, marker, niceTicks, num, seriesOf, toPath, useSize,
  type ChartConfig, type Datum, type Mark, type Pen, type Pt,
} from '@/lib/chart';

export interface ChartRadarProps {
  /** One object per spoke. */
  data?: Datum[];
  /** The key in each object that names its spoke. */
  index?: string;
  /** The series to draw, by key: a label and, if you like, a colour. Defaults to every number in the first object. */
  config?: ChartConfig;
  /** The value at the outer ring. Defaults to a round number above the largest value. */
  max?: number;
  /** Rings, as polygons (like a web) or circles. */
  grid?: 'polygon' | 'circle';
  /** Show the key. By default, when there is more than one series. */
  legend?: boolean;
  /** The first series' colour. */
  accent?: string;
  /** What the chart shows, for screen readers (it captions the data table). */
  label?: string;
  className?: string;
}

const SAMPLE: Datum[] = [
  { skill: 'Speed', score: 86 }, { skill: 'Range', score: 64 }, { skill: 'Control', score: 92 },
  { skill: 'Stamina', score: 71 }, { skill: 'Accuracy', score: 58 }, { skill: 'Recovery', score: 77 },
];

// The web's radius and where the spoke names sit, as fractions of its square box
// (the names fall in the padding round it).
const R = 0.46, RL = 0.53;

export function ChartRadar({
  data = SAMPLE,
  index = 'skill',
  config,
  max,
  grid = 'polygon',
  legend,
  accent = ACCENT,
  label = 'Radar chart',
  className = '',
}: ChartRadarProps) {
  const series = seriesOf(data, index, config, accent);
  const ticks = niceTicks(0, max ?? Math.max(...data.flatMap((d) => series.map((s) => num(d[s.key])))), 4);
  const top = max ?? ticks[ticks.length - 1];
  const n = data.length;
  const angle = (i: number) => (i / n) * Math.PI * 2;
  const [ref, size] = useSize<HTMLDivElement>();

  const pens = useMemo((): Pen[] | null => {
    if (!size) return null;
    const s = Math.min(size.w, size.h);
    const cx = size.w / 2, cy = size.h / 2, r = s * R;
    const at = (i: number, v: number): Pt => [cx + Math.sin(angle(i)) * r * v, cy - Math.cos(angle(i)) * r * v];
    const rings: Mark[] = ticks.filter((t) => t > 0 && t <= top).map((t) => {
      const k = t / top;
      const pts: Pt[] = grid === 'circle'
        ? Array.from({ length: 97 }, (_, j): Pt => [cx + Math.sin((j / 96) * Math.PI * 2) * r * k, cy - Math.cos((j / 96) * Math.PI * 2) * r * k])
        : [...Array.from({ length: n }, (_, i) => at(i, k)), at(0, k)];
      return { d: toPath(pts), width: k === 1 ? 0.9 : 0.6, opacity: k === 1 ? 0.6 : 0.28 };
    });
    const spokes: Mark[] = data.map((_, i) => ({ d: toPath([[cx, cy], at(i, 1)]), width: 0.6, opacity: 0.35 }));
    const fill: Mark[] = [];
    const outline: Mark[] = [];
    const dots: Mark[] = [];
    series.forEach((ser, k) => {
      const pts = data.map((d, i) => at(i, Math.max(0, num(d[ser.key])) / top));
      fill.push(...hatchMarks(pts, ser.hatch, { opacity: k === 0 ? 0.75 : 0.6, width: 0.9, inset: 3 }));
      outline.push({ d: toPath([...pts, pts[0]]), color: ser.color, width: k === 0 ? 2 : 1.5 });
      pts.forEach(([x, y]) => dots.push({ d: marker(ser.marker, x, y, 2.6), color: ser.color, width: 1.2 }));
    });
    return [
      { marks: [...rings, ...spokes], ...PHASE.axes, spread: 0.8 },
      { marks: fill, ...PHASE.fill, spread: 2.5 },
      { marks: outline, from: PHASE.ink.from, to: 0.6, spread: 0.5 * (outline.length - 1) },
      { marks: dots, from: 0.7, to: PHASE.ink.to, spread: 2 },
    ];
  }, [size, data, index, config, top, grid, accent]);

  return (
    <figure className={`mx-auto w-full max-w-md ${className}`}>
      <DataTable caption={label} head={[index, ...series.map((s) => s.label)]} rows={data.map((d) => [String(d[index]), ...series.map((s) => num(d[s.key]))])} />
      <div aria-hidden>
        <div className="px-16 py-7">
          <div ref={ref} className="relative aspect-square w-full">
            {size && pens ? <PenLayers size={size} pens={pens} /> : null}
            {data.map((d, i) => {
              const sx = Math.sin(angle(i)), sy = -Math.cos(angle(i));
              const tx = sx > 0.3 ? '0%' : sx < -0.3 ? '-100%' : '-50%';
              const ty = sy < -0.6 ? '-100%' : sy > 0.6 ? '0%' : '-50%';
              return (
                <span
                  key={i}
                  className="absolute whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
                  style={{ left: `${(50 + sx * RL * 100).toFixed(2)}%`, top: `${(50 + sy * RL * 100).toFixed(2)}%`, translate: `${tx} ${ty}` }}
                >
                  {String(d[index])}
                </span>
              );
            })}
          </div>
        </div>
        {(legend ?? series.length > 1) && <Legend series={series} kind="hatch" className="mt-2 justify-center" />}
      </div>
    </figure>
  );
}
