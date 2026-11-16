<script lang="ts" module>
  /**
   * cta-harmonograph — the closing call to action, beside a harmonograph: the
   * trace of two swinging pendulums, one unbroken line that a pen draws as the
   * section arrives, spiralling in as the swing dies away.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The heading takes one
   * emphasised word between asterisks, set in `font-serif`. The print is a `bg-card` sheet.
   *
   * The copy and buttons are in the server HTML; the line is made in the
   * browser from `seed`. Reduced motion shows it drawn.
   */
  export interface CtaHarmonographProps {
    eyebrow?: string;
    heading?: string;
    description?: string;
    primary?: { label: string; href: string };
    secondary?: { label: string; href: string };
    caption?: string;
    seed?: number;
    className?: string;
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollDraw } from 'svg-scroll-draw/svelte';
  import 'svg-scroll-draw/no-flash.css';
  import { harmonograph, scrollWindow } from '$lib/plotter';

  let {
    eyebrow = 'Begin',
    heading = 'Ready when *you* are.',
    description = 'Start free, with every feature, for fourteen days. No card, and your data comes with you if you leave.',
    primary = { label: 'Start free', href: '#' },
    secondary = { label: 'Talk to us', href: '#' },
    caption = 'Pl. — Harmonograph',
    seed = 34,
    className = '',
  }: CtaHarmonographProps = $props();

  const parts = $derived(heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
  let d = $state<string | null>(null);
  onMount(() => {
    d = harmonograph(seed)[0].d;
  });
</script>

<section class="mx-auto grid max-w-7xl items-center gap-14 px-6 py-28 sm:px-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-24 {className}">
  <figure>
    <div class="aspect-square w-full rounded-[3px] bg-card p-[5%] shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-18px_rgba(40,30,10,.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05),0_24px_60px_-20px_rgba(0,0,0,.8)]">
      {#if d}
        <!-- One line, finished as the print reaches the middle of the screen. -->
        <div data-scroll-draw-pending="" use:scrollDraw={{ easing: 'linear', trigger: scrollWindow() }} class="size-full" aria-hidden="true">
          <svg viewBox="0 0 1000 1000" class="size-full" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
            <path {d} />
          </svg>
        </div>
      {/if}
    </div>
    <figcaption class="mt-4 flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
      <span>{caption}</span>
      <span>One line · seed {seed}</span>
    </figcaption>
  </figure>

  <div class="max-w-lg">
    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
    <h2 class="mt-6 font-serif text-[clamp(2.8rem,5.6vw,5rem)] leading-[0.96] tracking-[-0.03em]">
      {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
    </h2>
    <p class="mt-6 text-pretty text-[17px] leading-relaxed text-muted-foreground">{description}</p>
    <div class="mt-10 flex flex-wrap gap-3">
      <a href={primary.href} class="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-[15px] font-medium text-background transition-transform hover:-translate-y-px">{primary.label}</a>
      <a href={secondary.href} class="inline-flex h-12 items-center rounded-full border px-7 text-[15px] font-medium transition-colors hover:bg-accent">{secondary.label}</a>
    </div>
  </div>
</section>
