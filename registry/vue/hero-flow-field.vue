<script setup lang="ts">
/**
 * hero-flow-field — a hero beside a print: a round flow field of several
 * hundred strokes that a pen plots on arrival, top to bottom, in ink and one
 * accent colour. The caption counts the strokes as they land.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens. The print is a `bg-card` sheet.
 *
 * The drawing is generated in the browser from `seed`, so it is the same on
 * every visit (browsers may differ by a stroke or two: engines round Math.sin
 * differently), and the server HTML stays small. Reduced motion shows it whole.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { scrollDraw } from 'svg-scroll-draw';
import 'svg-scroll-draw/no-flash.css';
import { flowField, type Stroke } from '@/lib/plotter';

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

const props = withDefaults(defineProps<HeroFlowFieldProps>(), {
  eyebrow: 'Generative sections for Vue',
  heading: 'Pages, *plotted* as you read.',
  description: 'Sections whose drawings ink themselves in, stroke by stroke, as the reader arrives and scrolls.',
  primary: () => ({ label: 'Get started', href: '#' }),
  aside: undefined,
  caption: 'Pl. I — Flow field',
  seed: 417,
  accent: '#e0482a',
  duration: 5200,
  className: '',
});

const STROKE_MS = 320;
const parts = computed(() => props.heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
const words = computed(() => (props.aside ?? '').split(' '));

const strokes = ref<Stroke[]>([]);
const plotted = ref('000');
const svg = ref<SVGSVGElement | null>(null);
let stop = () => {};

onMounted(async () => {
  strokes.value = flowField({ seed: props.seed });
  await nextTick();
  if (!svg.value) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Each stroke draws in STROKE_MS; the offsets spread them over `duration`.
  const stagger = (props.duration / STROKE_MS - 1) / Math.max(1, strokes.value.length - 1);
  const draw = scrollDraw(svg.value, { selector: 'path', autoplay: true, duration: STROKE_MS, stagger, easing: 'ease-out', native: false });
  if (reduce) draw.seek(1);
  const start = performance.now();
  let raf = 0;
  const tick = () => {
    const t = reduce ? 1 : Math.min(1, (performance.now() - start) / props.duration);
    plotted.value = String(Math.round(t * strokes.value.length)).padStart(3, '0');
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  stop = () => { cancelAnimationFrame(raf); draw.destroy(); };
});
onBeforeUnmount(() => stop());
</script>

<template>
  <section :class="['relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-10 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:pt-20', className]">
    <div class="max-w-xl">
      <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
      <h1 class="mt-8 font-serif text-[clamp(3rem,6.4vw,6.2rem)] leading-[0.94] tracking-[-0.035em]">
        <template v-for="(p, i) in parts" :key="i"><em v-if="p.em" class="italic">{{ p.text }}</em><span v-else>{{ p.text }}</span></template>
      </h1>
      <p class="mt-8 max-w-md text-pretty text-[17px] leading-relaxed text-muted-foreground">{{ description }}</p>
      <div class="mt-10 flex flex-wrap items-center gap-4">
        <a :href="primary.href" class="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-[15px] font-medium text-background transition-transform hover:-translate-y-px">
          {{ primary.label }}
        </a>
        <!-- Each word is one unit, so a long command wraps at a space, never inside a URL. -->
        <code v-if="aside" class="max-w-full rounded-2xl border px-5 py-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
          <template v-for="(w, i) in words" :key="i">{{ i > 0 ? ' ' : '' }}<span class="inline-block max-w-full [overflow-wrap:anywhere]">{{ w }}</span></template>
        </code>
      </div>
    </div>

    <!-- The print: a sheet, the drawing, and its plate caption. On a phone it comes first. -->
    <figure class="order-first lg:order-none">
      <div class="aspect-square w-full rounded-[3px] bg-card p-[6%] shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-18px_rgba(40,30,10,.3),0_2px_6px_-2px_rgba(40,30,10,.12)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05),0_24px_60px_-20px_rgba(0,0,0,.8)]">
        <svg ref="svg" data-scroll-draw-pending="" viewBox="0 0 1000 1000" class="size-full" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="A flow field plotted in ink">
          <path v-for="(s, i) in strokes" :key="i" :d="s.d" v-bind="s.pen ? { stroke: accent, 'stroke-width': 1.9 } : {}" />
        </svg>
      </div>
      <figcaption class="mt-4 flex items-baseline justify-between gap-4 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{{ caption }}</span>
        <span>{{ plotted }} / {{ String(strokes.length).padStart(3, '0') }} strokes<span class="hidden sm:inline"> · seed {{ seed }}</span></span>
      </figcaption>
    </figure>
  </section>
</template>
