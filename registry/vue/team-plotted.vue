<script setup lang="ts">
/**
 * team-plotted — the people behind the product, each over a fingerprint a pen
 * draws ring by ring, from the core outward, as their card arrives. The print
 * is seeded from the person's name, so everyone has one of their own, the same
 * every time.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`. Cards are `bg-card` sheets.
 *
 * The default people are samples: pass your own team. Names and roles are in
 * the server HTML; the prints are drawn in the browser, each finishing as its
 * card reaches the middle of the screen. Reduced motion shows them drawn.
 */
import { computed, onMounted, ref } from 'vue';
import { ScrollDraw } from 'svg-scroll-draw/vue';
import { fingerprint, scrollWindow, seedOf, staggerFor, type Stroke } from '@/lib/plotter';

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

const props = withDefaults(defineProps<TeamPlottedProps>(), {
  eyebrow: 'The people',
  heading: 'Made by a *small* team.',
  description: 'Sample people: replace them with your own.',
  people: () => [
    { name: 'Lena Ortiz', role: 'Founder', note: 'Ran data for a logistics company for nine years.' },
    { name: 'Sam Okafor', role: 'Engineering', note: 'Builds the query engine and keeps it fast.' },
    { name: 'Mira Chen', role: 'Design', note: 'Turns tables into pictures people read.' },
    { name: 'Theo Varga', role: 'Customers', note: 'Answers every message within a day.' },
  ],
  accent: '#e0482a',
  className: '',
});

// The rings draw one after another over this many trigger ranges (see scrollWindow).
const SPREAD = 0.6;

const parts = computed(() => props.heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
const prints = ref<Stroke[][] | null>(null);
onMounted(() => {
  prints.value = props.people.map((p) => fingerprint(seedOf(p.name), 100));
});
</script>

<template>
  <section :class="['mx-auto max-w-7xl px-6 py-28 sm:px-10', className]">
    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
    <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
      <template v-for="(p, i) in parts" :key="i"><em v-if="p.em" class="italic">{{ p.text }}</em><span v-else>{{ p.text }}</span></template>
    </h2>
    <p v-if="description" class="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{{ description }}</p>

    <ul class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <li v-for="(p, i) in people" :key="p.name" class="flex flex-col rounded-[3px] bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-24px_rgba(40,30,10,.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05)]">
        <div class="relative aspect-square w-full">
          <ScrollDraw v-if="prints" :stagger="staggerFor(prints[i].length, SPREAD)" easing="linear" :trigger="scrollWindow(SPREAD)" class="absolute inset-0" aria-hidden="true">
            <svg viewBox="0 0 100 100" class="size-full" fill="none" :stroke="i === 0 ? accent : 'currentColor'" stroke-width="0.7" stroke-linecap="round">
              <path v-for="(r, k) in prints[i]" :key="k" :d="r.d" />
            </svg>
          </ScrollDraw>
        </div>
        <p class="mt-6 font-serif text-2xl tracking-[-0.015em]">{{ p.name }}</p>
        <p class="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{{ p.role }}</p>
        <p v-if="p.note" class="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground">{{ p.note }}</p>
      </li>
    </ul>
  </section>
</template>
