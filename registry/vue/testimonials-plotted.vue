<script setup lang="ts">
/**
 * testimonials-plotted — quotes on sheets, each stamped with a spiral a pen
 * winds from the rim inward as the card arrives. The spiral is seeded from the
 * person's name, so everyone gets a mark of their own, the same every time;
 * their initials sit in its eye.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`. Cards are `bg-card` sheets.
 *
 * The default quotes are samples: pass your own customers' words. The quotes
 * are in the server HTML; the spirals are drawn in the browser, each finishing
 * as its card reaches the middle of the screen. Reduced motion shows them drawn.
 */
import { computed, onMounted, ref } from 'vue';
import { ScrollDraw } from 'svg-scroll-draw/vue';
import 'svg-scroll-draw/no-flash.css';
import { scrollWindow, seedOf, spiral } from '@/lib/plotter';

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface TestimonialsPlottedProps {
  eyebrow?: string;
  heading?: string;
  /** A line under the heading, e.g. where the quotes come from. */
  note?: string;
  testimonials?: Testimonial[];
  accent?: string;
  className?: string;
}

const props = withDefaults(defineProps<TestimonialsPlottedProps>(), {
  eyebrow: 'In their words',
  heading: 'What teams *say*.',
  note: 'Sample quotes: replace them with your customers’ own words.',
  testimonials: () => [
    { quote: 'We replaced three dashboards and a weekly spreadsheet with one page. The Monday meeting is twenty minutes shorter.', name: 'Lena Ortiz', role: 'Head of data' },
    { quote: 'The alerts fire before the customer notices, and the chart in the message already explains why.', name: 'Sam Okafor', role: 'Platform engineer' },
    { quote: 'Our analysts stopped exporting to CSV. Every number opens into the rows behind it, so there is nothing to argue about.', name: 'Mira Chen', role: 'Finance lead' },
  ],
  accent: '#e0482a',
  className: '',
});

const parts = computed(() => props.heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const spirals = ref<string[] | null>(null);
onMounted(() => {
  spirals.value = props.testimonials.map((t) => spiral(seedOf(t.name))[0].d);
});
</script>

<template>
  <section :class="['mx-auto max-w-7xl px-6 py-28 sm:px-10', className]">
    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
    <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
      <template v-for="(p, i) in parts" :key="i"><em v-if="p.em" class="italic">{{ p.text }}</em><span v-else>{{ p.text }}</span></template>
    </h2>
    <p v-if="note" class="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{{ note }}</p>

    <div class="mt-16 grid gap-6 md:grid-cols-3">
      <figure v-for="(t, i) in testimonials" :key="t.name" class="flex flex-col rounded-[3px] bg-card p-8 shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-24px_rgba(40,30,10,.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05)]">
        <div class="relative size-20 shrink-0">
          <ScrollDraw v-if="spirals" easing="linear" :trigger="scrollWindow()" class="absolute inset-0" aria-hidden="true">
            <svg viewBox="0 0 100 100" class="size-full" fill="none" :stroke="i === 0 ? accent : 'currentColor'" stroke-width="0.8" stroke-linecap="round">
              <path :d="spirals[i]" />
            </svg>
          </ScrollDraw>
          <span class="absolute inset-0 grid place-items-center font-serif text-lg" aria-hidden="true">{{ initials(t.name) }}</span>
        </div>
        <blockquote class="mt-8 flex-1 text-pretty font-serif text-[1.35rem] leading-snug tracking-[-0.01em]">“{{ t.quote }}”</blockquote>
        <figcaption class="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{{ t.name }} · {{ t.role }}</figcaption>
      </figure>
    </div>
  </section>
</template>
