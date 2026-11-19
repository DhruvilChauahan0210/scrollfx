<script lang="ts">
/**
 * chart-line — a line chart a pen plots as you scroll: the gridlines first,
 * then each series left to right (the first in the accent colour), then a
 * marker on every point. One series or several; smooth, straight or stepped.
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
import type { Datum } from '@/lib/chart-core';

const SAMPLE: Datum[] = [
  { month: 'Jan', visitors: 1240 }, { month: 'Feb', visitors: 1510 }, { month: 'Mar', visitors: 1460 }, { month: 'Apr', visitors: 1980 },
  { month: 'May', visitors: 2350 }, { month: 'Jun', visitors: 2210 }, { month: 'Jul', visitors: 2740 }, { month: 'Aug', visitors: 3120 },
  { month: 'Sep', visitors: 2980 }, { month: 'Oct', visitors: 3540 }, { month: 'Nov', visitors: 3890 }, { month: 'Dec', visitors: 4320 },
];
</script>

<script setup lang="ts">
import { computed } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { ACCENT, PHASE, curvePath, formatter, gutter, linear, marker, niceTicks, num, seriesOf, toPath, type ChartConfig, type Mark, type Pen } from '@/lib/chart-core';
import { DataTable, Legend, PenLayers, XLabels, YLabels, useSize } from '@/lib/chart-vue';

export interface ChartLineProps {
  /** One object per point along the x axis. */
  data?: Datum[];
  /** The key in each object that labels its point on the x axis. */
  index?: string;
  /** The series to draw, by key: a label and, if you like, a colour. Defaults to every number in the first object. */
  config?: ChartConfig;
  /** How the pen joins the points. */
  curve?: 'smooth' | 'linear' | 'step';
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
  trigger?: 'scroll' | 'view';
  /** With `view`, how long the chart takes, in ms. */
  duration?: number;
  className?: string;
}

const props = withDefaults(defineProps<ChartLineProps>(), {
  data: () => SAMPLE,
  index: 'month',
  curve: 'smooth',
  markers: undefined,
  height: 240,
  zero: true,
  legend: undefined,
  accent: ACCENT,
  label: 'Line chart',
  trigger: 'scroll',
  duration: 1800,
  className: '',
});

const series = computed(() => seriesOf(props.data, props.index, props.config, props.accent));
const ticks = computed(() => {
  const values = props.data.flatMap((d) => series.value.map((s) => num(d[s.key])));
  return niceTicks(props.zero ? Math.min(0, ...values) : Math.min(...values), Math.max(...values), 4);
});
const lo = computed(() => ticks.value[0]);
const hi = computed(() => ticks.value[ticks.value.length - 1]);
const xAt = (i: number) => (props.data.length > 1 ? i / (props.data.length - 1) : 0.5);
const showMarkers = computed(() => props.markers ?? (series.value.length > 1 && props.curve !== 'step'));
const [plot, size] = useSize();

const pens = computed((): Pen[] | null => {
  if (!size.value) return null;
  const { w, h } = size.value;
  const data = props.data;
  const y = linear(lo.value, hi.value, h, 0);
  // Gridlines bottom to top; the zero line (the baseline) in full ink.
  const axes: Mark[] = ticks.value.map((t) => ({ d: toPath([[0, y(t)], [w, y(t)]]), width: t === 0 || t === lo.value ? 1 : 0.6, opacity: t === 0 || t === lo.value ? 0.9 : 0.22 }));
  // A short tick under each point on the baseline.
  for (let i = 0; i < data.length; i++) axes.push({ d: toPath([[xAt(i) * w, h], [xAt(i) * w, h + 5]]), width: 0.8, opacity: 0.6 });
  const lines: Mark[] = series.value.map((s, k) => ({
    d: curvePath(data.map((d, i) => [xAt(i) * w, y(num(d[s.key]))]), props.curve),
    color: s.color,
    width: k === 0 ? 2.2 : 1.5,
  }));
  const dots: Mark[] = showMarkers.value
    ? data.flatMap((d, i) => series.value.map((s) => ({ d: marker(s.marker, xAt(i) * w, y(num(d[s.key]))), color: s.color, width: 1.3 })))
    : [];
  return [
    { marks: axes, ...PHASE.axes, spread: 0.6 },
    { marks: lines, from: PHASE.ink.from, to: showMarkers.value ? 0.6 : PHASE.ink.to, spread: 0.5 * (lines.length - 1) },
    { marks: dots, from: 0.74, to: PHASE.ink.to, spread: 2 },
  ];
});

const fmt = computed(() => formatter(props.format));
</script>

<template>
  <figure :class="`w-full ${className}`">
    <DataTable :caption="label" :head="[index, ...series.map((s) => s.label)]" :rows="data.map((d) => [String(d[index]), ...series.map((s) => num(d[s.key]))])" />
    <div aria-hidden="true">
      <div class="flex">
        <YLabels :ticks="ticks.map((t) => ({ label: fmt(t), at: (t - lo) / (hi - lo) }))" />
        <div ref="plot" data-slot="plot" class="relative min-w-0 flex-1" :style="{ height: `${height}px` }">
          <PenLayers v-if="size && pens" :size="size" :pens="pens" :trigger="trigger" :duration="duration" />
        </div>
      </div>
      <XLabels :ticks="data.map((d, i) => ({ label: String(d[index]), at: xAt(i) }))" :offset="gutter(ticks.map(fmt))" />
      <Legend v-if="legend ?? series.length > 1" :series="series" kind="line" class="mt-5" />
    </div>
  </figure>
</template>
