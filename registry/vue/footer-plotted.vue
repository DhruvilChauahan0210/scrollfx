<script setup lang="ts">
/**
 * footer-plotted — a footer under a horizon: ridgelines a pen plots back to
 * front as the footer comes into view, the nearest in the accent colour, with
 * the hidden lines removed. Link columns and a closing line below.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens.
 *
 * A footer is at the bottom of the page and may never reach the middle of the
 * screen, so the horizon plays once when it comes into view instead of
 * following the scroll. The links are plain HTML. Reduced motion shows it drawn.
 */
import { onMounted, ref } from 'vue';
import { ScrollDraw } from 'svg-scroll-draw/vue';
import { ridgelines, staggerFor, type Stroke } from '@/lib/plotter';

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterPlottedProps {
  /** The name, top left. */
  brand?: string;
  /** A sentence or two beside the name. */
  note?: string;
  columns?: FooterColumn[];
  /** The closing line, bottom left. */
  legal?: string;
  seed?: number;
  accent?: string;
  className?: string;
}

const props = withDefaults(defineProps<FooterPlottedProps>(), {
  brand: 'Acme',
  note: 'Dashboards that show the shape of your data, not just its totals.',
  columns: () => [
    { title: 'Product', links: [{ label: 'Features', href: '#' }, { label: 'Pricing', href: '#' }, { label: 'Changelog', href: '#' }] },
    { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Contact', href: '#' }] },
    { title: 'Resources', links: [{ label: 'Docs', href: '#' }, { label: 'Guides', href: '#' }, { label: 'Status', href: '#' }] },
  ],
  legal: () => `© ${new Date().getFullYear()} Acme. All rights reserved.`,
  seed: 9,
  accent: '#e0482a',
  className: '',
});

// Plays once on arrival: each ridge in STROKE_MS, back to front, all of them
// within TOTAL_MS.
const STROKE_MS = 900;
const TOTAL_MS = 3200;
const strokes = ref<Stroke[] | null>(null);
onMounted(() => {
  strokes.value = ridgelines({ seed: props.seed });
});
</script>

<template>
  <footer :class="['overflow-hidden border-t', className]">
    <div class="mx-auto max-w-7xl px-6 sm:px-10">
      <!-- On a phone the full range would be a thin strip: show its middle, larger. -->
      <div class="relative -mx-6 aspect-[3/1] sm:-mx-10 sm:aspect-[1200/260]">
        <ScrollDraw v-if="strokes" autoplay :duration="STROKE_MS" :stagger="staggerFor(strokes.length, TOTAL_MS / STROKE_MS - 1)" easing="ease-out" class="absolute inset-0" aria-hidden="true">
          <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" class="size-full" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
            <path v-for="(s, i) in strokes" :key="i" :d="s.d" v-bind="s.pen ? { stroke: accent, 'stroke-width': 1.6 } : {}" />
          </svg>
        </ScrollDraw>
      </div>

      <div class="grid gap-12 border-t py-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div class="max-w-sm">
          <p class="font-serif text-3xl tracking-[-0.02em]">{{ brand }}</p>
          <p v-if="note" class="mt-4 text-pretty leading-relaxed text-muted-foreground">{{ note }}</p>
        </div>
        <nav aria-label="Footer" class="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div v-for="col in columns" :key="col.title">
            <p class="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{{ col.title }}</p>
            <ul class="mt-5 space-y-3">
              <li v-for="l in col.links" :key="l.label"><a :href="l.href" class="underline-offset-4 hover:underline">{{ l.label }}</a></li>
            </ul>
          </div>
        </nav>
      </div>

      <div class="border-t py-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{{ legal }}</div>
    </div>
  </footer>
</template>
