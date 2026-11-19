<script lang="ts">
/**
 * chart-area — an area chart a pen hatches in as you scroll: the gridlines
 * first, then the area under each series stroke by stroke from left to right,
 * then the curve over it, the first in the accent colour. One series, or
 * several stacked one on another, each band hatched at its own angle.
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
import type { Datum, Hatch } from '@/lib/chart-core';

/** Upright hatching for the first band, as the plotted-chart plate has it, then diagonals each way and across. */
const AREA_HATCHES: Hatch[] = [
  { angle: 90, gap: 6 },
  { angle: 45, gap: 6 },
  { angle: 135, gap: 6 },
  { angle: 0, gap: 5 },
];

const SAMPLE: Datum[] = [
  { month: 'Jan', events: 1.2 }, { month: 'Feb', events: 1.5 }, { month: 'Mar', events: 1.9 }, { month: 'Apr', events: 1.7 },
  { month: 'May', events: 1.6 }, { month: 'Jun', events: 2.2 }, { month: 'Jul', events: 2.8 }, { month: 'Aug', events: 2.7 },
  { month: 'Sep', events: 3.4 }, { month: 'Oct', events: 3.6 }, { month: 'Nov', events: 4.2 }, { month: 'Dec', events: 4.6 },
];
</script>

<script setup lang="ts">
import { computed } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { ACCENT, PHASE, curvePath, curvePoints, formatter, gutter, hatchMarks, linear, niceTicks, num, seriesOf, toPath, type ChartConfig, type Mark, type Pen, type Pt } from '@/lib/chart-core';
import { DataTable, Legend, PenLayers, XLabels, YLabels, useSize } from '@/lib/chart-vue';

export interface ChartAreaProps {
  /** One object per point along the x axis. */
  data?: Datum[];
  /** The key in each object that labels its point on the x axis. */
  index?: string;
  /** The series to draw, by key: a label and, if you like, a colour. Defaults to every number in the first object. */
  config?: ChartConfig;
  /** Stack the series one on another, rather than each from zero. */
  stacked?: boolean;
  /** How the pen joins the points. */
  curve?: 'smooth' | 'linear' | 'step';
  /** The plot's height in pixels; it takes the full width. */
  height?: number;
  /** How numbers on the axis are written (Intl.NumberFormat options). */
  format?: Intl.NumberFormatOptions;
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

const props = withDefaults(defineProps<ChartAreaProps>(), {
  data: () => SAMPLE,
  index: 'month',
  stacked: false,
  curve: 'smooth',
  height: 240,
  legend: undefined,
  accent: ACCENT,
  label: 'Area chart',
  trigger: 'scroll',
  duration: 1800,
  className: '',
});

const series = computed(() => seriesOf(props.data, props.index, props.config, props.accent).map((s, i) => ({ ...s, hatch: AREA_HATCHES[i % AREA_HATCHES.length] })));
// Each band's top, and (stacked) its bottom: the running total of the series below.
const tops = computed(() => props.data.map((d) => {
  let sum = 0;
  return series.value.map((s) => (props.stacked ? (sum += num(d[s.key])) : num(d[s.key])));
}));
const ticks = computed(() => niceTicks(0, Math.max(...tops.value.flat()), 4));
const lo = computed(() => ticks.value[0]);
const hi = computed(() => ticks.value[ticks.value.length - 1]);
const xAt = (i: number) => (props.data.length > 1 ? i / (props.data.length - 1) : 0.5);
const [plot, size] = useSize();

const pens = computed((): Pen[] | null => {
  if (!size.value) return null;
  const { w, h } = size.value;
  const n = props.data.length, ser = series.value, top = tops.value;
  const y = linear(lo.value, hi.value, h, 0);
  const axes: Mark[] = ticks.value.map((t) => ({ d: toPath([[0, y(t)], [w, y(t)]]), width: t === lo.value ? 1 : 0.6, opacity: t === lo.value ? 0.9 : 0.22 }));
  for (let i = 0; i < n; i++) axes.push({ d: toPath([[xAt(i) * w, h], [xAt(i) * w, h + 5]]), width: 0.8, opacity: 0.6 });
  const line = (k: number): Pt[] => props.data.map((_, i) => [xAt(i) * w, y(top[i][k])]);
  const fill: Mark[] = [];
  const lines: Mark[] = [];
  // Unstacked bands overlap, so the hatching goes back to front: the largest first.
  const order = ser.map((_, k) => k);
  if (!props.stacked) order.sort((a, b) => top.reduce((m, t) => m + t[b], 0) - top.reduce((m, t) => m + t[a], 0));
  for (const k of order) {
    const upper = curvePoints(line(k), props.curve);
    const bottom: Pt[] = props.stacked && k > 0 ? curvePoints(line(k - 1), props.curve).reverse() : [[upper[upper.length - 1][0], h], [upper[0][0], h]];
    fill.push(...hatchMarks([...upper, ...bottom], ser[k].hatch, { opacity: 0.7, width: 0.9, inset: 3.5 }));
  }
  ser.forEach((s, k) => lines.push({ d: curvePath(line(k), props.curve), color: s.color, width: k === 0 ? 2.4 : 1.6 }));
  return [
    { marks: axes, ...PHASE.axes, spread: 0.6 },
    { marks: fill, ...PHASE.fill, spread: 2.5 },
    { marks: lines, ...PHASE.ink, spread: 0.5 * (lines.length - 1) },
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
      <Legend v-if="legend ?? series.length > 1" :series="series" kind="hatch" class="mt-5" />
    </div>
  </figure>
</template>
