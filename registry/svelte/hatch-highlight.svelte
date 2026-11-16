<script lang="ts" module>
  /**
   * hatch-highlight — a large statement whose key phrases a pen hatches over as
   * they are read: diagonal strokes plotted one after another, the way you would
   * mark up a proof.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The statement is set in `font-serif`.
   *
   * Mark a phrase with asterisks: `Most sections *sit still*.` Each mark is
   * measured and hatched to fit, and again when the layout changes. The words
   * are plain text throughout. Reduced motion shows the hatching drawn.
   */
  export interface HatchHighlightProps {
    eyebrow?: string;
    /** The statement. Phrases between asterisks get hatched. */
    text?: string;
    /** The hatching's colour. */
    accent?: string;
    className?: string;
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollDraw } from 'svg-scroll-draw/svelte';
  import 'svg-scroll-draw/no-flash.css';
  import { hatch, scrollWindow, staggerFor, type Stroke } from '$lib/plotter';

  let {
    eyebrow = 'In short',
    text = 'Most sections *sit still*. These are *drawn in* as you read, every line plotted by a pen that keeps pace *with the reader*.',
    accent = '#e0482a',
    className = '',
  }: HatchHighlightProps = $props();

  // Each part, and for a mark its index among the marks.
  const parts = $derived.by(() => {
    let mark = 0;
    return text.split(/(\*[^*]+\*)/).map((p) => (p.startsWith('*') ? { mark: mark++, text: p.slice(1, -1) } : { mark: -1, text: p }));
  });

  // One box per mark, measured from the page and hatched to fit.
  const marks: HTMLElement[] = $state([]);
  let boxes = $state<Record<number, { w: number; h: number; lines: Stroke[] }>>({});
  const measure = () => {
    const next: typeof boxes = {};
    marks.forEach((el, i) => {
      if (!el) return;
      const w = Math.round(el.offsetWidth + 12);
      const h = Math.round(el.offsetHeight * 0.62);
      const old = boxes[i];
      next[i] = old && old.w === w && old.h === h ? old : { w, h, lines: hatch({ w, h, gap: 5, angle: 62 }) };
    });
    boxes = next;
  };
  onMount(() => {
    measure();
    const ro = new ResizeObserver(measure);
    marks.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  });
</script>

<section class="mx-auto max-w-5xl px-6 py-32 sm:px-10 {className}">
  <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
  <div class="mt-10 text-balance font-serif text-[clamp(2.2rem,4.8vw,4.4rem)] leading-[1.12] tracking-[-0.025em]">
    {#each parts as p, i (i)}
      {#if p.mark >= 0}
        <span bind:this={marks[p.mark]} class="relative isolate inline-block whitespace-nowrap">
          {#if boxes[p.mark]}
            {@const box = boxes[p.mark]}
            {#key `${box.w}x${box.h}`}
              <!-- Hatched as the phrase rises, the last stroke landing as it reaches the middle of the screen. -->
              <span data-scroll-draw-pending="" use:scrollDraw={{ stagger: staggerFor(box.lines.length, 1), easing: 'linear', trigger: scrollWindow(1) }} class="absolute -left-1.5 top-[30%] -z-10 block" aria-hidden="true">
                <svg width={box.w} height={box.h} viewBox="0 0 {box.w} {box.h}" fill="none" stroke={accent} stroke-width="1.6" stroke-linecap="round" class="block opacity-80">
                  {#each box.lines as l, k (k)}<path d={l.d} />{/each}
                </svg>
              </span>
            {/key}
          {/if}
          {p.text}
        </span>
      {:else}
        <span>{p.text}</span>
      {/if}
    {/each}
  </div>
</section>
