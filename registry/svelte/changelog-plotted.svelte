<script lang="ts" module>
  /**
   * changelog-plotted — releases down a rail that inks itself as you read, each
   * stamped with a rosette drawn from its version number: every release gets a
   * mark of its own, and the same one every time.
   *
   * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
   * Needs: svelte 5, svg-scroll-draw, and $lib/plotter (installed with it).
   * Styling: Tailwind CSS with shadcn-svelte tokens. The heading takes one
   * emphasised word between asterisks, set in `font-serif`.
   *
   * The releases are plain text in the server HTML; the stamps are drawn in the
   * browser. Reduced motion shows the rail and the stamps drawn.
   */
  export interface Release {
    version: string;
    date: string;
    title: string;
    body: string;
  }

  export interface ChangelogPlottedProps {
    eyebrow?: string;
    heading?: string;
    releases?: Release[];
    accent?: string;
    className?: string;
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollAnimate, scrollDraw } from 'svg-scroll-draw/svelte';
  import 'svg-scroll-draw/no-flash.css';
  import { rosette, scrollWindow, seedOf } from '$lib/plotter';

  let {
    eyebrow = 'Changelog',
    heading = 'What we *shipped*.',
    releases = [
      { version: '3.2', date: 'Nov 12, 2026', title: 'Realtime dashboards', body: 'Every chart updates the moment the data changes. No refresh button, no polling interval to set.' },
      { version: '3.1', date: 'Oct 28, 2026', title: 'Scheduled reports', body: 'Pick a dashboard, a day and an inbox. The report arrives as a PDF and a link, at the same time every week.' },
      { version: '3.0', date: 'Oct 2, 2026', title: 'A faster editor', body: 'Large workspaces open four times faster, and filters apply as you type instead of after you press enter.' },
      { version: '2.9', date: 'Sep 15, 2026', title: 'Single sign-on on every plan', body: 'SAML and OIDC are no longer an Enterprise extra. Connect Okta, Entra ID or Google in a few minutes.' },
      { version: '2.8', date: 'Aug 30, 2026', title: 'Dark mode', body: 'Follows your system setting, or set it per workspace. Charts pick colours that keep their contrast in both.' },
    ],
    accent = '#e0482a',
    className = '',
  }: ChangelogPlottedProps = $props();

  const parts = $derived(heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
  let stamps = $state<string[] | null>(null);
  onMount(() => {
    stamps = releases.map((r) => rosette(seedOf(r.version), 100)[0].d);
  });
</script>

<section class="mx-auto max-w-5xl px-6 py-28 sm:px-10 {className}">
  <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
  <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
    {#each parts as p, i (i)}{#if p.em}<em class="italic">{p.text}</em>{:else}<span>{p.text}</span>{/if}{/each}
  </h2>

  <ol class="relative mt-20">
    <!-- The rail: a hairline, and the ink that runs down it as you read. -->
    <div aria-hidden="true" class="absolute bottom-8 left-8 top-8 w-px bg-border sm:left-[200px]"></div>
    <div aria-hidden="true" use:scrollAnimate={{ props: { transform: ['scaleY(0)', 'scaleY(1)'] }, trigger: { start: 'top 60%', end: 'bottom 60%' }, easing: 'linear' }} class="absolute bottom-8 left-8 top-8 w-px origin-top bg-foreground sm:left-[200px]"></div>

    {#each releases as r, i (r.version)}
      <li class="relative grid grid-cols-[64px_1fr] gap-x-6 pb-20 last:pb-0 sm:grid-cols-[136px_64px_1fr] sm:gap-x-8">
        <div class="hidden pt-5 text-right sm:block">
          <p class="font-mono text-sm">v{r.version}</p>
          <p class="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{r.date}</p>
        </div>
        <div class="relative size-16 rounded-full bg-background p-0.5">
          {#if stamps}
            <div data-scroll-draw-pending="" use:scrollDraw={{ easing: 'linear', trigger: scrollWindow() }} class="size-full" aria-hidden="true">
              <svg viewBox="0 0 100 100" class="size-full" fill="none" stroke={i === 0 ? accent : 'currentColor'} stroke-width="1.25" stroke-linejoin="round">
                <path d={stamps[i]} />
              </svg>
            </div>
          {/if}
        </div>
        <div class="pt-3">
          <p class="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:hidden">v{r.version} · {r.date}</p>
          <h3 class="font-serif text-[1.9rem] leading-tight tracking-[-0.02em]">{r.title}</h3>
          <p class="mt-3 max-w-xl text-pretty text-[17px] leading-relaxed text-muted-foreground">{r.body}</p>
        </div>
      </li>
    {/each}
  </ol>
</section>
