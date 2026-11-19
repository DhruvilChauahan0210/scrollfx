<script lang="ts">
/**
 * chart-bar — a bar chart a pen plots as you scroll: the gridlines first,
 * then each bar hatched in, one after another, then outlined, the first
 * series in the accent colour. Upright or across, one series, grouped side by
 * side, or stacked; each series hatched at its own angle, so they read apart
 * without colour.
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
  { month: 'Jan', orders: 186 }, { month: 'Feb', orders: 305 }, { month: 'Mar', orders: 237 },
  { month: 'Apr', orders: 173 }, { month: 'May', orders: 209 }, { month: 'Jun', orders: 264 },
];
</script>

<script setup lang="ts">
import { computed } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { ACCENT, PHASE, formatter, gutter, hatchMarks, linear, niceTicks, num, rect, seriesOf, toPath, type ChartConfig, type Mark, type Pen } from '@/lib/chart-core';
import { DataTable, Legend, PenLayers, XLabels, YLabels, useSize } from '@/lib/chart-vue';

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
  /** `scroll`: inked as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: 'scroll' | 'view';
  /** With `view`, how long the chart takes, in ms. */
  duration?: number;
  className?: string;
}

const props = withDefaults(defineProps<ChartBarProps>(), {
  data: () => SAMPLE,
  index: 'month',
  orientation: 'vertical',
  stacked: false,
  legend: undefined,
  accent: ACCENT,
  label: 'Bar chart',
  trigger: 'scroll',
  duration: 1800,
  className: '',
});

const series = computed(() => seriesOf(props.data, props.index, props.config, props.accent));
const across = computed(() => props.orientation === 'horizontal');
const grouped = computed(() => !props.stacked && series.value.length > 1);
const ticks = computed(() => {
  const totals = props.data.map((d) => (props.stacked ? series.value.reduce((m, s) => m + num(d[s.key]), 0) : Math.max(...series.value.map((s) => num(d[s.key])))));
  return niceTicks(Math.min(0, ...totals), Math.max(...totals), across.value ? 5 : 4);
});
const lo = computed(() => ticks.value[0]);
const hi = computed(() => ticks.value[ticks.value.length - 1]);
const plotHeight = computed(() => props.height ?? (across.value ? props.data.length * (grouped.value ? 20 * series.value.length + 18 : 42) : 240));
const band = (i: number) => (i + 0.5) / props.data.length;
const [plot, size] = useSize();

const pens = computed((): Pen[] | null => {
  if (!size.value) return null;
  const { w, h } = size.value;
  const data = props.data, n = data.length, ser = series.value;
  // v runs along the value axis, c across the categories; flip them for bars across.
  const len = across.value ? w : h;
  const cross = across.value ? h : w;
  const v = linear(lo.value, hi.value, 0, len);
  const pt = (c: number, val: number): [number, number] => (across.value ? [val, c] : [c, len - val]);
  const axes: Mark[] = ticks.value.map((t) => {
    const base = t === 0 || t === lo.value;
    return { d: toPath([pt(0, v(t)), pt(cross, v(t))]), width: base ? 1 : 0.6, opacity: base ? 0.9 : 0.22 };
  });
  const step = cross / n;
  const groupW = step * (grouped.value ? 0.78 : 0.6);
  const fill: Mark[] = [];
  const outline: Mark[] = [];
  data.forEach((d, i) => {
    const c0 = step * i + (step - groupW) / 2;
    let acc = 0;
    ser.forEach((s, k) => {
      const value = num(d[s.key]);
      const gap = grouped.value ? Math.min(4, (groupW / ser.length) * 0.12) : 0;
      const bw = grouped.value ? groupW / ser.length - gap : groupW;
      const c = grouped.value ? c0 + k * (bw + gap) + gap / 2 : c0;
      const from = props.stacked ? acc : 0;
      const to = from + value;
      acc = to;
      const [a, b] = [v(Math.min(from, to)), v(Math.max(from, to))];
      if (b - a < 0.5) return;
      const box = across.value ? rect(a, c, b - a, bw) : rect(c, len - b, bw, b - a);
      fill.push(...hatchMarks(box, s.hatch, { opacity: 0.75, width: 0.9, inset: 2.5, reverse: across.value }));
      // Up one side, across the end, down the other: the base is the axis (or the bar below).
      outline.push({ d: toPath([pt(c, a), pt(c, b), pt(c + bw, b), pt(c + bw, a)]), color: s.color, width: k === 0 ? 1.8 : 1.4 });
    });
  });
  return [
    { marks: axes, ...PHASE.axes, spread: 0.6 },
    { marks: fill, ...PHASE.fill, spread: 2.5 },
    { marks: outline, ...PHASE.ink, spread: 1.5 },
  ];
});

const fmt = computed(() => formatter(props.format));
const valueTicks = computed(() => ticks.value.map((t) => ({ label: fmt.value(t), at: (t - lo.value) / (hi.value - lo.value) })));
const categories = computed(() => props.data.map((d, i) => ({ label: String(d[props.index]), at: across.value ? 1 - band(i) : band(i) })));
const yTicks = computed(() => (across.value ? categories.value : valueTicks.value));
const xTicks = computed(() => (across.value ? valueTicks.value : categories.value));
</script>

<template>
  <figure :class="`w-full ${className}`">
    <DataTable :caption="label" :head="[index, ...series.map((s) => s.label)]" :rows="data.map((d) => [String(d[index]), ...series.map((s) => num(d[s.key]))])" />
    <div aria-hidden="true">
      <div class="flex">
        <YLabels :ticks="yTicks" />
        <div ref="plot" data-slot="plot" class="relative min-w-0 flex-1" :style="{ height: `${plotHeight}px` }">
          <PenLayers v-if="size && pens" :size="size" :pens="pens" :trigger="trigger" :duration="duration" />
        </div>
      </div>
      <XLabels :ticks="xTicks" :offset="gutter(yTicks.map((t) => t.label))" />
      <Legend v-if="legend ?? series.length > 1" :series="series" kind="hatch" class="mt-5" />
    </div>
  </figure>
</template>
