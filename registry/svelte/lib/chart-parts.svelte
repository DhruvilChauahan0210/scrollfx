<svelte:options runes={true} />

<script lang="ts" module>
  /**
   * chart-parts — what the scrollfx charts share, in Svelte 5, as snippets to
   * {@render}: the pens layered in one box, the labels up the left and along
   * the bottom, the key, and the data table for screen readers; and `sized`,
   * the action that measures the box. The sums behind them (scales, ticks,
   * curves, hatching and when each pen works) are in $lib/chart-core, which
   * the React and Vue charts share.
   *
   * Strokes are made in the browser at the chart's measured size, so hatching
   * keeps the same spacing at any width. Labels, ticks and the data table are
   * plain HTML, rendered on the server.
   *
   * Part of scrollfx (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   */
  import { scrollDraw } from 'svg-scroll-draw/svelte';
  import { LABEL, penLayers, penOptions, swatch, watchSize, xLabels, yLabelTop, yLabelsWidth, type ChartTrigger, type LegendKind, type Pen, type Series, type Size, type Tick } from '$lib/chart-core';

  /**
   * The box's size in CSS pixels, handed to `set` once it is in the page (so
   * the server HTML carries no strokes) and again when it changes, later
   * changes (a phone turning) settling for a moment first.
   */
  export function sized(node: HTMLElement, set: (size: Size) => void) {
    return { destroy: watchSize(node, set) };
  }

  export { Pens, YLabels, XLabels, Legend, DataTable };
</script>

<!-- The pens, layered in order in one box: each its own svg-scroll-draw drawing. -->
{#snippet Pens(size: Size, pens: Pen[], trigger: ChartTrigger = 'scroll', duration = 1800)}
  {#each penLayers(size, pens) as { pen: p, key } (key)}
    <div data-scroll-draw-pending="" use:scrollDraw={penOptions(p, trigger, duration)} class="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg viewBox="0 0 {size.w} {size.h}" data-ink={trigger} class="block size-full overflow-visible" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        {#each p.marks as m, j (j)}<path d={m.d} stroke={m.color} stroke-width={m.width ?? 1} opacity={m.opacity} />{/each}
      </svg>
    </div>
  {/each}
{/snippet}

<!-- Labels up the left of a plot, each centred on its fraction of the height (0 at the bottom). -->
{#snippet YLabels(ticks: Tick[])}
  <div data-slot="y-labels" class="relative shrink-0 {LABEL} tabular-nums" style:width="{yLabelsWidth(ticks)}ch">
    {#each ticks as t, i (i)}<span class="absolute right-[1ch] -translate-y-1/2 whitespace-nowrap leading-none" style:top={yLabelTop(t)}>{t.label}</span>{/each}
  </div>
{/snippet}

<!--
  Labels along the bottom, each centred on its fraction of the width; the ones
  at the very ends align inward so they stay inside. Where the chart is too
  narrow for them all (a container query, so it holds in a card as on a phone),
  every other one goes, then all but every fourth.
-->
{#snippet XLabels(ticks: Tick[], offset?: string)}
  <div data-slot="x-labels" class="@container relative mt-2.5 h-4 {LABEL} tabular-nums" style:margin-left={offset}>
    {#each xLabels(ticks) as t, i (i)}<span class={t.className} style:left={t.left}>{t.label}</span>{/each}
  </div>
{/snippet}

<!-- A key: a small swatch for each series, drawn as its strokes are, beside its label. -->
{#snippet Legend(series: Series[], kind: LegendKind, className = '')}
  <ul data-slot="legend" class="flex flex-wrap items-center gap-x-6 gap-y-2 {LABEL} {className}">
    {#each series as s (s.key)}
      <li class="flex items-center gap-2">
        <svg viewBox="0 0 18 12" class="h-3 w-[18px] shrink-0 overflow-visible" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          {#each swatch(s, kind) as p, i (i)}<path d={p.d} stroke={p.stroke} stroke-width={p.width} opacity={p.opacity} fill={p.fill} />{/each}
        </svg>
        <span class="text-foreground/80">{s.label}</span>
      </li>
    {/each}
  </ul>
{/snippet}

<!-- The numbers behind a chart, as a table only screen readers see. -->
{#snippet DataTable(caption: string, head: string[], rows: (string | number)[][])}
  <table class="sr-only">
    <caption>{caption}</caption>
    <thead><tr>{#each head as c, i (i)}<th scope="col">{c}</th>{/each}</tr></thead>
    <tbody>
      {#each rows as r, i (i)}<tr>{#each r as c, j (j)}{#if j === 0}<th scope="row">{c}</th>{:else}<td>{c}</td>{/if}{/each}</tr>{/each}
    </tbody>
  </table>
{/snippet}
