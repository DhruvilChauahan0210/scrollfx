<script lang="ts" module>
  /**
   * logos-plotted — a logo cloud between two rules a pen draws across the page,
   * each name set beside a simple mark the pen plots line by line as the row
   * arrives: rings, a hatched disc, nested triangles, waves, a ruled square, a
   * burst of rays.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The heading takes one
   * emphasised word between asterisks, set in `font-serif`.
   *
   * The default names are invented: pass your own customers, and swap each
   * cell's mark for their real logo if you have it. Names are in the server
   * HTML; the marks and rules are drawn in the browser, finishing as they reach
   * the middle of the screen. Reduced motion shows them drawn.
   */
  import type { MarkKind } from '$lib/plotter';

  export interface Logo {
    name: string;
    /** The mark drawn beside the name. */
    mark?: MarkKind;
    href?: string;
  }

  export interface LogosPlottedProps {
    eyebrow?: string;
    heading?: string;
    description?: string;
    logos?: Logo[];
    accent?: string;
    className?: string;
  }

  const MARKS: MarkKind[] = ['rings', 'disc', 'delta', 'grid', 'wave', 'burst'];
  // Each mark's lines draw one after another over this many trigger ranges (see scrollWindow).
  const SPREAD = 0.6;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollDraw } from 'svg-scroll-draw/svelte';
  import 'svg-scroll-draw/no-flash.css';
  import { logoMark, scrollWindow, seedOf, sketchLine, staggerFor, type Stroke } from '$lib/plotter';

  let {
    eyebrow = 'In good company',
    heading = 'Used by teams who *read* their numbers.',
    description = 'Invented names: replace them with your customers.',
    logos = [
      { name: 'Ferrowind', mark: 'rings' },
      { name: 'Quillstone', mark: 'disc' },
      { name: 'Marlow & Pike', mark: 'delta' },
      { name: 'Tessellate', mark: 'grid' },
      { name: 'Brightfold', mark: 'wave' },
      { name: 'Okkara', mark: 'burst' },
    ],
    accent = '#e0482a',
    className = '',
  }: LogosPlottedProps = $props();

  const parts = $derived(heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
  let drawn = $state<{ rules: Stroke[][]; marks: Stroke[][] } | null>(null);
  onMount(() => {
    drawn = {
      rules: [sketchLine({ w: 1000, h: 12, seed: 11 }), sketchLine({ w: 1000, h: 12, seed: 29 })],
      marks: logos.map((l, i) => logoMark(l.mark ?? MARKS[i % MARKS.length], 40, seedOf(l.name))),
    };
  });
</script>

<section class="mx-auto max-w-7xl px-6 py-28 sm:px-10 {className}">
  <div class="flex flex-wrap items-end justify-between gap-6">
    <div class="max-w-2xl">
      <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h2 class="mt-6 font-serif text-[clamp(2rem,3.6vw,3rem)] leading-[1.02] tracking-[-0.025em]">
        {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
      </h2>
    </div>
    {#if description}<p class="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{description}</p>{/if}
  </div>

  <div class="mt-12">
    {@render rule(0)}
    <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {#each logos as l, i (l.name)}
        <li class="flex items-center justify-center py-10">
          {#if l.href}
            <a href={l.href} class="flex items-center gap-3 opacity-80 transition-opacity hover:opacity-100">{@render body(l, i)}</a>
          {:else}
            <span class="flex items-center gap-3 opacity-80">{@render body(l, i)}</span>
          {/if}
        </li>
      {/each}
    </ul>
    {@render rule(1)}
  </div>
</section>

{#snippet rule(r: number)}
  <!-- A rule across the section, ink then accent, left to right. -->
  <div class="relative h-3 w-full">
    {#if drawn}
      <div data-scroll-draw-pending="" use:scrollDraw={{ stagger: 0.5, easing: 'linear', trigger: scrollWindow(0.5) }} class="absolute inset-0" aria-hidden="true">
        <svg viewBox="0 0 1000 12" preserveAspectRatio="none" class="block size-full" fill="none" stroke-width="1" stroke-linecap="round">
          {#each drawn.rules[r] as s, k (k)}<path d={s.d} stroke={s.pen ? accent : 'currentColor'} />{/each}
        </svg>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet body(l: Logo, i: number)}
  <span class="relative size-9 shrink-0">
    {#if drawn}
      <div data-scroll-draw-pending="" use:scrollDraw={{ stagger: staggerFor(drawn.marks[i].length, SPREAD), easing: 'linear', trigger: scrollWindow(SPREAD) }} class="absolute inset-0" aria-hidden="true">
        <svg viewBox="0 0 40 40" class="size-full" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          {#each drawn.marks[i] as s, k (k)}<path d={s.d} />{/each}
        </svg>
      </div>
    {/if}
  </span>
  <span class="font-serif text-xl tracking-[-0.015em]">{l.name}</span>
{/snippet}
