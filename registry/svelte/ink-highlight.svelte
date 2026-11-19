<script lang="ts" module>
  /**
   * ink-highlight — a mark a pen makes on words in running text: an underline,
   * a double underline, a loop round them, a box, a line struck through, or
   * hatching behind. It sits inline in a paragraph and follows the words when
   * they wrap: each line the phrase takes gets its own mark, drawn in turn.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, $lib/plotter and $lib/ink-core (installed with it).
   * Styling: Tailwind CSS. The words keep the paragraph's own type and colour.
   *
   *   <p>Most sections <InkHighlight variant="circle">sit still</InkHighlight>.</p>
   *
   * The words are plain text in the server HTML; the marks are made in the
   * browser, measured to the words, and made again when the layout changes.
   * Reduced motion shows them drawn.
   */
  import type { Snippet } from 'svelte';

  export interface InkHighlightProps {
    children?: Snippet;
    variant?: 'underline' | 'double-underline' | 'circle' | 'box' | 'strike' | 'hatch-fill';
    /** The pen's colour. */
    accent?: string;
    strokeWidth?: number;
    /** Shapes the marks; the same seed draws the same marks. */
    seed?: number;
    /** `scroll`: drawn as the words rise, done at mid-screen. `view`: played once as they come into view. */
    trigger?: 'scroll' | 'view';
    /** With `view`, how long each line's mark takes, in ms. */
    duration?: number;
    /** The element the words sit in: `mark` by default, `s` for a strike. */
    as?: string;
    className?: string;
  }
</script>

<script lang="ts">
  import 'svg-scroll-draw/no-flash.css';
  import { blockOf, highlightMark, highlightSpread, ink, measureLines, type InkMark } from '$lib/ink-core';

  let {
    children,
    variant = 'underline',
    accent = '#e0482a',
    strokeWidth = 1.8,
    seed = 1,
    trigger = 'scroll',
    duration = 900,
    as,
    className = '',
  }: InkHighlightProps = $props();

  let root = $state<HTMLElement>();
  let origin = $state<HTMLElement>();
  /** One mark per line the words take, sized to that line's box. */
  let marks = $state.raw<InkMark[]>([]);

  $effect(() => {
    const el = root, o = origin, v = variant, s = seed;
    if (!el || !o) return;
    let last = '';
    const measure = () => {
      const lines = measureLines(el, o);
      const sig = JSON.stringify(lines);
      if (sig === last) return;
      last = sig;
      marks = lines.map((r, i) => highlightMark(v, r, s + i * 7));
    };
    measure();
    // Words reflow when their block changes width, or when a web font arrives.
    const ro = new ResizeObserver(measure);
    ro.observe(blockOf(el));
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  });
</script>

<!-- <mark>'s own yellow and black are reset here; `className` goes on the words inside, so a colour passed in wins. Written without spaces between the tags, which would show in the line. -->
<svelte:element this={as ?? (variant === 'strike' ? 's' : 'mark')} bind:this={root} class="relative bg-transparent text-inherit no-underline {variant === 'hatch-fill' ? 'isolate' : ''}"
  ><span bind:this={origin} aria-hidden="true" class="pointer-events-none absolute left-0 top-0 size-0"></span
  >{#if className}<span class={className}>{@render children?.()}</span>{:else}{@render children?.()}{/if}{#each marks as m, i (`${i}:${m.x},${m.y},${m.w}x${m.h}`)}<svg
      use:ink={{ paths: m.strokes.length, spread: highlightSpread(variant, m.strokes.length), trigger, duration, version: m }}
      data-scroll-draw-pending=""
      data-ink={trigger}
      aria-hidden="true"
      width={m.w}
      height={m.h}
      viewBox="0 0 {m.w} {m.h}"
      class="pointer-events-none absolute overflow-visible {variant === 'hatch-fill' ? '-z-10 opacity-80' : ''}"
      style:left="{m.x}px"
      style:top="{m.y}px"
      fill="none"
      stroke={accent}
      stroke-width={variant === 'hatch-fill' ? strokeWidth * 0.9 : strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      >{#each m.strokes as s, k (k)}<path d={s.d} />{/each}</svg
    >{/each}</svelte:element
>
