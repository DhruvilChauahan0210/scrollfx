<script lang="ts">
/**
 * chart-pie — a pie or a donut a pen shades as you scroll: each wedge hatched
 * in turn, clockwise from twelve o'clock, at its own angle and density (the
 * way a plotter shades without colour), then the outline drawn round, the
 * first wedge in the accent colour.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, lib/chart-core, lib/chart-vue and lib/plotter
 * (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens.
 *
 * The shares, the total, the legend and a data table for screen readers are
 * in the server HTML; the strokes are made in the browser at the chart's size
 * and finish as the chart reaches the middle of the screen. Reduced motion
 * shows the chart drawn.
 */
import type { ChartConfig, Datum, Hatch } from '@/lib/chart-core';

/** A shade per wedge: angles and densities a reader tells apart at a glance. */
const SHADES: Hatch[] = [
  { angle: 45, gap: 4 },
  { angle: 135, gap: 6 },
  { angle: 90, gap: 5 },
  { angle: 0, gap: 4.5 },
  { angle: 45, gap: 8, cross: true },
  { angle: 135, gap: 3.5 },
  { angle: 22, gap: 6 },
];

const SAMPLE: Datum[] = [
  { name: 'chrome', value: 275 }, { name: 'safari', value: 200 }, { name: 'firefox', value: 187 }, { name: 'edge', value: 173 }, { name: 'other', value: 90 },
];
const SAMPLE_CONFIG: ChartConfig = { chrome: { label: 'Chrome' }, safari: { label: 'Safari' }, firefox: { label: 'Firefox' }, edge: { label: 'Edge' }, other: { label: 'Other' } };

// The circle's radius and where the shares sit, as fractions of its square box (the
// shares fall in the padding round it), and the donut's hole as a fraction of the circle.
const R = 0.47, RL = 0.55, INNER = 0.58;
</script>

<script setup lang="ts">
import { computed } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { ACCENT, aroundLabel, arc, formatter, hatchMarks, num, toPath, wedge, type Mark, type Pen, type Series } from '@/lib/chart-core';
import { DataTable, Legend, PenLayers, useSize } from '@/lib/chart-vue';

export interface ChartPieProps {
  /** One object per wedge. */
  data?: Datum[];
  /** The key in each object that names its wedge. */
  nameKey?: string;
  /** The key in each object that holds its value. */
  valueKey?: string;
  /** Labels (and colours, if you like) for the wedges, by name. */
  config?: ChartConfig;
  /** A full pie, or a donut with the total in the middle. */
  variant?: 'pie' | 'donut';
  /** Each wedge's share, written beside it. */
  labels?: boolean;
  /** Under the total in a donut. */
  totalLabel?: string;
  /** How the total is written (Intl.NumberFormat options). */
  format?: Intl.NumberFormatOptions;
  /** Show the key. */
  legend?: boolean;
  /** The first wedge's colour. */
  accent?: string;
  /** What the chart shows, for screen readers (it captions the data table). */
  label?: string;
  /** `scroll`: inked as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: 'scroll' | 'view';
  /** With `view`, how long the chart takes, in ms. */
  duration?: number;
  className?: string;
}

const props = withDefaults(defineProps<ChartPieProps>(), {
  data: () => SAMPLE,
  nameKey: 'name',
  valueKey: 'value',
  variant: 'pie',
  labels: true,
  totalLabel: 'Total',
  legend: true,
  accent: ACCENT,
  label: 'Pie chart',
  trigger: 'scroll',
  duration: 1800,
  className: '',
});

