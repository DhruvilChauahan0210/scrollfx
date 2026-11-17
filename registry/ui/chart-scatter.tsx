'use client';

/**
 * chart-scatter — a scatter chart a pen plots as you scroll: the axes and
 * grid first, then every point as a small mark, left to right (circles in the
 * accent for the first group, then squares, triangles, diamonds and crosses in
 * ink), then, if you ask for it, a fitted trend line through each group (in
 * ink, for a single group).
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
  ACCENT, DataTable, Legend, PHASE, PenLayers, XLabels, YLabels, formatter, gutter, linear, marker, niceTicks, num, seriesOf, toPath, useSize,
  type ChartTrigger, type ChartConfig, type Datum, type Mark, type Pen,
} from '@/lib/chart';

export interface ChartScatterProps {
  /** One object per point. */
  data?: Datum[];
  /** The key holding each point's x value. */
  x?: string;
  /** The key holding each point's y value. */
  y?: string;
  /** The key that puts each point in a group (a series). Leave it out for one group. */
  group?: string;
  /** Labels (and colours, if you like) for the groups, by group name. */
  config?: ChartConfig;
  /** What the x axis measures, written under it. */
  xLabel?: string;
  /** What the y axis measures, written above it. */
  yLabel?: string;
  /** A least-squares line through each group, drawn last. */
  trend?: boolean;
  /** The plot's height in pixels; it takes the full width. */
  height?: number;
  /** How numbers on the axes are written (Intl.NumberFormat options). */
  format?: Intl.NumberFormatOptions;
  /** Show the key. By default, when there is more than one group. */
  legend?: boolean;
  /** The first group's colour. */
  accent?: string;
  /** What the chart shows, for screen readers (it captions the data table). */
  label?: string;
  /** `scroll`: inked as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: ChartTrigger;
  /** With `view`, how long the chart takes, in ms. */
  duration?: number;
  className?: string;
}

// Sample points: two loose groups with a rising trend, from integer arithmetic only, so the server and the browser agree.
const SAMPLE: Datum[] = Array.from({ length: 36 }, (_, i) => {
  const plan = i % 3 === 0 ? 'team' : 'solo';
  const x = 4 + ((i * 37) % 53) + (plan === 'team' ? 12 : 0);
  const wobble = ((i * 7919) % 29) - 14;
  return { seats: x, hours: Math.round(18 + x * (plan === 'team' ? 1.25 : 0.8) + wobble), plan };
});
const SAMPLE_CONFIG: ChartConfig = { solo: { label: 'Solo' }, team: { label: 'Team' } };

