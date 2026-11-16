<script lang="ts" module>
  /**
   * pricing-plotted — plans in columns, each headed by a mark that grows denser
   * with the plan, plotted as the section arrives. The recommended plan is
   * framed by a pen that goes round it twice, and the prices count up.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The heading takes one
   * emphasised word between asterisks, set in `font-serif`.
   *
   * The prices are in the server HTML (each counter starts on its final
   * number). Reduced motion shows the final prices, the marks and the frame drawn.
   */
  export interface Plan {
    name: string;
    description: string;
    monthly: number;
    yearly: number;
    features: string[];
    cta: { label: string; href: string };
    featured?: boolean;
  }

  export interface PricingPlottedProps {
    eyebrow?: string;
    heading?: string;
    description?: string;
    plans?: Plan[];
    currency?: string;
    accent?: string;
    className?: string;
  }

  const rings = (i: number) => 2 + i * 3;
  const radius = (i: number, k: number) => 26 - k * (22 / rings(i));
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollCounterAction, scrollDraw } from 'svg-scroll-draw/svelte';
  import 'svg-scroll-draw/no-flash.css';
  import { scrollWindow, sketchRect, staggerFor, type Stroke } from '$lib/plotter';

  let {
    eyebrow = 'Pricing',
    heading = 'Simple, *honest* pricing.',
    description = 'Start free. Upgrade when your team needs more history, more people or more control.',
    plans = [
      { name: 'Starter', description: 'For trying it on a side project.', monthly: 0, yearly: 0, features: ['3 dashboards', '7 days of history', 'Email reports', 'Community support'], cta: { label: 'Start free', href: '#' } },
      { name: 'Pro', description: 'For teams that run on their numbers.', monthly: 24, yearly: 19, features: ['Unlimited dashboards', '2 years of history', 'Realtime updates', 'Scheduled reports', 'Slack alerts', 'Priority support'], cta: { label: 'Start a 14-day trial', href: '#' }, featured: true },
      { name: 'Business', description: 'For companies with security reviews.', monthly: 64, yearly: 52, features: ['Everything in Pro', 'Unlimited history', 'SSO and SCIM', 'Audit log', 'Custom retention', 'A named engineer'], cta: { label: 'Talk to sales', href: '#' } },
    ],
    currency = '$',
    accent = '#e0482a',
    className = '',
  }: PricingPlottedProps = $props();

  let yearly = $state(true);
  const parts = $derived(heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));

  // The pen's frame round the recommended plan, measured to fit it.
  let featured: HTMLElement | undefined = $state();
  let frame = $state<{ w: number; h: number; strokes: Stroke[] } | null>(null);
  onMount(() => {
    if (!featured) return;
    const el = featured;
    const measure = () => {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (frame && frame.w === w && frame.h === h) return;
      frame = { w, h, strokes: sketchRect({ w, h, seed: 3 }) };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });
</script>

<section class="mx-auto max-w-7xl px-6 py-28 sm:px-10 {className}">
  <div class="flex flex-wrap items-end justify-between gap-8">
    <div class="max-w-2xl">
      <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
        {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
      </h2>
      <p class="mt-6 max-w-lg text-pretty text-[17px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
    <div role="radiogroup" aria-label="Billing period" class="inline-flex rounded-full border p-1 font-mono text-[12px] uppercase tracking-[0.14em]">
      {#each [{ label: 'Monthly', value: false }, { label: 'Yearly', value: true }] as o (o.label)}
        <button type="button" role="radio" aria-checked={yearly === o.value} class="rounded-full px-4 py-2 transition-colors {yearly === o.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}" onclick={() => (yearly = o.value)}>
          {o.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-0">
    {#each plans as plan, i (plan.name)}
      {@const price = yearly ? plan.yearly : plan.monthly}
      {#if plan.featured}
        <article bind:this={featured} class="relative flex flex-col rounded-[20px] bg-card p-8 sm:p-10">
          <div class="pointer-events-none absolute inset-0">
            {#if frame}
              {#key `${frame.w}x${frame.h}`}
                <!-- The second pass follows the first, both round as the card reaches the middle of the screen. -->
                <div data-scroll-draw-pending="" use:scrollDraw={{ stagger: 0.5, easing: 'linear', trigger: scrollWindow(0.5) }} class="size-full" aria-hidden="true">
                  <svg width={frame.w} height={frame.h} viewBox="0 0 {frame.w} {frame.h}" class="block overflow-visible" fill="none" stroke-width="1.3" stroke-linecap="round">
                    {#each frame.strokes as s, k (k)}<path d={s.d} stroke={s.pen ? accent : 'currentColor'} />{/each}
                  </svg>
                </div>
              {/key}
            {/if}
          </div>
          {@render body(plan, i, price)}
        </article>
      {:else}
        <article class="relative flex flex-col p-8 sm:p-10 {i > 0 ? 'border-t lg:border-l lg:border-t-0' : ''}">
          {@render body(plan, i, price)}
        </article>
      {/if}
    {/each}
  </div>
</section>

{#snippet body(plan: Plan, i: number, price: number)}
  <!-- A mark of concentric rings: more rings for a bigger plan. -->
  <div data-scroll-draw-pending="" use:scrollDraw={{ stagger: staggerFor(rings(i), 0.6), easing: 'linear', trigger: scrollWindow(0.6) }} class="size-14" aria-hidden="true">
    <svg viewBox="0 0 56 56" class="size-full" fill="none" stroke={plan.featured ? accent : 'currentColor'} stroke-width="0.9">
      {#each Array.from({ length: rings(i) }) as _, k (k)}<circle cx="28" cy="28" r={radius(i, k)} />{/each}
    </svg>
  </div>
  <h3 class="mt-8 font-serif text-3xl tracking-[-0.02em]">{plan.name}</h3>
  <p class="mt-2 text-muted-foreground">{plan.description}</p>

  <p class="mt-10 flex items-baseline gap-2">
    <span class="font-serif text-6xl tracking-[-0.03em] tabular-nums">
      <!-- A new key per period: the counter starts again from the new number. -->
      {currency}{#key `${plan.name}-${yearly}`}<span use:scrollCounterAction={{ to: price, trigger: scrollWindow() }}>{price}</span>{/key}
    </span>
    <span class="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">/ month</span>
  </p>
  <p class="mt-2 h-5 text-sm text-muted-foreground">{price > 0 ? (yearly ? 'Billed yearly' : 'Billed monthly') : 'Free, for as long as you like'}</p>

  <a href={plan.cta.href} class="mt-8 inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-medium transition-transform hover:-translate-y-px {plan.featured ? 'bg-foreground text-background' : 'border hover:bg-accent'}">
    {plan.cta.label}
  </a>

  <ul class="mt-10 space-y-3.5">
    {#each plan.features as ft (ft)}
      <li class="flex items-baseline gap-3.5">
        <span aria-hidden="true" class="mt-[0.55em] h-px w-4 shrink-0 bg-foreground/50"></span>
        <span>{ft}</span>
      </li>
    {/each}
  </ul>
{/snippet}
