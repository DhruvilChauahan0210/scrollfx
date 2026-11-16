<script lang="ts" module>
  /**
   * plotted-chart — figures beside a chart a pen plots as you scroll: the area
   * under the curve is hatched in, stroke by stroke from left to right, the
   * curve is drawn over it in the accent colour, and the figures count up.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The heading takes one
   * emphasised word between asterisks, set in `font-serif`.
   *
   * The figures and the axis labels are in the server HTML (each counter starts
   * on its final number). The drawing is made in the browser from `data`.
   * Reduced motion shows everything drawn.
   */
  export interface Stat {
    value: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    label: string;
  }

  export interface PlottedChartProps {
    eyebrow?: string;
    heading?: string;
    description?: string;
    /** The series, left to right. */
    data?: { label: string; value: number }[];
    stats?: Stat[];
    caption?: string;
    accent?: string;
    className?: string;
  }

  const W = 1000, H = 420, TOP = 40, BASE = 400, X0 = 10, X1 = 990;
  // The hatching sweeps left to right and the curve keeps pace with it; both
  // finish as the chart reaches the middle of the screen.
  const SPREAD = 1.2;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollCounterAction, scrollDraw } from 'svg-scroll-draw/svelte';
  import 'svg-scroll-draw/no-flash.css';
  import { curveY, scrollWindow, smooth, staggerFor } from '$lib/plotter';

  let {
    eyebrow = 'A year in numbers',
    heading = 'Growth, *plotted*.',
    description = 'Sample figures. Swap in your own series and the chart is drawn from them.',
    data = [
      { label: 'Jan', value: 1.2 }, { label: 'Feb', value: 1.5 }, { label: 'Mar', value: 1.9 }, { label: 'Apr', value: 1.7 },
      { label: 'May', value: 1.6 }, { label: 'Jun', value: 2.2 }, { label: 'Jul', value: 2.8 }, { label: 'Aug', value: 2.7 },
      { label: 'Sep', value: 3.4 }, { label: 'Oct', value: 3.6 }, { label: 'Nov', value: 4.2 }, { label: 'Dec', value: 4.6 },
    ],
    stats = [
      { value: 4.6, decimals: 1, suffix: 'M', label: 'Events a day, in December' },
      { value: 283, suffix: '%', label: 'Growth over the year' },
      { value: 38, suffix: ' ms', label: 'Median time to the dashboard' },
    ],
    caption = 'Fig. 1 — Events per day, millions',
    accent = '#e0482a',
    className = '',
  }: PlottedChartProps = $props();

  const parts = $derived(heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
  let drawing = $state<{ curve: string; hatch: string[] } | null>(null);
  onMount(() => {
    const max = Math.max(...data.map((d) => d.value)) * 1.08;
    const pts = data.map((d, i): [number, number] => [X0 + (i / (data.length - 1)) * (X1 - X0), BASE - (d.value / max) * (BASE - TOP)]);
    const hatch: string[] = [];
    for (let x = X0 + 3; x < X1; x += 7) hatch.push(`M${x.toFixed(1)} ${BASE}L${x.toFixed(1)} ${(curveY(pts, x) + 6).toFixed(1)}`);
    drawing = { curve: smooth(pts), hatch };
  });
</script>

<section class="mx-auto max-w-7xl px-6 py-28 sm:px-10 {className}">
  <div class="grid gap-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-20">
    <div>
      <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
        {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
      </h2>
      <p class="mt-6 max-w-sm text-pretty leading-relaxed text-muted-foreground">{description}</p>
      <dl class="mt-12 divide-y border-y">
        {#each stats as s (s.label)}
          <div class="flex items-baseline justify-between gap-6 py-5">
            <dt class="max-w-[12rem] text-sm text-muted-foreground">{s.label}</dt>
            <dd class="font-serif text-4xl tracking-[-0.02em] tabular-nums">
              {s.prefix ?? ''}<span use:scrollCounterAction={{ to: s.value, decimals: s.decimals ?? 0, trigger: scrollWindow() }}>{s.value.toFixed(s.decimals ?? 0)}</span>{s.suffix ?? ''}
            </dd>
          </div>
        {/each}
      </dl>
    </div>

    <figure class="self-end">
      <div class="relative aspect-[1000/420] w-full">
        {#if drawing}
          <div data-scroll-draw-pending="" use:scrollDraw={{ stagger: staggerFor(drawing.hatch.length, SPREAD), easing: 'linear', trigger: scrollWindow(SPREAD) }} class="absolute inset-0" aria-hidden="true">
            <svg viewBox="0 0 {W} {H}" class="size-full" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" opacity="0.75">
              {#each drawing.hatch as d, i (i)}<path {d} />{/each}
            </svg>
          </div>
          <div data-scroll-draw-pending="" use:scrollDraw={{ easing: 'linear', trigger: scrollWindow() }} class="absolute inset-0" aria-hidden="true">
            <svg viewBox="0 0 {W} {H}" class="size-full overflow-visible" fill="none" stroke={accent} stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d={drawing.curve} />
            </svg>
          </div>
        {/if}
        <div class="absolute inset-x-0 bottom-[4.5%] border-t border-foreground/60"></div>
      </div>
      <div class="mt-3 flex justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {#each data as d, i (d.label)}<span class={i % 2 ? 'hidden sm:inline' : ''}>{d.label}</span>{/each}
      </div>
      <figcaption class="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{caption}</figcaption>
    </figure>
  </div>
</section>
