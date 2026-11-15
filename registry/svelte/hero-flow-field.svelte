<script lang="ts" module>
  /**
   * hero-flow-field — a hero beside a print: a round flow field of several
   * hundred strokes that a pen plots on arrival, top to bottom, in ink and one
   * accent colour. The caption counts the strokes as they land.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The print is a `bg-card` sheet.
   *
   * The drawing is generated in the browser from `seed`, so it is the same on
   * every visit (browsers may differ by a stroke or two: engines round Math.sin
   * differently), and the server HTML stays small. Reduced motion shows it whole.
   */
  export interface HeroFlowFieldProps {
    eyebrow?: string;
    /** One emphasised word between asterisks. */
    heading?: string;
    description?: string;
    primary?: { label: string; href: string };
    /** A command or note shown beside the button. */
    aside?: string;
    caption?: string;
    seed?: number;
    /** The second pen's colour. The first is the text colour. */
    accent?: string;
    /** How long the whole plot takes, in milliseconds. */
    duration?: number;
    className?: string;
  }

  const STROKE_MS = 320;
</script>

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { scrollDraw } from 'svg-scroll-draw';
  import { flowField, type Stroke } from '$lib/plotter';

  let {
    eyebrow = 'Generative sections for Svelte',
    heading = 'Pages, *plotted* as you read.',
    description = 'Sections whose drawings ink themselves in, stroke by stroke, as the reader arrives and scrolls.',
    primary = { label: 'Get started', href: '#' },
    aside = undefined,
    caption = 'Pl. I — Flow field',
    seed = 417,
    accent = '#e0482a',
    duration = 5200,
    className = '',
  }: HeroFlowFieldProps = $props();

  const parts = $derived(heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
  const words = $derived((aside ?? '').split(' '));

  let strokes = $state<Stroke[]>([]);
  let plotted = $state('000');
  let svg: SVGSVGElement | undefined = $state();

  onMount(() => {
    let stop = () => {};
    (async () => {
      strokes = flowField({ seed });
      await tick();
      if (!svg) return;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      // Each stroke draws in STROKE_MS; the offsets spread them over `duration`.
      const stagger = (duration / STROKE_MS - 1) / Math.max(1, strokes.length - 1);
      const draw = scrollDraw(svg, { selector: 'path', autoplay: true, duration: STROKE_MS, stagger, easing: 'ease-out', native: false });
      if (reduce) draw.seek(1);
      const start = performance.now();
      let raf = 0;
      const step = () => {
        const t = reduce ? 1 : Math.min(1, (performance.now() - start) / duration);
        plotted = String(Math.round(t * strokes.length)).padStart(3, '0');
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      stop = () => { cancelAnimationFrame(raf); draw.destroy(); };
    })();
    return () => stop();
  });
</script>

<section class="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-10 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:pt-20 {className}">
  <div class="max-w-xl">
    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
    <h1 class="mt-8 font-serif text-[clamp(3rem,6.4vw,6.2rem)] leading-[0.94] tracking-[-0.035em]">
      {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
    </h1>
    <p class="mt-8 max-w-md text-pretty text-[17px] leading-relaxed text-muted-foreground">{description}</p>
    <div class="mt-10 flex flex-wrap items-center gap-4">
      <a href={primary.href} class="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-[15px] font-medium text-background transition-transform hover:-translate-y-px">
        {primary.label}
      </a>
      {#if aside}
        <!-- Each word is one unit, so a long command wraps at a space, never inside a URL. -->
        <code class="max-w-full rounded-2xl border px-5 py-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
          {#each words as w, i (i)}{i > 0 ? ' ' : ''}<span class="inline-block max-w-full [overflow-wrap:anywhere]">{w}</span>{/each}
        </code>
      {/if}
    </div>
  </div>

  <!-- The print: a sheet, the drawing, and its plate caption. On a phone it comes first. -->
  <figure class="order-first lg:order-none">
    <div class="aspect-square w-full rounded-[3px] bg-card p-[6%] shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-18px_rgba(40,30,10,.3),0_2px_6px_-2px_rgba(40,30,10,.12)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05),0_24px_60px_-20px_rgba(0,0,0,.8)]">
      <svg bind:this={svg} viewBox="0 0 1000 1000" class="size-full" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="A flow field plotted in ink">
        {#each strokes as s, i (i)}
          {#if s.pen}<path d={s.d} stroke={accent} stroke-width="1.9" />{:else}<path d={s.d} />{/if}
        {/each}
      </svg>
    </div>
    <figcaption class="mt-4 flex items-baseline justify-between gap-4 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
      <span>{caption}</span>
      <!-- The separator is an expression: a leading space in the markup would be trimmed. -->
      <span>{plotted} / {String(strokes.length).padStart(3, '0')} strokes<span class="hidden sm:inline">{` · seed ${seed}`}</span></span>
    </figcaption>
  </figure>
</section>
