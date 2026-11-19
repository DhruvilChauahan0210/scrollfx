<script lang="ts">
/**
 * chart-scatter — a scatter chart a pen plots as you scroll: the axes and
 * grid first, then every point as a small mark, left to right (circles in the
 * accent for the first group, then squares, triangles, diamonds and crosses in
 * ink), then, if you ask for it, a fitted trend line through each group (in
 * ink, for a single group).
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, lib/chart-core, lib/chart-vue and lib/plotter
 * (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens.
 *
 * The axis labels, the legend and a data table for screen readers are in the
 * server HTML; the strokes are made in the browser at the chart's size and
 * finish as the chart reaches the middle of the screen. Reduced motion shows
 * the chart drawn.
 */
import type { ChartConfig, Datum } from '@/lib/chart-core';

// Sample points: two loose groups with a rising trend, from integer arithmetic only, so the server and the browser agree.
const SAMPLE: Datum[] = Array.from({ length: 36 }, (_, i) => {
  const plan = i % 3 === 0 ? 'team' : 'solo';
  const x = 4 + ((i * 37) % 53) + (plan === 'team' ? 12 : 0);
  const wobble = ((i * 7919) % 29) - 14;
  return { seats: x, hours: Math.round(18 + x * (plan === 'team' ? 1.25 : 0.8) + wobble), plan };
});
const SAMPLE_CONFIG: ChartConfig = { solo: { label: 'Solo' }, team: { label: 'Team' } };
</script>

<script setup lang="ts">
import { computed } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { ACCENT, PHASE, formatter, gutter, linear, marker, niceTicks, num, seriesOf, toPath, type Mark, type Pen } from '@/lib/chart-core';
import { DataTable, Legend, PenLayers, XLabels, YLabels, useSize } from '@/lib/chart-vue';

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
  trigger?: 'scroll' | 'view';
  /** With `view`, how long the chart takes, in ms. */
  duration?: number;
  className?: string;
}

const props = withDefaults(defineProps<ChartScatterProps>(), {
  data: () => SAMPLE,
  x: 'seats',
  y: 'hours',
  trend: false,
  height: 260,
  legend: undefined,
  accent: ACCENT,
  label: 'Scatter chart',
  trigger: 'scroll',
  duration: 1800,
  className: '',
});

// The sample's groups and axis titles, unless you pass data of your own.
const sample = computed(() => props.data === SAMPLE);
const groupKey = computed(() => props.group ?? (sample.value ? 'plan' : undefined));
const groups = computed(() => props.config ?? (sample.value ? SAMPLE_CONFIG : undefined));
const xTitle = computed(() => props.xLabel ?? (sample.value ? 'Seats' : undefined));
const yTitle = computed(() => props.yLabel ?? (sample.value ? 'Hours saved' : undefined));

const series = computed(() => {
  const g = groupKey.value, config = groups.value;
  const names = g ? (config ? Object.keys(config) : [...new Set(props.data.map((d) => String(d[g])))]) : ['all'];
  return seriesOf([], '', Object.fromEntries(names.map((n) => [n, { label: config?.[n]?.label ?? n, color: config?.[n]?.color }])), props.accent);
});
const xt = computed(() => { const xs = props.data.map((d) => num(d[props.x])); return niceTicks(Math.min(...xs), Math.max(...xs), 6); });
const yt = computed(() => { const ys = props.data.map((d) => num(d[props.y])); return niceTicks(Math.min(0, ...ys), Math.max(...ys), 4); });
const x0 = computed(() => xt.value[0]);
const x1 = computed(() => xt.value[xt.value.length - 1]);
const y0 = computed(() => yt.value[0]);
const y1 = computed(() => yt.value[yt.value.length - 1]);
const fmt = computed(() => formatter(props.format));
const groupOf = (d: Datum) => (groupKey.value ? String(d[groupKey.value]) : 'all');
const [plot, size] = useSize();

