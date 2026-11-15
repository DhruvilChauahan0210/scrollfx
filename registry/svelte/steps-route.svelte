<script lang="ts" module>
  /**
   * steps-route — how it works, as a route on a map: numbered stops a pen rings
   * in turn, joined by a line that wanders from one to the next and ends on a
   * cross in the accent colour. On a phone the steps stack beside a rail that
   * inks down as you read.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The heading takes one
   * emphasised word between asterisks, set in `font-serif`.
   *
   * The steps are plain text in the server HTML; the route is drawn in the
   * browser. Reduced motion shows it drawn.
   */
  export interface Step {
    title: string;
    body: string;
  }

  export interface StepsRouteProps {
    eyebrow?: string;
    heading?: string;
    steps?: Step[];
    accent?: string;
    seed?: number;
    className?: string;
  }

  const W = 1000, H = 140, R = 26;
  /** A ring round a stop, drawn as one stroke that overshoots its start a little, as a pen does. */
  const ring = (x: number, y: number, r: number) => `M${x + r} ${y}A${r} ${r} 0 1 1 ${x + r * Math.cos(-0.35)} ${y + r * Math.sin(-0.35)}`;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollAnimate, scrollDraw } from 'svg-scroll-draw/svelte';
  import { route, scrollWindow, staggerFor } from '$lib/plotter';

  let {
    eyebrow = 'How it works',
    heading = 'Four stops, *one* line.',
    steps = [
      { title: 'Connect a source', body: 'Point it at your database, your warehouse or an event stream. Read-only, and nothing is copied until you say so.' },
      { title: 'Pick what matters', body: 'Choose the tables and events to watch. Sensible dashboards are drafted for you from what it finds.' },
      { title: 'Share the view', body: 'Invite the team, schedule the reports, and set the alerts that should wake someone up.' },
      { title: 'Decide faster', body: 'Every number on the screen is live, and every one opens into the rows behind it.' },
    ],
    accent = '#e0482a',
    seed = 5,
    className = '',
  }: StepsRouteProps = $props();

  const parts = $derived(heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
  const xs = $derived(steps.map((_, i) => ((i + 0.5) / steps.length) * W));
  const cross = $derived.by(() => {
    const x = xs[xs.length - 1], y = H / 2 - R - 14;
    return `M${x - 9} ${y - 9}L${x + 9} ${y + 9}M${x + 9} ${y - 9}L${x - 9} ${y + 9}`;
  });

  // Ring, leg, ring, leg: the pen travels from stop to stop. Each leg leaves a
  // ring on its edge, so the line never crosses a number.
  let legs = $state<string[] | null>(null);
  onMount(() => {
    const stops = xs.map((x): [number, number] => [x, H / 2]);
    legs = stops.slice(0, -1).map(([x, y], i) => route([[x + R + 4, y], [stops[i + 1][0] - R - 4, y]], seed + i, 0.9));
  });
</script>

<section class="mx-auto max-w-7xl px-6 py-28 sm:px-10 {className}">
  <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
  <h2 class="mt-6 max-w-3xl font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
    {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
  </h2>

  <!-- Wide screens: the route runs across above the steps. -->
  <div class="relative mt-20 hidden aspect-[1000/140] md:block">
    {#if legs}
      <!-- The pen reaches the last stop as the route reaches the middle of the screen. -->
      <div use:scrollDraw={{ stagger: staggerFor(2 * steps.length, 1.5), easing: 'linear', trigger: scrollWindow(1.5) }} class="absolute inset-0" aria-hidden="true">
        <svg viewBox="0 0 {W} {H}" class="size-full overflow-visible" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
          {#each xs as x, i (i)}
            <path d={ring(x, H / 2, R)} />
            {#if legs[i]}<path d={legs[i]} />{/if}
          {/each}
          <path d={cross} stroke={accent} stroke-width="2.2" />
        </svg>
      </div>
    {/if}
    {#each xs as x, i (i)}
      <span class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-2xl" style="left: {(x / W) * 100}%">{i + 1}</span>
    {/each}
  </div>

  <ol class="relative mt-14 grid gap-12 md:mt-10 md:grid-cols-[repeat(var(--steps),minmax(0,1fr))] md:gap-10" style="--steps: {steps.length}">
    <!-- Phones: a hairline rail beside the steps, and the ink that runs down it. -->
    <div aria-hidden="true" class="absolute bottom-2 left-6 top-2 w-px bg-border md:hidden"></div>
    <div aria-hidden="true" use:scrollAnimate={{ props: { transform: ['scaleY(0)', 'scaleY(1)'] }, trigger: { start: 'top 70%', end: 'bottom 70%' }, easing: 'linear' }} class="absolute bottom-2 left-6 top-2 w-px origin-top bg-foreground md:hidden"></div>
    {#each steps as s, i (s.title)}
      <li class="relative pl-16 md:pl-0 md:text-center">
        <span class="absolute left-[10px] top-0 grid size-7 place-items-center rounded-full border bg-background font-serif text-base md:hidden">{i + 1}</span>
        <h3 class="font-serif text-[1.7rem] leading-tight tracking-[-0.02em]">{s.title}</h3>
        <p class="mt-3 text-pretty leading-relaxed text-muted-foreground md:mx-auto md:max-w-[17rem]">{s.body}</p>
      </li>
    {/each}
  </ol>
</section>
