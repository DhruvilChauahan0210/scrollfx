<script setup lang="ts">
/**
 * hatch-highlight — a large statement whose key phrases a pen hatches over as
 * they are read: diagonal strokes plotted one after another, the way you would
 * mark up a proof.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens. The statement is set in `font-serif`.
 *
 * Mark a phrase with asterisks: `Most sections *sit still*.` Each mark is
 * measured and hatched to fit, and again when the layout changes. The words
 * are plain text throughout. Reduced motion shows the hatching drawn.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ScrollDraw } from 'svg-scroll-draw/vue';
import { hatch, scrollWindow, staggerFor, type Stroke } from '@/lib/plotter';

export interface HatchHighlightProps {
  eyebrow?: string;
  /** The statement. Phrases between asterisks get hatched. */
  text?: string;
  /** The hatching's colour. */
  accent?: string;
  className?: string;
}

const props = withDefaults(defineProps<HatchHighlightProps>(), {
  eyebrow: 'In short',
  text: 'Most sections *sit still*. These are *drawn in* as you read, every line plotted by a pen that keeps pace *with the reader*.',
  accent: '#e0482a',
  className: '',
});

const parts = computed(() => props.text.split(/(\*[^*]+\*)/).map((p) => ({ mark: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));

// One box per mark, measured from the page and hatched to fit. A function ref
// files each phrase under its own index (an array ref in v-for keeps no order).
const marks: HTMLElement[] = [];
const setMark = (i: number) => (el: unknown) => { if (el) marks[i] = el as HTMLElement; };
const boxes = ref<Record<number, { w: number; h: number; lines: Stroke[] }>>({});
const measure = () => {
  const next: typeof boxes.value = {};
  marks.forEach((el, i) => {
    const w = Math.round(el.offsetWidth + 12);
    const h = Math.round(el.offsetHeight * 0.62);
    const old = boxes.value[i];
    next[i] = old && old.w === w && old.h === h ? old : { w, h, lines: hatch({ w, h, gap: 5, angle: 62 }) };
  });
  boxes.value = next;
};
let ro: ResizeObserver | undefined;
onMounted(() => {
  measure();
  ro = new ResizeObserver(measure);
  marks.forEach((el) => ro!.observe(el));
});
onBeforeUnmount(() => ro?.disconnect());
const markIndex = (partIndex: number) => parts.value.slice(0, partIndex).filter((p) => p.mark).length;
</script>

<template>
  <section :class="['mx-auto max-w-5xl px-6 py-32 sm:px-10', className]">
    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
    <div class="mt-10 text-balance font-serif text-[clamp(2.2rem,4.8vw,4.4rem)] leading-[1.12] tracking-[-0.025em]">
      <template v-for="(p, i) in parts" :key="i">
        <span v-if="p.mark" :ref="setMark(markIndex(i))" class="relative isolate inline-block whitespace-nowrap">
          <!-- Hatched as the phrase rises, the last stroke landing as it reaches the middle of the screen. -->
          <ScrollDraw
            v-if="boxes[markIndex(i)]"
            :key="`${boxes[markIndex(i)].w}x${boxes[markIndex(i)].h}`"
            :stagger="staggerFor(boxes[markIndex(i)].lines.length, 1)"
            easing="linear"
            :trigger="scrollWindow(1)"
            class="absolute -left-1.5 top-[30%] -z-10"
            aria-hidden="true"
          >
            <svg :width="boxes[markIndex(i)].w" :height="boxes[markIndex(i)].h" :viewBox="`0 0 ${boxes[markIndex(i)].w} ${boxes[markIndex(i)].h}`" fill="none" :stroke="accent" stroke-width="1.6" stroke-linecap="round" class="block opacity-80">
              <path v-for="(l, k) in boxes[markIndex(i)].lines" :key="k" :d="l.d" />
            </svg>
          </ScrollDraw>
          {{ p.text }}
        </span>
        <span v-else>{{ p.text }}</span>
      </template>
    </div>
  </section>
</template>