const pens = computed((): Pen[] | null => {
  if (!size.value) return null;
  const { w, h } = size.value;
  const { x, y, data } = props;
  const ser = series.value;
  const sx = linear(x0.value, x1.value, 0, w), sy = linear(y0.value, y1.value, h, 0);
  const axes: Mark[] = [
    ...yt.value.map((t) => ({ d: toPath([[0, sy(t)], [w, sy(t)]]), width: t === y0.value ? 1 : 0.6, opacity: t === y0.value ? 0.9 : 0.2 })),
    ...xt.value.map((t) => (t === x0.value ? { d: toPath([[0, h], [0, 0]]), width: 1, opacity: 0.9 } : { d: toPath([[sx(t), h], [sx(t), 0]]), width: 0.6, opacity: 0.14 })),
  ];
  const points: Mark[] = data
    .map((d) => ({ d, s: ser.find((s) => s.key === groupOf(d)) }))
    .filter((p) => p.s)
    .sort((a, b) => num(a.d[x]) - num(b.d[x]))
    .map(({ d, s }) => ({ d: marker(s!.marker, sx(num(d[x])), sy(num(d[y])), 3.4), color: s!.color, width: 1.3 }));
  const lines: Mark[] = [];
  if (props.trend) {
    for (const s of ser) {
      const pts = data.filter((d) => groupOf(d) === s.key).map((d) => [num(d[x]), num(d[y])]);
      if (pts.length < 2) continue;
      const mx = pts.reduce((m, p) => m + p[0], 0) / pts.length, my = pts.reduce((m, p) => m + p[1], 0) / pts.length;
      const sxx = pts.reduce((m, p) => m + (p[0] - mx) ** 2, 0);
      if (!sxx) continue;
      const slope = pts.reduce((m, p) => m + (p[0] - mx) * (p[1] - my), 0) / sxx;
      const lo = Math.min(...pts.map((p) => p[0])), hi = Math.max(...pts.map((p) => p[0]));
      lines.push({ d: toPath([[sx(lo), sy(my + slope * (lo - mx))], [sx(hi), sy(my + slope * (hi - mx))]]), color: ser.length > 1 ? s.color : 'currentColor', width: 1.4, opacity: 0.85 });
    }
  }
  return [
    { marks: axes, ...PHASE.axes, spread: 0.6 },
    { marks: points, from: 1.0, to: lines.length ? 0.64 : PHASE.ink.to, spread: 3 },
    { marks: lines, from: 0.74, to: PHASE.ink.to, spread: 0.4 * (lines.length - 1) },
  ];
});

const yTicks = computed(() => yt.value.map((t) => ({ label: fmt.value(t), at: (t - y0.value) / (y1.value - y0.value) })));
</script>

<template>
  <figure :class="`w-full ${className}`">
    <DataTable
      :caption="label"
      :head="[xTitle ?? x, yTitle ?? y, ...(groupKey ? [groupKey] : [])]"
      :rows="data.map((d) => [num(d[x]), num(d[y]), ...(groupKey ? [groups?.[groupOf(d)]?.label ?? groupOf(d)] : [])])"
    />
    <div aria-hidden="true">
      <p v-if="yTitle" data-slot="y-title" class="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{{ yTitle }}</p>
      <div class="flex">
        <YLabels :ticks="yTicks" />
        <div ref="plot" data-slot="plot" class="relative min-w-0 flex-1" :style="{ height: `${height}px` }">
          <PenLayers v-if="size && pens" :size="size" :pens="pens" :trigger="trigger" :duration="duration" />
        </div>
      </div>
      <XLabels :ticks="xt.map((t) => ({ label: fmt(t), at: (t - x0) / (x1 - x0) }))" :offset="gutter(yTicks.map((t) => t.label))" />
      <p v-if="xTitle" data-slot="x-title" class="mt-3 text-right font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{{ xTitle }}</p>
      <Legend v-if="legend ?? series.length > 1" :series="series" kind="marker" class="mt-4" />
    </div>
  </figure>
</template>
