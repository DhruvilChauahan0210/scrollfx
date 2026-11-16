<script setup lang="ts">
/**
 * feature-plates — features, each beside a plate a pen draws as you reach it:
 * a topographic map, a wireframe globe, a tunnel of turning squares. Copy on
 * one side, the print on the other, alternating.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens. Titles take one emphasised word
 * between asterisks, set in `font-serif`. The prints are `bg-card` sheets.
 *
 * Drawings are made in the browser; the copy is in the server HTML. Pass
 * `art` per feature to choose the drawing. Reduced motion shows them drawn.
 */
import { onMounted, ref } from 'vue';
import { ScrollDraw } from 'svg-scroll-draw/vue';
import 'svg-scroll-draw/no-flash.css';
import { contours, globe, scrollWindow, staggerFor, tunnel, type Stroke } from '@/lib/plotter';

type Art = 'contours' | 'globe' | 'tunnel';

export interface PlateFeature {
  title: string;
  body: string;
  art?: Art;
  caption?: string;
}

export interface FeaturePlatesProps {
  eyebrow?: string;
  heading?: string;
  features?: PlateFeature[];
  accent?: string;
  className?: string;
}

const props = withDefaults(defineProps<FeaturePlatesProps>(), {
  eyebrow: 'Features',
  heading: 'Drawn from the data up.',
  features: () => [
    { title: 'Every number, *mapped*.', body: 'Dashboards that show the shape of your data, not just its totals. Drill from a year to a minute without losing your place.', art: 'contours', caption: 'Fig. 2 — Contours' },
    { title: 'Data from *everywhere*.', body: 'Events arrive from forty regions and land on one screen in under a second, already joined, already clean.', art: 'globe', caption: 'Fig. 3 — Meridians' },
    { title: 'Go as *deep* as you like.', body: 'Every chart opens into the rows behind it. Every row opens into the event that made it. Nothing is summarised away.', art: 'tunnel', caption: 'Fig. 4 — Tunnel' },
  ],
  accent: '#e0482a',
  className: '',
});

const ARTS: Art[] = ['contours', 'globe', 'tunnel'];
const MAKE: Record<Art, () => Stroke[]> = {
  contours: () => contours({ seed: 11 }),
  globe: () => globe({}),
  tunnel: () => tunnel({}),
};
const split = (t: string) => t.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p }));

const plates = ref<Stroke[][] | null>(null);
onMounted(() => {
  plates.value = props.features.map((ft, i) => MAKE[ft.art ?? ARTS[i % ARTS.length]]());
});
</script>

<template>
  <section :class="['mx-auto max-w-7xl px-6 py-28 sm:px-10', className]">
    <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
    <h2 class="mt-6 max-w-3xl font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">{{ heading }}</h2>

    <div class="mt-24 space-y-28 sm:space-y-40">
      <div v-for="(ft, i) in features" :key="ft.title" class="grid items-center gap-10 md:grid-cols-2 md:gap-20">
        <div :class="i % 2 ? 'md:order-2' : ''">
          <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ String(i + 1).padStart(2, '0') }}</p>
          <h3 class="mt-5 text-balance font-serif text-[clamp(2rem,3.4vw,3rem)] leading-[1.02] tracking-[-0.025em]">
            <template v-for="(p, k) in split(ft.title)" :key="k"><em v-if="p.em" class="italic">{{ p.text }}</em><span v-else>{{ p.text }}</span></template>
          </h3>
          <p class="mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-muted-foreground">{{ ft.body }}</p>
        </div>
        <figure>
          <div class="aspect-[4/3] w-full rounded-[3px] bg-card p-[7%] shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-20px_rgba(40,30,10,.28)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05),0_24px_60px_-24px_rgba(0,0,0,.8)]">
            <!-- Drawn as the plate rises, the last stroke landing as it reaches the middle of the screen. -->
            <ScrollDraw v-if="plates" :stagger="staggerFor(plates[i].length, 1)" easing="linear" :trigger="scrollWindow(1)" class="size-full" aria-hidden="true">
              <svg viewBox="0 0 400 300" class="size-full" fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round">
                <path v-for="(s, k) in plates[i]" :key="k" :d="s.d" v-bind="s.pen ? { stroke: accent, 'stroke-width': 1.4 } : {}" />
              </svg>
            </ScrollDraw>
          </div>
          <figcaption v-if="ft.caption" class="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{{ ft.caption }}</figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>
