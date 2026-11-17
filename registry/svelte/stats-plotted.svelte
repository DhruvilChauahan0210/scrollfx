<script lang="ts" module>
  /**
   * stats-plotted — a row of figures that count up, each over a gauge a pen
   * plots tick by tick, clockwise, as the figure arrives: the ticks in ink, a
   * band in the accent colour out to the figure's share of the dial, and a
   * needle pointing at it.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The heading takes one
   * emphasised word between asterisks, set in `font-serif`.
   *
   * The default figures are placeholders: pass your own. The figures are in the
   * server HTML (each counter starts on its final number); the gauges are drawn
   * in the browser, each finishing as it reaches the middle of the screen, and
   * each is seeded from its label. Reduced motion shows the final figures and
   * the gauges drawn.
   */
  export interface Figure {
    value: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    label: string;
    /** How far round the gauge the accent band goes, 0 to 1. */
    share?: number;
  }

  export interface StatsPlottedProps {
    eyebrow?: string;
    heading?: string;
    description?: string;
    figures?: Figure[];
    caption?: string;
    accent?: string;
    className?: string;
  }

  // The ticks draw one after another over this many trigger ranges (see scrollWindow).
  const SPREAD = 0.8;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollCounterAction, scrollDraw } from 'svg-scroll-draw/svelte';
  import 'svg-scroll-draw/no-flash.css';
  import { gauge, scrollWindow, seedOf, staggerFor, type Stroke } from '$lib/plotter';

  let {
    eyebrow = 'In numbers',
    heading = 'The figures, *plotted*.',
    description = 'Placeholder figures: replace them with your own before you ship.',
    figures = [
      { value: 120, suffix: '+', label: 'Sample figure: teams on board', share: 0.6 },
      { value: 99.9, decimals: 1, suffix: '%', label: 'Sample figure: uptime', share: 0.999 },
      { value: 4.8, decimals: 1, suffix: '/5', label: 'Sample figure: average rating', share: 0.96 },
      { value: 36, suffix: ' h', label: 'Sample figure: hours saved a month', share: 0.45 },
    ],
    caption = 'Fig. — Sample figures, not measurements',
    accent = '#e0482a',
    className = '',
  }: StatsPlottedProps = $props();

  const parts = $derived(heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
  let gauges = $state<Stroke[][] | null>(null);
  onMount(() => {
    gauges = figures.map((s) => gauge({ seed: seedOf(s.label), share: s.share ?? 0.7 }));
  });
</script>

<section class="mx-auto max-w-7xl px-6 py-28 sm:px-10 {className}">
  <div class="max-w-2xl">
    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
    <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
      {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
    </h2>
    {#if description}<p class="mt-6 max-w-lg text-pretty text-[17px] leading-relaxed text-muted-foreground">{description}</p>{/if}
  </div>

  <ul class="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
    {#each figures as s, i (s.label)}
      <li class="border-t pt-8">
        <div class="relative size-28">
          {#if gauges}
            <div data-scroll-draw-pending="" use:scrollDraw={{ stagger: staggerFor(gauges[i].length, SPREAD), easing: 'linear', trigger: scrollWindow(SPREAD) }} class="absolute inset-0" aria-hidden="true">
              <svg viewBox="0 0 100 100" class="size-full" fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round">
                {#each gauges[i] as g, k (k)}{#if g.pen}<path d={g.d} stroke={accent} stroke-width="1.3" />{:else}<path d={g.d} />{/if}{/each}
              </svg>
            </div>
          {/if}
        </div>
        <p class="mt-8 font-serif text-6xl tracking-[-0.03em] tabular-nums">
          {s.prefix ?? ''}<span use:scrollCounterAction={{ to: s.value, decimals: s.decimals ?? 0, trigger: scrollWindow() }}>{s.value.toFixed(s.decimals ?? 0)}</span>{s.suffix ?? ''}
        </p>
        <p class="mt-3 max-w-[16rem] text-pretty text-[15px] leading-relaxed text-muted-foreground">{s.label}</p>
      </li>
    {/each}
  </ul>
  {#if caption}<p class="mt-14 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{caption}</p>{/if}
</section>
