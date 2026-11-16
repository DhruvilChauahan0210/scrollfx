<script lang="ts" module>
  /**
   * team-plotted — the people behind the product, each over a fingerprint a pen
   * draws ring by ring, from the core outward, as their card arrives. The print
   * is seeded from the person's name, so everyone has one of their own, the same
   * every time.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The heading takes one
   * emphasised word between asterisks, set in `font-serif`. Cards are `bg-card` sheets.
   *
   * The default people are samples: pass your own team. Names and roles are in
   * the server HTML; the prints are drawn in the browser, each finishing as its
   * card reaches the middle of the screen. Reduced motion shows them drawn.
   */
  export interface Person {
    name: string;
    role: string;
    /** A line about them. */
    note?: string;
  }

  export interface TeamPlottedProps {
    eyebrow?: string;
    heading?: string;
    description?: string;
    people?: Person[];
    accent?: string;
    className?: string;
  }

  // The rings draw one after another over this many trigger ranges (see scrollWindow).
  const SPREAD = 0.6;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollDraw } from 'svg-scroll-draw/svelte';
  import 'svg-scroll-draw/no-flash.css';
  import { fingerprint, scrollWindow, seedOf, staggerFor, type Stroke } from '$lib/plotter';

  let {
    eyebrow = 'The people',
    heading = 'Made by a *small* team.',
    description = 'Sample people: replace them with your own.',
    people = [
      { name: 'Lena Ortiz', role: 'Founder', note: 'Ran data for a logistics company for nine years.' },
      { name: 'Sam Okafor', role: 'Engineering', note: 'Builds the query engine and keeps it fast.' },
      { name: 'Mira Chen', role: 'Design', note: 'Turns tables into pictures people read.' },
      { name: 'Theo Varga', role: 'Customers', note: 'Answers every message within a day.' },
    ],
    accent = '#e0482a',
    className = '',
  }: TeamPlottedProps = $props();

  const parts = $derived(heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
  let prints = $state<Stroke[][] | null>(null);
  onMount(() => {
    prints = people.map((p) => fingerprint(seedOf(p.name), 100));
  });
</script>

<section class="mx-auto max-w-7xl px-6 py-28 sm:px-10 {className}">
  <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
  <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
    {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
  </h2>
  {#if description}<p class="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{description}</p>{/if}

  <ul class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {#each people as p, i (p.name)}
      <li class="flex flex-col rounded-[3px] bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-24px_rgba(40,30,10,.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05)]">
        <div class="relative aspect-square w-full">
          {#if prints}
            <div data-scroll-draw-pending="" use:scrollDraw={{ stagger: staggerFor(prints[i].length, SPREAD), easing: 'linear', trigger: scrollWindow(SPREAD) }} class="absolute inset-0" aria-hidden="true">
              <svg viewBox="0 0 100 100" class="size-full" fill="none" stroke={i === 0 ? accent : 'currentColor'} stroke-width="0.7" stroke-linecap="round">
                {#each prints[i] as r, k (k)}<path d={r.d} />{/each}
              </svg>
            </div>
          {/if}
        </div>
        <p class="mt-6 font-serif text-2xl tracking-[-0.015em]">{p.name}</p>
        <p class="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{p.role}</p>
        {#if p.note}<p class="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground">{p.note}</p>{/if}
      </li>
    {/each}
  </ul>
</section>
