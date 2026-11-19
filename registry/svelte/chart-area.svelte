<script lang="ts" module>
  /**
   * chart-area — an area chart a pen hatches in as you scroll: the gridlines
   * first, then the area under each series stroke by stroke from left to
   * right, then the curve over it, the first in the accent colour. One series,
   * or several stacked one on another, each band hatched at its own angle.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, $lib/chart-core, $lib/chart-parts.svelte
   * and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens.
   *
   * The axis labels, the legend and a data table for screen readers are in the
   * server HTML; the strokes are made in the browser at the chart's size and
   * finish as the chart reaches the middle of the screen. Reduced motion shows
   * the chart drawn.
   */
  import type { ChartConfig, ChartTrigger, Curve, Datum, Hatch } from '$lib/chart-core';

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
    curve?: Curve;
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
    trigger?: ChartTrigger;
    /** With `view`, how long the chart takes, in ms. */
    duration?: number;
    className?: string;
  }

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

<script lang="ts">
  import 'svg-scroll-draw/no-flash.css';
  import { ACCENT, PHASE, curvePath, curvePoints, formatter, gutter, hatchMarks, linear, niceTicks, num, seriesOf, toPath, type Mark, type Pen, type Pt, type Size } from '$lib/chart-core';
  import { DataTable, Legend, Pens, XLabels, YLabels, sized } from '$lib/chart-parts.svelte';

  let {
    data = SAMPLE,
    index = 'month',
    config,
    stacked = false,
    curve = 'smooth',
    height = 240,
    format,
    legend,
    accent = ACCENT,
    label = 'Area chart',
    trigger = 'scroll',
    duration = 1800,
    className = '',
  }: ChartAreaProps = $props();

  const series = $derived(seriesOf(data, index, config, accent).map((s, i) => ({ ...s, hatch: AREA_HATCHES[i % AREA_HATCHES.length] })));
  // Each band's top, and (stacked) its bottom: the running total of the series below.
  const tops = $derived(data.map((d) => {
    let sum = 0;
    return series.map((s) => (stacked ? (sum += num(d[s.key])) : num(d[s.key])));
  }));
  const ticks = $derived(niceTicks(0, Math.max(...tops.flat()), 4));
  const lo = $derived(ticks[0]);
  const hi = $derived(ticks[ticks.length - 1]);
  const fmt = $derived(formatter(format));
  const xAt = (i: number) => (data.length > 1 ? i / (data.length - 1) : 0.5);
  let size = $state<Size | null>(null);

  const pens = $derived.by((): Pen[] | null => {
    if (!size) return null;
    const { w, h } = size;
    const n = data.length;
    const y = linear(lo, hi, h, 0);
    const axes: Mark[] = ticks.map((t) => ({ d: toPath([[0, y(t)], [w, y(t)]]), width: t === lo ? 1 : 0.6, opacity: t === lo ? 0.9 : 0.22 }));
    for (let i = 0; i < n; i++) axes.push({ d: toPath([[xAt(i) * w, h], [xAt(i) * w, h + 5]]), width: 0.8, opacity: 0.6 });
    const line = (k: number): Pt[] => data.map((_, i) => [xAt(i) * w, y(tops[i][k])]);
    const fill: Mark[] = [];
    const lines: Mark[] = [];
    // Unstacked bands overlap, so the hatching goes back to front: the largest first.
    const order = series.map((_, k) => k);
    if (!stacked) order.sort((a, b) => tops.reduce((m, t) => m + t[b], 0) - tops.reduce((m, t) => m + t[a], 0));
    for (const k of order) {
      const top = curvePoints(line(k), curve);
      const bottom: Pt[] = stacked && k > 0 ? curvePoints(line(k - 1), curve).reverse() : [[top[top.length - 1][0], h], [top[0][0], h]];
      fill.push(...hatchMarks([...top, ...bottom], series[k].hatch, { opacity: 0.7, width: 0.9, inset: 3.5 }));
    }
    series.forEach((s, k) => lines.push({ d: curvePath(line(k), curve), color: s.color, width: k === 0 ? 2.4 : 1.6 }));
    return [
      { marks: axes, ...PHASE.axes, spread: 0.6 },
      { marks: fill, ...PHASE.fill, spread: 2.5 },
      { marks: lines, ...PHASE.ink, spread: 0.5 * (lines.length - 1) },
    ];
  });
</script>

<figure class="w-full {className}">
  {@render DataTable(label, [index, ...series.map((s) => s.label)], data.map((d) => [String(d[index]), ...series.map((s) => num(d[s.key]))]))}
  <div aria-hidden="true">
    <div class="flex">
      {@render YLabels(ticks.map((t) => ({ label: fmt(t), at: (t - lo) / (hi - lo) })))}
      <div use:sized={(s) => (size = s)} data-slot="plot" class="relative min-w-0 flex-1" style:height="{height}px">
        {#if size && pens}{@render Pens(size, pens, trigger, duration)}{/if}
      </div>
    </div>
    {@render XLabels(data.map((d, i) => ({ label: String(d[index]), at: xAt(i) })), gutter(ticks.map((t) => fmt(t))))}
    {#if legend ?? series.length > 1}{@render Legend(series, 'hatch', 'mt-5')}{/if}
  </div>
</figure>
