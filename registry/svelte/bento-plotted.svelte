<script lang="ts" module>
  /**
   * bento-plotted — a bento grid of cards in mixed sizes, each with a drawing of
   * its own a pen plots as the card arrives: a moiré of two ring sets, a
   * Lissajous knot, a rosette, ridgelines and a wireframe globe.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The heading takes one
   * emphasised word between asterisks, set in `font-serif`. Cards are `bg-card` sheets.
   *
   * The default cards are samples: pass your own. The first card is the large
   * one; the next two stack beside it and the last two share a row. Copy is in
   * the server HTML; the drawings are made in the browser, each finishing as
   * its card's drawing reaches the middle of the screen. Reduced motion shows
   * them drawn.
   */
  import { globe, lissajous, moire, ridgelines, rosette, type Stroke } from '$lib/plotter';

  type Art = 'moire' | 'lissajous' | 'rosette' | 'ridgelines' | 'globe';

  export interface BentoCard {
    title: string;
    body: string;
    art?: Art;
  }

  export interface BentoPlottedProps {
    eyebrow?: string;
    heading?: string;
    description?: string;
    cards?: BentoCard[];
    accent?: string;
    className?: string;
  }

  /** Each drawing with its viewBox and its pen weight, in viewBox units (about a pixel on screen). */
  const ART: Record<Art, { box: [number, number]; weight: number; draw: () => Stroke[] }> = {
    moire: { box: [400, 400], weight: 0.6, draw: () => moire({ seed: 5 }) },
    lissajous: { box: [400, 400], weight: 1, draw: () => lissajous(2) },
    rosette: { box: [100, 100], weight: 0.3, draw: () => rosette(14) },
    ridgelines: { box: [600, 220], weight: 1.2, draw: () => ridgelines({ seed: 4, w: 600, h: 220, rows: 12 }) },
    globe: { box: [600, 220], weight: 1.2, draw: () => globe({ w: 600, h: 220, step: 15 }) },
  };
  const ARTS: Art[] = ['moire', 'lissajous', 'rosette', 'ridgelines', 'globe'];
  // The card spans in a six-column grid on large screens, by position.
  const SPANS = ['lg:col-span-4 lg:row-span-2', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-3'];
  // Each drawing's strokes are spread over this many trigger ranges (see scrollWindow).
  // A drawing of one line (the rosette) has nothing to spread.
  const SPREAD = 0.8;
  const spreadFor = (paths: number) => (paths > 1 ? SPREAD : 0);

  const split = (text: string) => text.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p }));
  const artOf = (c: BentoCard, i: number) => c.art ?? ARTS[i % ARTS.length];
  const frame = (c: BentoCard, i: number) => {
    if (i === 0) return 'aspect-square sm:aspect-[16/10] lg:aspect-auto lg:min-h-[22rem] lg:flex-1';
    const [w, h] = ART[artOf(c, i)].box;
    return w > h ? 'aspect-[600/220]' : 'aspect-[4/3]';
  };
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollDraw } from 'svg-scroll-draw/svelte';
  import 'svg-scroll-draw/no-flash.css';
  import { scrollWindow, staggerFor } from '$lib/plotter';

  let {
    eyebrow = 'At a glance',
    heading = 'Everything, *in its place*.',
    description = 'Sample cards: put your own features in them.',
    cards = [
      { title: 'One place for *everything*.', body: 'Sample copy: the feature you lead with, given the most room. Say what it does in a sentence or two.', art: 'moire' },
      { title: 'Fast by default', body: 'Sample copy: a second feature, in a line.', art: 'lissajous' },
      { title: 'Yours to shape', body: 'Sample copy: a third feature, in a line.', art: 'rosette' },
      { title: 'Built for the long run', body: 'Sample copy: a wider card for a feature that needs a sentence more.', art: 'ridgelines' },
      { title: 'Wherever you work', body: 'Sample copy: the last card, beside it on the same row.', art: 'globe' },
    ],
    accent = '#e0482a',
    className = '',
  }: BentoPlottedProps = $props();

  const parts = $derived(split(heading));
  let drawings = $state<Stroke[][] | null>(null);
  onMount(() => {
    drawings = cards.map((c, i) => ART[artOf(c, i)].draw());
  });
</script>

<section class="mx-auto max-w-7xl px-6 py-28 sm:px-10 {className}">
  <div class="max-w-2xl">
    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
    <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
      {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
    </h2>
    {#if description}<p class="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{description}</p>{/if}
  </div>

  <ul class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
    {#each cards as c, i (c.title)}
      {@const [w, h] = ART[artOf(c, i)].box}
      {@const weight = ART[artOf(c, i)].weight}
      <li class="flex flex-col rounded-[3px] bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-24px_rgba(40,30,10,.3)] sm:p-8 dark:shadow-[0_0_0_1px_rgba(255,255,255,.05)] {i === 0 ? 'sm:col-span-2' : ''} {SPANS[i] ?? 'lg:col-span-2'}">
        <div class="relative w-full {frame(c, i)}">
          {#if drawings}
            <div data-scroll-draw-pending="" use:scrollDraw={{ stagger: staggerFor(drawings[i].length, SPREAD), easing: 'linear', trigger: scrollWindow(spreadFor(drawings[i].length)) }} class="absolute inset-0" aria-hidden="true">
              <svg viewBox="0 0 {w} {h}" class="size-full" fill="none" stroke="currentColor" stroke-width={weight} stroke-linecap="round" stroke-linejoin="round">
                {#each drawings[i] as s, k (k)}{#if s.pen}<path d={s.d} stroke={accent} stroke-width={weight * 1.5} />{:else}<path d={s.d} />{/if}{/each}
              </svg>
            </div>
          {/if}
        </div>
        <h3 class="mt-6 font-serif tracking-[-0.02em] {i === 0 ? 'text-4xl' : 'text-2xl'}">
          {#each split(c.title) as p, k (k)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
        </h3>
        <p class="mt-2 text-pretty text-[15px] leading-relaxed text-muted-foreground">{c.body}</p>
      </li>
    {/each}
  </ul>
</section>
