'use client';

/**
 * chart-bar — a bar chart a pen plots as you scroll: the gridlines first,
 * then each bar hatched in, one after another, then outlined, the first
 * series in the accent colour. Upright or across, one series, grouped side by
 * side, or stacked; each series hatched at its own angle, so they read apart
 * without colour.
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
  ACCENT, DataTable, Legend, PHASE, PenLayers, XLabels, YLabels, formatter, gutter, hatchMarks, linear, niceTicks, num, rect, seriesOf, toPath, useSize,
  type ChartConfig, type Datum, type Mark, type Pen,
} from '@/lib/chart';

export interface ChartBarProps {
  /** One object per bar (or group of bars). */
  data?: Datum[];
  /** The key in each object that labels its bar. */
  index?: string;
  /** The series to draw, by key: a label and, if you like, a colour. Defaults to every number in the first object. */
  config?: ChartConfig;
  /** Upright bars (columns), or bars across with the labels down the left. */
  orientation?: 'vertical' | 'horizontal';
  /** With several series: stack them in one bar, rather than group them side by side. */
  stacked?: boolean;
  /** The plot's height in pixels. Across, it defaults to a row per bar. */
  height?: number;
  /** How numbers on the axis are written (Intl.NumberFormat options). */
  format?: Intl.NumberFormatOptions;
  /** Show the key. By default, when there is more than one series. */
  legend?: boolean;
  /** The first series' colour. */
  accent?: string;
  /** What the chart shows, for screen readers (it captions the data table). */
  label?: string;
  className?: string;
}

const SAMPLE: Datum[] = [
  { month: 'Jan', orders: 186 }, { month: 'Feb', orders: 305 }, { month: 'Mar', orders: 237 },
  { month: 'Apr', orders: 173 }, { month: 'May', orders: 209 }, { month: 'Jun', orders: 264 },
];

export function ChartBar({
  data = SAMPLE,
  index = 'month',
  config,
  orientation = 'vertical',
  stacked = false,
  height,
  format,
  legend,
  accent = ACCENT,
  label = 'Bar chart',
  className = '',
}: ChartBarProps) {
  const series = seriesOf(data, index, config, accent);
  const across = orientation === 'horizontal';
  const totals = data.map((d) => (stacked ? series.reduce((m, s) => m + num(d[s.key]), 0) : Math.max(...series.map((s) => num(d[s.key])))));
  const ticks = niceTicks(Math.min(0, ...totals), Math.max(...totals), across ? 5 : 4);
  const [lo, hi] = [ticks[0], ticks[ticks.length - 1]];
  const fmt = formatter(format);
  const n = data.length;
  const grouped = !stacked && series.length > 1;
  const plotHeight = height ?? (across ? n * (grouped ? 20 * series.length + 18 : 42) : 240);
  const band = (i: number) => (i + 0.5) / n;
  const [ref, size] = useSize<HTMLDivElement>();

  const pens = useMemo((): Pen[] | null => {
    if (!size) return null;
    const { w, h } = size;
    // v runs along the value axis, c across the categories; flip them for bars across.
    const len = across ? w : h;
    const cross = across ? h : w;
    const v = linear(lo, hi, 0, len);
    const pt = (c: number, val: number): [number, number] => (across ? [val, c] : [c, len - val]);
    const axes: Mark[] = ticks.map((t) => {
      const base = t === 0 || t === lo;
      return { d: toPath([pt(0, v(t)), pt(cross, v(t))]), width: base ? 1 : 0.6, opacity: base ? 0.9 : 0.22 };
    });
    const step = cross / n;
    const groupW = step * (grouped ? 0.78 : 0.6);
    const fill: Mark[] = [];
    const outline: Mark[] = [];
    data.forEach((d, i) => {
      const c0 = step * i + (step - groupW) / 2;
      let acc = 0;
      series.forEach((s, k) => {
        const value = num(d[s.key]);
        const gap = grouped ? Math.min(4, (groupW / series.length) * 0.12) : 0;
        const bw = grouped ? groupW / series.length - gap : groupW;
        const c = grouped ? c0 + k * (bw + gap) + gap / 2 : c0;
        const from = stacked ? acc : 0;
        const to = from + value;
        acc = to;
        const [a, b] = [v(Math.min(from, to)), v(Math.max(from, to))];
        if (b - a < 0.5) return;
        const box = across ? rect(a, c, b - a, bw) : rect(c, len - b, bw, b - a);
        fill.push(...hatchMarks(box, s.hatch, { opacity: 0.75, width: 0.9, inset: 2.5, reverse: across }));
        // Up one side, across the end, down the other: the base is the axis (or the bar below).
        outline.push({ d: toPath([pt(c, a), pt(c, b), pt(c + bw, b), pt(c + bw, a)]), color: s.color, width: k === 0 ? 1.8 : 1.4 });
      });
    });
    return [
      { marks: axes, ...PHASE.axes, spread: 0.6 },
      { marks: fill, ...PHASE.fill, spread: 2.5 },
      { marks: outline, ...PHASE.ink, spread: 1.5 },
    ];
  }, [size, data, index, config, stacked, across, accent, lo, hi]);

  const valueTicks = ticks.map((t) => ({ label: fmt(t), at: (t - lo) / (hi - lo) }));
  const categories = data.map((d, i) => ({ label: String(d[index]), at: across ? 1 - band(i) : band(i) }));
  return (
    <figure className={`w-full ${className}`}>
      <DataTable caption={label} head={[index, ...series.map((s) => s.label)]} rows={data.map((d) => [String(d[index]), ...series.map((s) => num(d[s.key]))])} />
      <div aria-hidden>
        <div className="flex">
          <YLabels ticks={across ? categories : valueTicks} />
          <div ref={ref} className="relative min-w-0 flex-1" style={{ height: plotHeight }}>
            {size && pens ? <PenLayers size={size} pens={pens} /> : null}
          </div>
        </div>
        <XLabels ticks={across ? valueTicks : categories} offset={gutter((across ? categories : valueTicks).map((t) => t.label))} />
        {(legend ?? series.length > 1) && <Legend series={series} kind="hatch" className="mt-5" />}
      </div>
    </figure>
  );
}
