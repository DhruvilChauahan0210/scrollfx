<script lang="ts" module>
  /**
   * faq-plotted — questions beside a plate where a pen draws a Lissajous knot,
   * one closed figure traced four times, each a little smaller. The answers open
   * in place, with the browser's own disclosure: keyboard and screen readers
   * work, and every answer is in the page for search.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The heading takes one
   * emphasised word between asterisks, set in `font-serif`. The plate is a `bg-card` sheet.
   *
   * The knot is drawn in the browser, finishing as the plate reaches the middle
   * of the screen. Reduced motion shows it drawn.
   */
  export interface Question {
    q: string;
    a: string;
  }

  export interface FaqPlottedProps {
    eyebrow?: string;
    heading?: string;
    questions?: Question[];
    caption?: string;
    /** Which of the four knots to draw. */
    seed?: number;
    accent?: string;
    className?: string;
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollDraw } from 'svg-scroll-draw/svelte';
  import { lissajous, scrollWindow, staggerFor, type Stroke } from '$lib/plotter';

  let {
    eyebrow = 'Questions',
    heading = 'Asked, and *answered*.',
    questions = [
      { q: 'How long does setup take?', a: 'Most teams connect a source and see their first dashboard in under ten minutes. Nothing is copied until you choose what to watch.' },
      { q: 'Can I try it before paying?', a: 'Every plan starts with fourteen days of everything, with no card. When the trial ends you choose a plan or keep the free one.' },
      { q: 'Where is my data stored?', a: 'In the region you pick when you sign up, encrypted at rest and in transit. You can export all of it, at any time, in open formats.' },
      { q: 'Do you support single sign-on?', a: 'Yes, on every plan: SAML and OIDC, with Okta, Entra ID and Google. SCIM provisioning is on Business.' },
      { q: 'What happens if I cancel?', a: 'Your workspace stays readable for thirty days, and your export is ready the moment you ask for it.' },
    ],
    caption = 'Fig. — Lissajous knot',
    seed = 0,
    accent = '#e0482a',
    className = '',
  }: FaqPlottedProps = $props();

  const parts = $derived(heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
  let strokes = $state<Stroke[] | null>(null);
  onMount(() => {
    strokes = lissajous(seed);
  });
</script>

<section class="mx-auto grid max-w-7xl gap-14 px-6 py-28 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24 {className}">
  <div>
    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
    <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
      {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
    </h2>
    <figure class="mt-12 hidden lg:block">
      <div class="aspect-square w-full max-w-sm rounded-[3px] bg-card p-[8%] shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-22px_rgba(40,30,10,.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05)]">
        {#if strokes}
          <div use:scrollDraw={{ stagger: staggerFor(strokes.length, 0.6), easing: 'linear', trigger: scrollWindow(0.6) }} class="size-full" aria-hidden="true">
            <svg viewBox="0 0 400 400" class="size-full" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round">
              {#each strokes as s, i (i)}
                {#if s.pen}<path d={s.d} stroke={accent} />{:else}<path d={s.d} />{/if}
              {/each}
            </svg>
          </div>
        {/if}
      </div>
      <figcaption class="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{caption}</figcaption>
    </figure>
  </div>

  <div class="divide-y border-y">
    {#each questions as item (item.q)}
      <details class="group py-6">
        <summary class="flex cursor-pointer list-none items-baseline justify-between gap-6 font-serif text-[1.6rem] leading-tight tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
          {item.q}
          <!-- A plus that turns into a cross: the pen's mark for "open". -->
          <span aria-hidden="true" class="font-mono text-base text-muted-foreground transition-transform duration-300 group-open:rotate-45">+</span>
        </summary>
        <p class="mt-4 max-w-xl text-pretty text-[17px] leading-relaxed text-muted-foreground">{item.a}</p>
      </details>
    {/each}
  </div>
</section>