export function ChartScatter({
  data = SAMPLE,
  x = 'seats',
  y = 'hours',
  group = data === SAMPLE ? 'plan' : undefined,
  config = data === SAMPLE ? SAMPLE_CONFIG : undefined,
  xLabel = data === SAMPLE ? 'Seats' : undefined,
  yLabel = data === SAMPLE ? 'Hours saved' : undefined,
  trend = false,
  height = 260,
  format,
  legend,
  accent = ACCENT,
  label = 'Scatter chart',
  trigger = 'scroll',
  duration = 1800,
  className = '',
}: ChartScatterProps) {
  const names = group ? (config ? Object.keys(config) : [...new Set(data.map((d) => String(d[group])))]) : ['all'];
  const series = seriesOf([], '', Object.fromEntries(names.map((g) => [g, { label: config?.[g]?.label ?? g, color: config?.[g]?.color }])), accent);
  const xs = data.map((d) => num(d[x])), ys = data.map((d) => num(d[y]));
  const xt = niceTicks(Math.min(...xs), Math.max(...xs), 6);
  const yt = niceTicks(Math.min(0, ...ys), Math.max(...ys), 4);
  const [x0, x1, y0, y1] = [xt[0], xt[xt.length - 1], yt[0], yt[yt.length - 1]];
  const fmt = formatter(format);
  const groupOf = (d: Datum) => (group ? String(d[group]) : 'all');
  const [ref, size] = useSize<HTMLDivElement>();

  const pens = useMemo((): Pen[] | null => {
    if (!size) return null;
    const { w, h } = size;
    const sx = linear(x0, x1, 0, w), sy = linear(y0, y1, h, 0);
    const axes: Mark[] = [
      ...yt.map((t) => ({ d: toPath([[0, sy(t)], [w, sy(t)]]), width: t === y0 ? 1 : 0.6, opacity: t === y0 ? 0.9 : 0.2 })),
      ...xt.map((t) => (t === x0 ? { d: toPath([[0, h], [0, 0]]), width: 1, opacity: 0.9 } : { d: toPath([[sx(t), h], [sx(t), 0]]), width: 0.6, opacity: 0.14 })),
    ];
    const points: Mark[] = data
      .map((d) => ({ d, s: series.find((s) => s.key === groupOf(d)) }))
      .filter((p) => p.s)
      .sort((a, b) => num(a.d[x]) - num(b.d[x]))
      .map(({ d, s }) => ({ d: marker(s!.marker, sx(num(d[x])), sy(num(d[y])), 3.4), color: s!.color, width: 1.3 }));
    const lines: Mark[] = [];
    if (trend) {
      for (const s of series) {
        const pts = data.filter((d) => groupOf(d) === s.key).map((d) => [num(d[x]), num(d[y])]);
        if (pts.length < 2) continue;
        const mx = pts.reduce((m, p) => m + p[0], 0) / pts.length, my = pts.reduce((m, p) => m + p[1], 0) / pts.length;
        const sxx = pts.reduce((m, p) => m + (p[0] - mx) ** 2, 0);
        if (!sxx) continue;
        const slope = pts.reduce((m, p) => m + (p[0] - mx) * (p[1] - my), 0) / sxx;
        const lo = Math.min(...pts.map((p) => p[0])), hi = Math.max(...pts.map((p) => p[0]));
        lines.push({ d: toPath([[sx(lo), sy(my + slope * (lo - mx))], [sx(hi), sy(my + slope * (hi - mx))]]), color: series.length > 1 ? s.color : 'currentColor', width: 1.4, opacity: 0.85 });
      }
    }
    return [
      { marks: axes, ...PHASE.axes, spread: 0.6 },
      { marks: points, from: 1.0, to: lines.length ? 0.64 : PHASE.ink.to, spread: 3 },
      { marks: lines, from: 0.74, to: PHASE.ink.to, spread: 0.4 * (lines.length - 1) },
    ];
  }, [size, data, x, y, group, config, trend, accent, x0, x1, y0, y1]);

  const yTicks = yt.map((t) => ({ label: fmt(t), at: (t - y0) / (y1 - y0) }));
  return (
    <figure className={`w-full ${className}`}>
      <DataTable caption={label} head={[xLabel ?? x, yLabel ?? y, ...(group ? [group] : [])]} rows={data.map((d) => [num(d[x]), num(d[y]), ...(group ? [config?.[groupOf(d)]?.label ?? groupOf(d)] : [])])} />
      <div aria-hidden>
        {yLabel && <p data-slot="y-title" className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{yLabel}</p>}
        <div className="flex">
          <YLabels ticks={yTicks} />
          <div ref={ref} data-slot="plot" className="relative min-w-0 flex-1" style={{ height }}>
            {size && pens ? <PenLayers size={size} pens={pens} trigger={trigger} duration={duration} /> : null}
          </div>
        </div>
        <XLabels ticks={xt.map((t) => ({ label: fmt(t), at: (t - x0) / (x1 - x0) }))} offset={gutter(yTicks.map((t) => t.label))} />
        {xLabel && <p data-slot="x-title" className="mt-3 text-right font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{xLabel}</p>}
        {(legend ?? series.length > 1) && <Legend series={series} kind="marker" className="mt-4" />}
      </div>
    </figure>
  );
}
