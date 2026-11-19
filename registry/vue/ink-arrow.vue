<script setup lang="ts">
/**
 * ink-arrow — an arrow drawn by hand to point at something: nearly straight,
 * curved to one side, or with a loop thrown half way, ending in a head made
 * in one stroke. The pen goes at one speed, shaft first, then the head.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, lib/plotter, lib/ink-core and lib/ink-vue (installed with it).
 * Styling: Tailwind CSS. Place it with `className` (absolute, in a flex row,
 * beside a note); `from` and `to` set where it starts and ends in its box.
 *
 * The arrow is made in the browser and hidden from assistive tech: say in
 * text what it points at. Reduced motion shows it drawn.
 */
import { computed, onMounted, ref } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { inkArrow } from '@/lib/plotter';
import { vInk } from '@/lib/ink-vue';

export interface InkArrowProps {
  variant?: 'straight' | 'curved' | 'looped';
  /** The box the arrow is drawn in, in px. */
  width?: number;
  height?: number;
  /** Where the arrow starts, as a share of the box (0 to 1 across, 0 to 1 down). */
  from?: [number, number];
  /** Where its head is, likewise. */
  to?: [number, number];
  /** How far a curved or looped arrow bends to one side, as a share of its length; negative bends it the other way. */
  bend?: number;
  /** The length of the head's barbs, in px. */
  head?: number;
  /** The pen's colour: the accent, unless you pass `currentColor` for ink. */
  accent?: string;
  strokeWidth?: number;
  seed?: number;
  /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: 'scroll' | 'view';
  /** With `view`, how long the arrow takes, in ms. */
  duration?: number;
  className?: string;
}

const props = withDefaults(defineProps<InkArrowProps>(), {
  variant: 'curved',
  width: 160,
  height: 96,
  from: () => [0.06, 0.3],
  to: () => [0.92, 0.74],
  bend: 0.3,
  head: 12,
  accent: '#e0482a',
  strokeWidth: 1.6,
  seed: 1,
  trigger: 'scroll',
  duration: 1100,
  className: '',
});

// Made in the browser, once mounted.
const mounted = ref(false);
onMounted(() => (mounted.value = true));
const strokes = computed(() =>
  mounted.value
    ? inkArrow({ w: props.width, h: props.height, kind: props.variant, from: [props.from[0], props.from[1]], to: [props.to[0], props.to[1]], bend: props.bend, seed: props.seed, head: props.head })
    : null,
);
// One piece after another: the pen keeps one speed down the shaft and round the head.
const n = computed(() => strokes.value?.length ?? 0);
</script>

<template>
  <svg
    :key="strokes ? strokes.length + strokes[0]?.d : 'empty'"
    v-ink="{ paths: n, spread: Math.max(0, n - 1), trigger, duration, version: strokes }"
    data-scroll-draw-pending=""
    :data-ink="trigger"
    aria-hidden="true"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    :class="`pointer-events-none shrink-0 overflow-visible ${className}`"
    fill="none"
    :stroke="accent"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path v-for="(s, i) in strokes ?? []" :key="i" :d="s.d" />
  </svg>
</template>
