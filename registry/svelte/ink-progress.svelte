<script lang="ts" module>
  /**
   * ink-progress — a value plotted as the reader reaches it: a bar whose fill a
   * pen hatches in from the left and stops at the value, a ring with a band in
   * the accent pen out to it, or an instrument gauge ticked clockwise with a
   * needle on it.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, $lib/plotter and $lib/ink-core (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens; figures in `font-serif`.
   *
   * The label and the value are in the server HTML (role="progressbar", with
   * aria-valuenow); the drawing is made in the browser and goes as far as the
   * value. Reduced motion shows it drawn.
   */
  export interface InkProgressProps {
    value: number;
    max?: number;
    variant?: 'bar' | 'ring' | 'gauge';
    /** What the value is of, shown with it and read out with it. */
    label?: string;
    /** Show the value as a figure. */
    showValue?: boolean;
    /** Show the figure as a percentage of max (the default), or as the value itself. */
    display?: 'percent' | 'value';
    /** Set before and after the figure; after a percentage, `%` unless you pass one. */
    prefix?: string;
    suffix?: string;
    decimals?: number;
    /** The ring's or gauge's width and height, in px. */
    size?: number;
    /** The ink's colour. */
    color?: string;
    /** The accent pen's colour: the fill, the band. */
    accent?: string;
    strokeWidth?: number;
    /** Shapes the strokes; by default taken from the label. */
    seed?: number;
    /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
    trigger?: 'scroll' | 'view';
    /** With `view`, the drawing's length in ms. */
    duration?: number;
    className?: string;
  }
</script>

<script lang="ts">
  import { scrollCounterAction } from 'svg-scroll-draw/svelte';
  import 'svg-scroll-draw/no-flash.css';
  import { scrollWindow, seedOf, type Stroke } from '$lib/plotter';
  import { BAR_H, barStrokes, ink, progressFigure, roundStrokes, sized } from '$lib/ink-core';

  let {
    value,
    max = 100,
    variant = 'bar',
    label,
    showValue = true,
    display = 'percent',
    prefix,
    suffix,
    decimals,
    size = 128,
    color = 'currentColor',
    accent = '#e0482a',
    strokeWidth = 1.1,
    seed,
    trigger = 'scroll',
    duration = 1600,
    className = '',
  }: InkProgressProps = $props();

  const share = $derived(Math.max(0, Math.min(1, value / max)));
  const s = $derived(seed ?? seedOf(label ?? `${variant}`));
  /** The figure: counted up with the drawing on scroll, plain otherwise. Its final number is in the server HTML either way. */
  const figure = $derived(progressFigure({ value, max, display, prefix, suffix, decimals }));

  // The bar: its outline and scale first, then the fill hatched in to the value.
  let barWidth = $state(0);
  const bar = $derived(variant === 'bar' && barWidth > 10 ? barStrokes(barWidth, share, s) : null);

  // The ring or gauge, made in the browser.
  let round = $state.raw<Stroke[] | null>(null);
  $effect(() => {
    if (variant !== 'bar') round = roundStrokes(variant, s, share);
  });
  const roundWidth = $derived(strokeWidth * (100 / size));
</script>

{#snippet figureText(className: string, style?: string)}
  <span class="tabular-nums {className}" {style}
    >{figure.prefix}{#if trigger === 'scroll'}<span use:scrollCounterAction={{ to: figure.value, decimals: figure.decimals, trigger: scrollWindow() }}>{figure.value.toFixed(figure.decimals)}</span
      >{:else}{figure.value.toFixed(figure.decimals)}{/if}{figure.suffix}</span
  >
{/snippet}

{#snippet drawing(strokes: Stroke[], w: number, h: number, view: string, spread: number, sw: number)}
  <svg
    use:ink={{ paths: strokes.length, spread, trigger, duration, version: strokes }}
    data-scroll-draw-pending=""
    data-ink={trigger}
    aria-hidden="true"
    width={w}
    height={h}
    viewBox={view}
    class="block overflow-visible absolute inset-0"
    fill="none"
    stroke={color}
    stroke-width={sw}
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    {#each strokes as k, i (i)}<path d={k.d} stroke={k.pen ? accent : undefined} stroke-width={k.pen ? sw * 1.15 : undefined} />{/each}
  </svg>
{/snippet}

{#if variant === 'bar'}
  <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label} class="w-full {className}">
    {#if label || showValue}
      <div class="mb-3 flex items-baseline justify-between gap-4">
        {#if label}<span class="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>{/if}
        {#if showValue}{@render figureText('font-serif text-2xl tracking-[-0.02em]')}{/if}
      </div>
    {/if}
    <div use:sized={(z) => (barWidth = z.w)} class="relative h-[30px] w-full">
      {#if bar}
        {#key barWidth}{@render drawing(bar, barWidth, BAR_H + 12, `0 0 ${barWidth} ${BAR_H + 12}`, 1, strokeWidth)}{/key}
      {/if}
    </div>
  </div>
{:else}
  <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label} class="inline-flex flex-col items-center {className}">
    <div class="relative" style:width="{size}px" style:height="{size}px">
      <!-- A ring drawn once in ink, then the band; a gauge's ticks clockwise, then the band and the needle. -->
      {#if round}{@render drawing(round, size, size, '0 0 100 100', variant === 'gauge' ? 0.8 : 0.6, roundWidth)}{/if}
      {#if showValue}
        {@render figureText(
          `absolute inset-x-0 text-center font-serif leading-none tracking-[-0.03em] ${variant === 'gauge' ? 'bottom-[4%]' : 'top-1/2 -translate-y-1/2'}`,
          `font-size: ${Math.round(size * (variant === 'gauge' ? 0.2 : 0.24))}px`,
        )}
      {/if}
    </div>
    {#if label}<span class="mt-4 max-w-[16rem] text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>{/if}
  </div>
{/if}
