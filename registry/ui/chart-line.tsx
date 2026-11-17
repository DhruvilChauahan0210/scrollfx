'use client';

/**
 * chart-line — a line chart a pen plots as you scroll: the gridlines first,
 * then each series left to right (the first in the accent colour), then a
 * marker on every point. One series or several; smooth, straight or stepped.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/chart and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens.
 *
 * The axis labels, the legend and a data table for screen readers are in the
 * server HTML; the strokes are made in the browser at the chart's size and
 * finish as the chart reaches the middle of the screen. Reduced motion shows
 * the chart drawn.
 */

import { useMemo } from 'react';
import 'svg-scroll-draw/no-flash.css';
import {
  ACCENT, DataTable, Legend, PHASE, PenLayers, XLabels, YLabels, curvePath, formatter, gutter, linear, marker, niceTicks, num, seriesOf, toPath, useSize,
  type ChartTrigger, type ChartConfig, type Curve, type Datum, type Mark, type Pen,
} from '@/lib/chart';

export interface ChartLineProps {
  /** One object per point along the x axis. */
  data?: Datum[];
  /** The key in each object that labels its point on the x axis. */
  index?: string;
  /** The series to draw, by key: a label and, if you like, a colour. Defaults to every number in the first object. */
  config?: ChartConfig;
  /** How the pen joins the points. */
  curve?: Curve;
  /** A marker on every point: circles for the first series, then squares, triangles, diamonds, crosses. */
  markers?: boolean;
  /** The plot's height in pixels; it takes the full width. */
  height?: number;
  /** How numbers on the axis are written (Intl.NumberFormat options). */
  format?: Intl.NumberFormatOptions;
  /** Start the y axis at zero, or fit it to the data. */
  zero?: boolean;
  /** Show the key. By default, when there is more than one series. */
  legend?: boolean;
  /** The first series' colour. */
  accent?: string;
  /** What the chart shows, for screen readers (it captions the data table). */
  label?: string;
  /** `scroll`: inked as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: ChartTrigger;
  /** With `view`, how long the chart takes, in ms. */
  duration?: number;
  className?: string;
}

const SAMPLE: Datum[] = [
  { month: 'Jan', visitors: 1240 }, { month: 'Feb', visitors: 1510 }, { month: 'Mar', visitors: 1460 }, { month: 'Apr', visitors: 1980 },
  { month: 'May', visitors: 2350 }, { month: 'Jun', visitors: 2210 }, { month: 'Jul', visitors: 2740 }, { month: 'Aug', visitors: 3120 },
  { month: 'Sep', visitors: 2980 }, { month: 'Oct', visitors: 3540 }, { month: 'Nov', visitors: 3890 }, { month: 'Dec', visitors: 4320 },
];

export function ChartLine({
  data = SAMPLE,
  index = 'month',
  config,
  curve = 'smooth',
  markers,
  height = 240,
  format,
  zero = true,
  legend,
  accent = ACCENT,
  label = 'Line chart',
  trigger = 'scroll',
  duration = 1800,
  className = '',
}: ChartLineProps) {
  const series = seriesOf(data, index, config, accent);
  const values = data.flatMap((d) => series.map((s) => num(d[s.key])));
  const ticks = niceTicks(zero ? Math.min(0, ...values) : Math.min(...values), Math.max(...values), 4);
  const [lo, hi] = [ticks[0], ticks[ticks.length - 1]];
  const fmt = formatter(format);
  const n = data.length;
  const xAt = (i: number) => (n > 1 ? i / (n - 1) : 0.5);
  const showMarkers = markers ?? (series.length > 1 && curve !== 'step');
  const [ref, size] = useSize<HTMLDivElement>();

  const pens = useMemo((): Pen[] | null => {
    if (!size) return null;
    const { w, h } = size;
    const y = linear(lo, hi, h, 0);
    // Gridlines bottom to top; the zero line (the baseline) in full ink.
    const axes: Mark[] = ticks.map((t) => ({ d: toPath([[0, y(t)], [w, y(t)]]), width: t === 0 || t === lo ? 1 : 0.6, opacity: t === 0 || t === lo ? 0.9 : 0.22 }));
    // A short tick under each point on the baseline.
    for (let i = 0; i < n; i++) axes.push({ d: toPath([[xAt(i) * w, h], [xAt(i) * w, h + 5]]), width: 0.8, opacity: 0.6 });
    const lines: Mark[] = series.map((s, k) => ({
      d: curvePath(data.map((d, i) => [xAt(i) * w, y(num(d[s.key]))]), curve),
      color: s.color,
      width: k === 0 ? 2.2 : 1.5,
    }));
    const dots: Mark[] = showMarkers
      ? data.flatMap((d, i) => series.map((s) => ({ d: marker(s.marker, xAt(i) * w, y(num(d[s.key]))), color: s.color, width: 1.3 })))
      : [];
    return [
      { marks: axes, ...PHASE.axes, spread: 0.6 },
      { marks: lines, from: PHASE.ink.from, to: showMarkers ? 0.6 : PHASE.ink.to, spread: 0.5 * (lines.length - 1) },
      { marks: dots, from: 0.74, to: PHASE.ink.to, spread: 2 },
    ];
  }, [size, data, index, config, curve, showMarkers, accent, lo, hi]);

  return (
    <figure className={`w-full ${className}`}>
      <DataTable caption={label} head={[index, ...series.map((s) => s.label)]} rows={data.map((d) => [String(d[index]), ...series.map((s) => num(d[s.key]))])} />
      <div aria-hidden>
        <div className="flex">
          <YLabels ticks={ticks.map((t) => ({ label: fmt(t), at: (t - lo) / (hi - lo) }))} />
          <div ref={ref} data-slot="plot" className="relative min-w-0 flex-1" style={{ height }}>
            {size && pens ? <PenLayers size={size} pens={pens} trigger={trigger} duration={duration} /> : null}
          </div>
        </div>
        <XLabels ticks={data.map((d, i) => ({ label: String(d[index]), at: xAt(i) }))} offset={gutter(ticks.map(fmt))} />
        {(legend ?? series.length > 1) && <Legend series={series} kind="line" className="mt-5" />}
      </div>
    </figure>
  );
}

