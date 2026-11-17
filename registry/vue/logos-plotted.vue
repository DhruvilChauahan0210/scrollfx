<script setup lang="ts">
/**
 * logos-plotted — a logo cloud between two rules a pen draws across the page,
 * each name set beside a simple mark the pen plots line by line as the row
 * arrives: rings, a hatched disc, nested triangles, waves, a ruled square, a
 * burst of rays.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`.
 *
 * The default names are invented: pass your own customers, and swap each
 * cell's mark for their real logo if you have it. Names are in the server
 * HTML; the marks and rules are drawn in the browser, finishing as they reach
 * the middle of the screen. Reduced motion shows them drawn.
 */
import { computed, onMounted, ref } from 'vue';
import { ScrollDraw } from 'svg-scroll-draw/vue';
import 'svg-scroll-draw/no-flash.css';
import { logoMark, scrollWindow, seedOf, sketchLine, staggerFor, type MarkKind, type Stroke } from '@/lib/plotter';

export interface Logo {
  name: string;
  /** The mark drawn beside the name. */
  mark?: MarkKind;
  href?: string;
}

export interface LogosPlottedProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  logos?: Logo[];
  accent?: string;
  className?: string;
}

const props = withDefaults(defineProps<LogosPlottedProps>(), {
  eyebrow: 'In good company',
  heading: 'Used by teams who *read* their numbers.',
  description: 'Invented names: replace them with your customers.',
  logos: () => [
    { name: 'Ferrowind', mark: 'rings' },
    { name: 'Quillstone', mark: 'disc' },
    { name: 'Marlow & Pike', mark: 'delta' },
    { name: 'Tessellate', mark: 'grid' },
    { name: 'Brightfold', mark: 'wave' },
    { name: 'Okkara', mark: 'burst' },
  ],
  accent: '#e0482a',
  className: '',
});

const MARKS: MarkKind[] = ['rings', 'disc', 'delta', 'grid', 'wave', 'burst'];
// Each mark's lines draw one after another over this many trigger ranges (see scrollWindow).
const SPREAD = 0.6;

const parts = computed(() => props.heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
const drawn = ref<{ rules: Stroke[][]; marks: Stroke[][] } | null>(null);
onMounted(() => {
  drawn.value = {
    rules: [sketchLine({ w: 1000, h: 12, seed: 11 }), sketchLine({ w: 1000, h: 12, seed: 29 })],
    marks: props.logos.map((l, i) => logoMark(l.mark ?? MARKS[i % MARKS.length], 40, seedOf(l.name))),
  };
});
</script>

<template>
  <section :class="['mx-auto max-w-7xl px-6 py-28 sm:px-10', className]">
    <div class="flex flex-wrap items-end justify-between gap-6">
      <div class="max-w-2xl">
        <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
        <h2 class="mt-6 font-serif text-[clamp(2rem,3.6vw,3rem)] leading-[1.02] tracking-[-0.025em]">
          <template v-for="(p, i) in parts" :key="i"><em v-if="p.em" class="italic">{{ p.text }}</em><span v-else>{{ p.text }}</span></template>
        </h2>
      </div>
      <p v-if="description" class="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{{ description }}</p>
    </div>

    <div class="mt-12">
      <template v-for="r in [0, 1]" :key="r">
        <!-- A rule across the section, ink then accent, left to right. -->
        <div class="relative h-3 w-full">
          <ScrollDraw v-if="drawn" :stagger="0.5" easing="linear" :trigger="scrollWindow(0.5)" class="absolute inset-0" aria-hidden="true">
            <svg viewBox="0 0 1000 12" preserveAspectRatio="none" class="block size-full" fill="none" stroke-width="1" stroke-linecap="round">
              <path v-for="(s, k) in drawn.rules[r]" :key="k" :d="s.d" :stroke="s.pen ? accent : 'currentColor'" />
            </svg>
          </ScrollDraw>
        </div>
        <ul v-if="r === 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <li v-for="(l, i) in logos" :key="l.name" class="flex items-center justify-center py-10">
            <component :is="l.href ? 'a' : 'span'" :href="l.href" :class="['flex items-center gap-3 opacity-80', l.href ? 'transition-opacity hover:opacity-100' : '']">
              <span class="relative size-9 shrink-0">
                <ScrollDraw v-if="drawn" :stagger="staggerFor(drawn.marks[i].length, SPREAD)" easing="linear" :trigger="scrollWindow(SPREAD)" class="absolute inset-0" aria-hidden="true">
                  <svg viewBox="0 0 40 40" class="size-full" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
                    <path v-for="(s, k) in drawn.marks[i]" :key="k" :d="s.d" />
                  </svg>
                </ScrollDraw>
              </span>
              <span class="font-serif text-xl tracking-[-0.015em]">{{ l.name }}</span>
            </component>
          </li>
        </ul>
      </template>
    </div>
  </section>
</template>
