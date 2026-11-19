<script lang="ts" module>
  /**
   * chart-scatter — a scatter chart a pen plots as you scroll: the axes and
   * grid first, then every point as a small mark, left to right (circles in
   * the accent for the first group, then squares, triangles, diamonds and
   * crosses in ink), then, if you ask for it, a fitted trend line through each
   * group (in ink, for a single group).
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
  import type { ChartConfig, ChartTrigger, Datum } from '$lib/chart-core';

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
</script>

<script lang="ts">
  import 'svg-scroll-draw/no-flash.css';
  import { ACCENT, PHASE, formatter, gutter, linear, marker, niceTicks, num, seriesOf, toPath, type Mark, type Pen, type Size } from '$lib/chart-core';
  import { DataTable, Legend, Pens, XLabels, YLabels, sized } from '$lib/chart-parts.svelte';

  let {
    data = SAMPLE,
    x = 'seats',
    y = 'hours',
    group,
    config,
    xLabel,
    yLabel,
    trend = false,
    height = 260,
    format,
    legend,
    accent = ACCENT,
    label = 'Scatter chart',
    trigger = 'scroll',
    duration = 1800,
    className = '',
  }: ChartScatterProps = $props();

  // The sample's groups and axis titles, unless you pass data of your own.
  const sample = $derived(data === SAMPLE);
  const groupKey = $derived(group ?? (sample ? 'plan' : undefined));
  const groups = $derived(config ?? (sample ? SAMPLE_CONFIG : undefined));
  const xTitle = $derived(xLabel ?? (sample ? 'Seats' : undefined));
  const yTitle = $derived(yLabel ?? (sample ? 'Hours saved' : undefined));

  const series = $derived.by(() => {
    const names = groupKey ? (groups ? Object.keys(groups) : [...new Set(data.map((d) => String(d[groupKey])))]) : ['all'];
    return seriesOf([], '', Object.fromEntries(names.map((g) => [g, { label: groups?.[g]?.label ?? g, color: groups?.[g]?.color }])), accent);
  });
  const xt = $derived.by(() => { const xs = data.map((d) => num(d[x])); return niceTicks(Math.min(...xs), Math.max(...xs), 6); });
  const yt = $derived.by(() => { const ys = data.map((d) => num(d[y])); return niceTicks(Math.min(0, ...ys), Math.max(...ys), 4); });
  const [x0, x1] = $derived([xt[0], xt[xt.length - 1]]);
  const [y0, y1] = $derived([yt[0], yt[yt.length - 1]]);
  const fmt = $derived(formatter(format));
  const groupOf = (d: Datum) => (groupKey ? String(d[groupKey]) : 'all');
  let size = $state<Size | null>(null);

  const pens = $derived.by((): Pen[] | null => {
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
  });

  const yTicks = $derived(yt.map((t) => ({ label: fmt(t), at: (t - y0) / (y1 - y0) })));
</script>

<figure class="w-full {className}">
  {@render DataTable(label, [xTitle ?? x, yTitle ?? y, ...(groupKey ? [groupKey] : [])], data.map((d) => [num(d[x]), num(d[y]), ...(groupKey ? [groups?.[groupOf(d)]?.label ?? groupOf(d)] : [])]))}
  <div aria-hidden="true">
    {#if yTitle}<p data-slot="y-title" class="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{yTitle}</p>{/if}
    <div class="flex">
      {@render YLabels(yTicks)}
      <div use:sized={(s) => (size = s)} data-slot="plot" class="relative min-w-0 flex-1" style:height="{height}px">
        {#if size && pens}{@render Pens(size, pens, trigger, duration)}{/if}
      </div>
    </div>
    {@render XLabels(xt.map((t) => ({ label: fmt(t), at: (t - x0) / (x1 - x0) })), gutter(yTicks.map((t) => t.label)))}
    {#if xTitle}<p data-slot="x-title" class="mt-3 text-right font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{xTitle}</p>{/if}
    {#if legend ?? series.length > 1}{@render Legend(series, 'marker', 'mt-4')}{/if}
  </div>
</figure>
