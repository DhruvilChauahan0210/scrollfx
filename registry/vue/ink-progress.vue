<script setup lang="ts">
/**
 * ink-progress — a value plotted as the reader reaches it: a bar whose fill a
 * pen hatches in from the left and stops at the value, a ring with a band in
 * the accent pen out to it, or an instrument gauge ticked clockwise with a
 * needle on it.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, lib/plotter, lib/ink-core and lib/ink-vue (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens; figures in `font-serif`.
 *
 * The label and the value are in the server HTML (role="progressbar", with
 * aria-valuenow); the drawing is made in the browser and goes as far as the
 * value. Reduced motion shows it drawn.
 */
import { computed, onMounted, ref, shallowRef } from 'vue';
import { ScrollCounter } from 'svg-scroll-draw/vue';
import 'svg-scroll-draw/no-flash.css';
import { scrollWindow, seedOf } from '@/lib/plotter';
import { BAR_H, barStrokes, progressFigure, roundStrokes } from '@/lib/ink-core';
import { vInk, vSized } from '@/lib/ink-vue';

export interface InkProgressProps {
  value: number;
  max?: number;
  variant?: 'bar' | 'ring' | 'gauge';
  /** What the value is of, shown with it and read out with it. */
  label?: string;
  /** Show the value as a figure. */
  showValue?: boolean;
  /** Show the figure as a percentage of max (the default), or as the value itself. */
  display?: 'percent' | 'value';
  /** Set before and after the figure; after a percentage, `%` unless you pass one. */
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** The ring's or gauge's width and height, in px. */
  size?: number;
  /** The ink's colour. */
  color?: string;
  /** The accent pen's colour: the fill, the band. */
  accent?: string;
  strokeWidth?: number;
  /** Shapes the strokes; by default taken from the label. */
  seed?: number;
  /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: 'scroll' | 'view';
  /** With `view`, the drawing's length in ms. */
  duration?: number;
  className?: string;
}

const props = withDefaults(defineProps<InkProgressProps>(), {
  max: 100,
  variant: 'bar',
  showValue: true,
  display: 'percent',
  size: 128,
  color: 'currentColor',
  accent: '#e0482a',
  strokeWidth: 1.1,
  trigger: 'scroll',
  duration: 1600,
  className: '',
});

const share = computed(() => Math.max(0, Math.min(1, props.value / props.max)));
const s = computed(() => props.seed ?? seedOf(props.label ?? `${props.variant}`));
/** The figure: counted up with the drawing on scroll, plain otherwise. Its final number is in the server HTML either way. */
const figure = computed(() => progressFigure({ value: props.value, max: props.max, display: props.display, prefix: props.prefix, suffix: props.suffix, decimals: props.decimals }));

// The bar: its outline and scale first, then the fill hatched in to the value.
const barWidth = shallowRef(0);
const bar = computed(() => (props.variant === 'bar' && barWidth.value > 10 ? barStrokes(barWidth.value, share.value, s.value) : null));

// The ring or gauge, made in the browser.
const mounted = ref(false);
onMounted(() => (mounted.value = true));
const round = computed(() => (mounted.value && props.variant !== 'bar' ? roundStrokes(props.variant, s.value, share.value) : null));
const roundWidth = computed(() => props.strokeWidth * (100 / props.size));
</script>

<template>
  <div
    v-if="variant === 'bar'"
    role="progressbar"
    :aria-valuenow="value"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label"
    :class="`w-full ${className}`"
  >
    <div v-if="label || showValue" class="mb-3 flex items-baseline justify-between gap-4">
      <span v-if="label" class="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{{ label }}</span>
      <span v-if="showValue" class="tabular-nums font-serif text-2xl tracking-[-0.02em]"
        >{{ figure.prefix }}<ScrollCounter v-if="trigger === 'scroll'" :to="figure.value" :decimals="figure.decimals" :trigger="scrollWindow()" /><template v-else>{{ figure.value.toFixed(figure.decimals) }}</template>{{ figure.suffix }}</span
      >
    </div>
    <div v-sized="(z: { w: number }) => (barWidth = z.w)" class="relative h-[30px] w-full">
      <svg
        v-if="bar"
        :key="barWidth"
        v-ink="{ paths: bar.length, spread: 1, trigger, duration, version: bar }"
        data-scroll-draw-pending=""
        :data-ink="trigger"
        aria-hidden="true"
        :width="barWidth"
        :height="BAR_H + 12"
        :viewBox="`0 0 ${barWidth} ${BAR_H + 12}`"
        class="block overflow-visible absolute inset-0"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path v-for="(k, i) in bar" :key="i" :d="k.d" :stroke="k.pen ? accent : undefined" :stroke-width="k.pen ? strokeWidth * 1.15 : undefined" />
      </svg>
    </div>
  </div>

  <div
    v-else
    role="progressbar"
    :aria-valuenow="value"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label"
    :class="`inline-flex flex-col items-center ${className}`"
  >
    <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
      <!-- A ring drawn once in ink, then the band; a gauge's ticks clockwise, then the band and the needle. -->
      <svg
        v-if="round"
        v-ink="{ paths: round.length, spread: variant === 'gauge' ? 0.8 : 0.6, trigger, duration, version: round }"
        data-scroll-draw-pending=""
        :data-ink="trigger"
        aria-hidden="true"
        :width="size"
        :height="size"
        viewBox="0 0 100 100"
        class="block overflow-visible absolute inset-0"
        fill="none"
        :stroke="color"
        :stroke-width="roundWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path v-for="(k, i) in round" :key="i" :d="k.d" :stroke="k.pen ? accent : undefined" :stroke-width="k.pen ? roundWidth * 1.15 : undefined" />
      </svg>
      <span
        v-if="showValue"
        :class="`tabular-nums absolute inset-x-0 text-center font-serif leading-none tracking-[-0.03em] ${variant === 'gauge' ? 'bottom-[4%]' : 'top-1/2 -translate-y-1/2'}`"
        :style="{ fontSize: `${Math.round(size * (variant === 'gauge' ? 0.2 : 0.24))}px` }"
        >{{ figure.prefix }}<ScrollCounter v-if="trigger === 'scroll'" :to="figure.value" :decimals="figure.decimals" :trigger="scrollWindow()" /><template v-else>{{ figure.value.toFixed(figure.decimals) }}</template>{{ figure.suffix }}</span
      >
    </div>
    <span v-if="label" class="mt-4 max-w-[16rem] text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{{ label }}</span>
  </div>
</template>
