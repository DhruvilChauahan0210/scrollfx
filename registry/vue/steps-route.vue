<script setup lang="ts">
/**
 * steps-route — how it works, as a route on a map: numbered stops a pen rings
 * in turn, joined by a line that wanders from one to the next and ends on a
 * cross in the accent colour. On a phone the steps stack beside a rail that
 * inks down as you read.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`.
 *
 * The steps are plain text in the server HTML; the route is drawn in the
 * browser. Reduced motion shows it drawn.
 */
import { computed, onMounted, ref } from 'vue';
import { ScrollAnimate, ScrollDraw } from 'svg-scroll-draw/vue';
import 'svg-scroll-draw/no-flash.css';
import { route, scrollWindow, staggerFor } from '@/lib/plotter';

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

const props = withDefaults(defineProps<StepsRouteProps>(), {
  eyebrow: 'How it works',
  heading: 'Four stops, *one* line.',
  steps: () => [
    { title: 'Connect a source', body: 'Point it at your database, your warehouse or an event stream. Read-only, and nothing is copied until you say so.' },
    { title: 'Pick what matters', body: 'Choose the tables and events to watch. Sensible dashboards are drafted for you from what it finds.' },
    { title: 'Share the view', body: 'Invite the team, schedule the reports, and set the alerts that should wake someone up.' },
    { title: 'Decide faster', body: 'Every number on the screen is live, and every one opens into the rows behind it.' },
  ],
  accent: '#e0482a',
  seed: 5,
  className: '',
});

const W = 1000, H = 140, R = 26;
const parts = computed(() => props.heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
const xs = computed(() => props.steps.map((_, i) => ((i + 0.5) / props.steps.length) * W));
const last = computed(() => xs.value[xs.value.length - 1]);

/** A ring round a stop, drawn as one stroke that overshoots its start a little, as a pen does. */
const ring = (x: number, y: number, r: number) => `M${x + r} ${y}A${r} ${r} 0 1 1 ${x + r * Math.cos(-0.35)} ${y + r * Math.sin(-0.35)}`;
const cross = computed(() => {
  const x = last.value, y = H / 2 - R - 14;
  return `M${x - 9} ${y - 9}L${x + 9} ${y + 9}M${x + 9} ${y - 9}L${x - 9} ${y + 9}`;
});

// Ring, leg, ring, leg: the pen travels from stop to stop. Each leg leaves a
// ring on its edge, so the line never crosses a number.
const legs = ref<string[] | null>(null);
onMounted(() => {
  const stops = xs.value.map((x): [number, number] => [x, H / 2]);
  legs.value = stops.slice(0, -1).map(([x, y], i) => route([[x + R + 4, y], [stops[i + 1][0] - R - 4, y]], props.seed + i, 0.9));
});
</script>

<template>
  <section :class="['mx-auto max-w-7xl px-6 py-28 sm:px-10', className]">
    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
    <h2 class="mt-6 max-w-3xl font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
      <template v-for="(p, i) in parts" :key="i"><em v-if="p.em" class="italic">{{ p.text }}</em><span v-else>{{ p.text }}</span></template>
    </h2>

    <!-- Wide screens: the route runs across above the steps. -->
    <div class="relative mt-20 hidden aspect-[1000/140] md:block">
      <!-- The pen reaches the last stop as the route reaches the middle of the screen. -->
      <ScrollDraw v-if="legs" :stagger="staggerFor(2 * steps.length, 1.5)" easing="linear" :trigger="scrollWindow(1.5)" class="absolute inset-0" aria-hidden="true">
        <svg :viewBox="`0 0 ${W} ${H}`" class="size-full overflow-visible" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
          <template v-for="(x, i) in xs" :key="i">
            <path :d="ring(x, H / 2, R)" />
            <path v-if="legs[i]" :d="legs[i]" />
          </template>
          <path :d="cross" :stroke="accent" stroke-width="2.2" />
        </svg>
      </ScrollDraw>
      <span v-for="(x, i) in xs" :key="i" class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-2xl" :style="{ left: `${(x / W) * 100}%` }">{{ i + 1 }}</span>
    </div>

    <ol class="relative mt-14 grid gap-12 md:mt-10 md:grid-cols-[repeat(var(--steps),minmax(0,1fr))] md:gap-10" :style="{ '--steps': steps.length }">
      <!-- Phones: a hairline rail beside the steps, and the ink that runs down it. -->
      <div aria-hidden="true" class="absolute bottom-2 left-6 top-2 w-px bg-border md:hidden" />
      <ScrollAnimate aria-hidden="true" :options="{ props: { transform: ['scaleY(0)', 'scaleY(1)'] }, trigger: { start: 'top 70%', end: 'bottom 70%' }, easing: 'linear' }" class="absolute bottom-2 left-6 top-2 w-px origin-top md:hidden">
        <div class="h-full w-px bg-foreground" />
      </ScrollAnimate>
      <li v-for="(s, i) in steps" :key="s.title" class="relative pl-16 md:pl-0 md:text-center">
        <span class="absolute left-[10px] top-0 grid size-7 place-items-center rounded-full border bg-background font-serif text-base md:hidden">{{ i + 1 }}</span>
        <h3 class="font-serif text-[1.7rem] leading-tight tracking-[-0.02em]">{{ s.title }}</h3>
        <p class="mt-3 text-pretty leading-relaxed text-muted-foreground md:mx-auto md:max-w-[17rem]">{{ s.body }}</p>
      </li>
    </ol>
  </section>
</template>
