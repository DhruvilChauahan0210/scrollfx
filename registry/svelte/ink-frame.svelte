<script lang="ts" module>
  /**
   * ink-frame — a border a pen draws round anything: a card, a figure, an
   * image, a quote. `rect` and `rounded` go round twice, ink then accent, never
   * quite on the same line; `double` draws a second, finer frame inside the
   * first; `corner-marks` sets crop marks at the corners, as on a proof.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, $lib/plotter and $lib/ink-core (installed with it).
   * Styling: Tailwind CSS. The frame draws on the box's edge: give the box its
   * own padding (and a `bg-card` if it should read as a sheet).
   *
   * What it frames (its children) is in the server HTML; the frame is made in
   * the browser at the size it finds, and made again when that changes.
   * Reduced motion shows it drawn.
   */
  import type { Snippet } from 'svelte';

  export interface InkFrameProps {
    children?: Snippet;
    variant?: 'rect' | 'rounded' | 'double' | 'corner-marks';
    /** The ink's colour. */
    color?: string;
    /** The accent pen's colour (the second pass, the inner frame). */
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
  import { FRAME_BLEED as BLEED, frameStrokes, ink, sized } from '$lib/ink-core';

  let {
    children,
    variant = 'rect',
    color = 'currentColor',
    accent = '#e0482a',
    strokeWidth = 1.1,
    seed = 1,
    trigger = 'scroll',
    duration = 1400,
    className = '',
  }: InkFrameProps = $props();

  let size = $state.raw<{ w: number; h: number } | null>(null);
  const strokes = $derived(size ? frameStrokes(variant, size.w, size.h, seed) : null);
  const n = $derived(strokes?.length ?? 0);
</script>

<div use:sized={(s) => (size = s)} class="relative {className}">
  {@render children?.()}
  {#if size && strokes}
    {#key `${size.w}x${size.h}`}
      <!-- The second pass follows the first; crop marks go down one corner after another. -->
      <svg
        use:ink={{ paths: n, spread: n > 1 ? 0.5 : 0, trigger, duration, version: `${size.w}x${size.h}` }}
        data-scroll-draw-pending=""
        data-ink={trigger}
        aria-hidden="true"
        width={size.w + 2 * BLEED}
        height={size.h + 2 * BLEED}
        viewBox="0 0 {size.w + 2 * BLEED} {size.h + 2 * BLEED}"
        class="pointer-events-none absolute overflow-visible"
        style:left="{-BLEED}px"
        style:top="{-BLEED}px"
        fill="none"
        stroke={color}
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        {#each strokes as s, i (i)}
          <path d={s.d} transform={s.at ? `translate(${s.at} ${s.at})` : undefined} stroke={s.pen ? accent : undefined} stroke-width={s.pen && variant === 'double' ? strokeWidth * 0.8 : undefined} />
        {/each}
      </svg>
    {/key}
  {/if}
</div>