// The sample's names, unless you pass data of your own.
const names = computed(() => props.config ?? (props.data === SAMPLE ? SAMPLE_CONFIG : undefined));
const total = computed(() => props.data.reduce((m, d) => m + Math.max(0, num(d[props.valueKey])), 0) || 1);
const wedges = computed(() => {
  const out: (Series & { value: number; a0: number; a1: number })[] = [];
  let a = 0;
  props.data.forEach((d, i) => {
    const name = String(d[props.nameKey]);
    const value = Math.max(0, num(d[props.valueKey]));
    const a1 = a + (value / total.value) * Math.PI * 2;
    out.push({ key: name, label: names.value?.[name]?.label ?? name, color: names.value?.[name]?.color ?? (i === 0 ? props.accent : 'currentColor'), hatch: SHADES[i % SHADES.length], marker: 'circle', value, a0: a, a1 });
    a = a1;
  });
  return out;
});
const fmt = computed(() => formatter(props.format ?? { maximumFractionDigits: 0 }));
const pct = (v: number) => `${Math.round((v / total.value) * 100)}%`;
const donut = computed(() => props.variant === 'donut');
const [plot, size] = useSize();

const pens = computed((): Pen[] | null => {
  if (!size.value) return null;
  const s = Math.min(size.value.w, size.value.h);
  const cx = size.value.w / 2, cy = size.value.h / 2, r = s * R, r0 = donut.value ? r * INNER : 0;
  const ws = wedges.value;
  const fill: Mark[] = [];
  const ink: Mark[] = [];
  const first: Mark[] = [];
  ws.forEach((wd, i) => {
    if (wd.a1 - wd.a0 < 1e-3) return;
    fill.push(...hatchMarks(wedge(cx, cy, r0, r, wd.a0, wd.a1), wd.hatch, { color: i === 0 ? wd.color : undefined, opacity: i === 0 ? 0.85 : 0.7, width: 0.9, inset: 3 }));
    // The edge each wedge starts on, from the centre (or the inner ring) out.
    if (ws.length > 1) ink.push({ d: toPath([[cx + Math.sin(wd.a0) * r0, cy - Math.cos(wd.a0) * r0], [cx + Math.sin(wd.a0) * r, cy - Math.cos(wd.a0) * r]]), width: 1.1 });
  });
  ink.push({ d: toPath(arc(cx, cy, r, 0, Math.PI * 2, 0.02)), width: 1.2 });
  if (donut.value) ink.push({ d: toPath(arc(cx, cy, r0, 0, Math.PI * 2, 0.03)), width: 1.1 });
  const w0 = ws[0];
  if (w0 && w0.a1 - w0.a0 > 1e-3) {
    const outline = wedge(cx, cy, r0, r, w0.a0, w0.a1);
    first.push({ d: toPath([...outline, outline[0]]), color: w0.color, width: 2 });
  }
  return [
    { marks: fill, from: 1.12, to: 0.7, spread: 3 },
    { marks: ink, from: 0.8, to: 0.6, spread: 0.8 },
    { marks: first, from: 0.68, to: 0.5 },
  ];
});

// Each share beside its wedge, if the wedge is wide enough for it.
const shares = computed(() => wedges.value.filter((wd) => wd.a1 - wd.a0 >= 0.12).map((wd) => ({ key: wd.key, text: pct(wd.value), style: aroundLabel((wd.a0 + wd.a1) / 2, RL) })));
</script>

<template>
  <figure :class="`@container mx-auto w-full max-w-sm ${className}`">
    <DataTable :caption="label" :head="['Name', 'Value', 'Share']" :rows="wedges.map((wd) => [wd.label, wd.value, pct(wd.value)])" />
    <div aria-hidden="true">
      <div class="px-9 py-6">
        <div ref="plot" data-slot="plot" class="relative aspect-square w-full">
          <PenLayers v-if="size && pens" :size="size" :pens="pens" :trigger="trigger" :duration="duration" />
          <template v-if="labels">
            <span v-for="s in shares" :key="s.key" class="absolute font-mono text-[11px] tabular-nums text-muted-foreground" :style="s.style">{{ s.text }}</span>
          </template>
          <div v-if="donut" class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-serif text-2xl @xs:text-[2.4rem] leading-none tracking-[-0.02em] tabular-nums">{{ fmt(total) }}</span>
            <span class="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{{ totalLabel }}</span>
          </div>
        </div>
      </div>
      <Legend v-if="legend" :series="wedges" kind="hatch" class="mt-2 justify-center" />
    </div>
  </figure>
</template>
