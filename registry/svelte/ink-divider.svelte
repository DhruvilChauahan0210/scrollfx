<script lang="ts" module>
  /**
   * ink-divider — a rule between sections that a pen draws across the page:
   * straight, wavy, sketchy (ruled twice, ink then accent), dotted, or a pair
   * of rules drawn outward from a label in the middle.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, $lib/plotter and $lib/ink-core (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens; it takes the width it is given.
   *
   * The label is in the server HTML; the rules are made in the browser at the
   * width they find, and made again when it changes. Reduced motion shows them
   * drawn.
   */
  export interface InkDividerProps {
    variant?: 'straight' | 'wavy' | 'sketchy' | 'dotted' | 'with-label';
    /** The words in the middle, for `with-label`. */
    label?: string;
    /** The ink's colour. */
    color?: string;
    /** The accent pen's colour (the sketchy second pass, the label's dots). */
    accent?: string;
    strokeWidth?: number;
    seed?: number;
    /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
    trigger?: 'scroll' | 'view';
    /** With `view`, the drawing's length in ms. */
    duration?: number;
    className?: string;
  }
</script>

<script lang="ts">
  import 'svg-scroll-draw/no-flash.css';
  import { sketchCircle, type Stroke } from '$lib/plotter';
  import { DIVIDER_H as H, dividerLabelRule, dividerSpread, dividerStrokes, ink, sized } from '$lib/ink-core';

  let {
    variant = 'straight',
    label = 'Section',
    color = 'currentColor',
    accent = '#e0482a',
    strokeWidth = 1.1,
    seed = 1,
    trigger = 'scroll',
    duration = 1200,
    className = '',
  }: InkDividerProps = $props();

  type Side = 'left' | 'right' | 'main';
  /** Each rule's box, measured; a rule is drawn across the width it finds. */
  let widths = $state<Partial<Record<Side, number>>>({});

  function strokesFor(side: Side, w: number): Stroke[] {
    if (side === 'left' || side === 'right') return dividerLabelRule(side, w, seed);
    return dividerStrokes(variant as Exclude<typeof variant, 'with-label'>, w, seed);
  }

  /** The small rings in the accent pen beside the label, made in the browser. */
  let dots = $state.raw<Stroke[][]>([[], []]);
  $effect(() => {
    dots = [sketchCircle({ size: 10, seed: seed + 1, r: 2.6 }), sketchCircle({ size: 10, seed: seed + 2, r: 2.6 })];
  });
</script>

<!-- One rule, drawn across the box it is given. Two beside the label are drawn outward from it, both at once; dots go down one after another, left to right; the sketchy rule's second pass follows the first. -->
{#snippet rule(side: Side)}
  <div use:sized={(s) => (widths[side] = s.w)} class="relative h-4 min-w-0 flex-1">
    {#if widths[side] && widths[side] > 4}
      {@const w = widths[side]}
      {@const strokes = strokesFor(side, w)}
      {#key w}
        <svg
          use:ink={{ paths: strokes.length, spread: side === 'main' ? dividerSpread(variant, strokes.length) : 0, trigger, duration, version: w }}
          data-scroll-draw-pending=""
          data-ink={trigger}
          aria-hidden="true"
          width={w}
          height={H}
          viewBox="0 0 {w} {H}"
          class="absolute inset-0 block overflow-visible"
          fill="none"
          stroke={color}
          stroke-width={side === 'main' && variant === 'dotted' ? strokeWidth * 1.7 : strokeWidth}
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {#each strokes as s, i (i)}<path d={s.d} stroke={s.pen ? accent : undefined} />{/each}
        </svg>
      {/key}
    {/if}
  </div>
{/snippet}

<!-- A small ring in the accent pen beside the label. -->
{#snippet dot(strokes: Stroke[])}
  {#key strokes}
    <svg
      use:ink={{ paths: strokes.length, trigger, duration: duration * 0.4, version: strokes }}
      data-scroll-draw-pending=""
      data-ink={trigger}
      aria-hidden="true"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      class="shrink-0 overflow-visible"
      fill="none"
      stroke={accent}
      stroke-width={strokeWidth * 1.2}
      stroke-linecap="round"
    >
      {#each strokes as s, i (i)}<path d={s.d} />{/each}
    </svg>
  {/key}
{/snippet}

{#if variant === 'with-label'}
  <div role="separator" aria-label={label} class="flex items-center gap-3 {className}">
    {@render rule('left')}
    {@render dot(dots[0])}
    <span class="shrink-0 px-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
    {@render dot(dots[1])}
    {@render rule('right')}
  </div>
{:else}
  <div role="separator" class="flex {className}">
    {@render rule('main')}
  </div>
{/if}
