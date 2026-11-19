<script lang="ts" module>
  /**
   * ink-stamp — a short word or two set inside a stamp a pen plots round it: a
   * round stamp with a line of text running round its rim, a rectangle ruled
   * twice, or a seal with a scalloped edge. Set a little askew, as a stamp
   * lands.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, $lib/plotter and $lib/ink-core (installed with it).
   * Styling: Tailwind CSS. The whole stamp is in the one `accent` colour, as a
   * stamp is in one ink.
   *
   * The words (its children), and the rim's text on its circle, are in the
   * server HTML; the rings and the frame are made in the browser. Reduced
   * motion shows them drawn. The words' size is set to fit their longest word
   * inside the inner ring, read from the words once they are in the page.
   */
  import type { Snippet } from 'svelte';

  export interface InkStampProps {
    /** The words in the middle: keep them short. */
    children?: Snippet;
    variant?: 'circle' | 'rectangle' | 'seal';
    /** A line of text round the rim, for `circle` and `seal`. It is spaced to go once round. */
    rim?: string;
    /** The width and height of `circle` and `seal`, in px. */
    size?: number;
    /** How far the stamp is turned, in degrees. */
    rotate?: number;
    /** The stamp's ink. */
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
  import { seedOf, stampRings, type Stroke } from '$lib/plotter';
  import { ink, sized, stampFrame, stampLayout } from '$lib/ink-core';

  let {
    children,
    variant = 'circle',
    rim,
    size = 148,
    rotate = -8,
    accent = '#e0482a',
    strokeWidth = 1.4,
    seed,
    trigger = 'scroll',
    duration = 1400,
    className = '',
  }: InkStampProps = $props();

  const id = $props.id();
  const s = $derived(seed ?? seedOf(`${variant}${rim ?? ''}`));

  // The words, read from the page once they are in it: a snippet's text is not known before it renders.
  let wordsEl = $state<HTMLElement>();
  let words = $state<string>();
  $effect(() => {
    words = wordsEl?.textContent?.trim() || undefined;
  });
  /** The rim's circle and type, and the words' size. */
  const layout = $derived(stampLayout(variant === 'seal' ? 'seal' : 'circle', size, words));

  // A round stamp's rings, made in the browser.
  let rings = $state.raw<Stroke[] | null>(null);
  $effect(() => {
    if (variant !== 'rectangle') rings = stampRings({ size: 100, seed: s, kind: variant });
  });

  // A rectangle sizes to its words: ruled twice round the edge, then once more, finer, inside.
  let measured = $state.raw<{ w: number; h: number } | null>(null);
  const frame = $derived(variant === 'rectangle' && measured ? stampFrame(measured.w, measured.h, s) : null);
</script>

{#if variant === 'rectangle'}
  <span use:sized={(z) => (measured = z)} class="relative inline-flex items-center justify-center px-7 py-4 {className}" style:rotate="{rotate}deg" style:color={accent}>
    <span class="font-mono text-[15px] font-semibold uppercase leading-none tracking-[0.28em]">{@render children?.()}</span>
    {#if measured && frame}
      {#key `${measured.w}x${measured.h}`}
        <svg
          use:ink={{ paths: frame.length, spread: 0.6, trigger, duration, version: frame }}
          data-scroll-draw-pending=""
          data-ink={trigger}
          aria-hidden="true"
          width={measured.w}
          height={measured.h}
          viewBox="0 0 {measured.w} {measured.h}"
          class="pointer-events-none absolute inset-0 overflow-visible"
          fill="none"
          stroke={accent}
          stroke-width={strokeWidth}
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {#each frame as k, i (i)}<path d={k.d} />{/each}
        </svg>
      {/key}
    {/if}
  </span>
{:else}
  <span class="relative inline-grid shrink-0 place-items-center {className}" style:width="{size}px" style:height="{size}px" style:rotate="{rotate}deg" style:color={accent}>
    {#if rim}
      <!-- The rim's text sits in the band between the outer rings and the inner one. -->
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 {size} {size}" class="absolute inset-0 overflow-visible">
        <defs>
          <path id="{id}-rim" d={layout.circle} />
        </defs>
        <text fill="currentColor" class="font-mono uppercase" style:font-size="{layout.rimFont}px" style:letter-spacing="0.12em" dominant-baseline="central">
          <textPath href="#{id}-rim" textLength={layout.rimLength} lengthAdjust="spacing">{rim}</textPath>
        </text>
      </svg>
    {/if}
    <span class="max-w-[60%] text-center font-mono font-semibold uppercase leading-tight tracking-[0.2em]" style:font-size="{layout.wordFont}px"
      ><span bind:this={wordsEl} class="contents">{@render children?.()}</span>{#if rim}<span class="sr-only">{` — ${rim}`}</span>{/if}</span
    >
    {#if rings}
      <svg
        use:ink={{ paths: rings.length, spread: 0.6, trigger, duration, version: rings }}
        data-scroll-draw-pending=""
        data-ink={trigger}
        aria-hidden="true"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        class="pointer-events-none absolute inset-0 overflow-visible"
        fill="none"
        stroke={accent}
        stroke-width={strokeWidth * (100 / size)}
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        {#each rings as k, i (i)}<path d={k.d} />{/each}
      </svg>
    {/if}
  </span>
{/if}
