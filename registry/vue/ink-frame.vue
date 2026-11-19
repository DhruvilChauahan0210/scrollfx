<script setup lang="ts">
/**
 * ink-frame — a border a pen draws round anything: a card, a figure, an
 * image, a quote. `rect` and `rounded` go round twice, ink then accent, never
 * quite on the same line; `double` draws a second, finer frame inside the
 * first; `corner-marks` sets crop marks at the corners, as on a proof.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, lib/plotter, lib/ink-core and lib/ink-vue (installed with it).
 * Styling: Tailwind CSS. The frame draws on the box's edge: give the box its
 * own padding (and a `bg-card` if it should read as a sheet).
 *
 * What it frames (the default slot) is in the server HTML; the frame is made
 * in the browser at the size it finds, and made again when that changes.
 * Reduced motion shows it drawn.
 */
import { computed, shallowRef } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { FRAME_BLEED as BLEED, frameStrokes } from '@/lib/ink-core';
import { vInk, vSized } from '@/lib/ink-vue';

export interface InkFrameProps {
  variant?: 'rect' | 'rounded' | 'double' | 'corner-marks';
  /** The ink's colour. */
  color?: string;
  /** The accent pen's colour (the second pass, the inner frame). */
  accent?: string;
  strokeWidth?: number;
  seed?: number;
  /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: 'scroll' | 'view';
  /** With `view`, the drawing's length in ms. */
  duration?: number;
  className?: string;
}

const props = withDefaults(defineProps<InkFrameProps>(), {
  variant: 'rect',
  color: 'currentColor',
  accent: '#e0482a',
  strokeWidth: 1.1,
  seed: 1,
  trigger: 'scroll',
  duration: 1400,
  className: '',
});

const size = shallowRef<{ w: number; h: number } | null>(null);
const strokes = computed(() => (size.value ? frameStrokes(props.variant, size.value.w, size.value.h, props.seed) : null));
const n = computed(() => strokes.value?.length ?? 0);
</script>

<template>
  <div v-sized="(s: { w: number; h: number }) => (size = s)" :class="`relative ${className}`">
    <slot />
    <!-- The second pass follows the first; crop marks go down one corner after another. -->
    <svg
      v-if="size && strokes"
      :key="`${size.w}x${size.h}`"
      v-ink="{ paths: n, spread: n > 1 ? 0.5 : 0, trigger, duration, version: `${size.w}x${size.h}` }"
      data-scroll-draw-pending=""
      :data-ink="trigger"
      aria-hidden="true"
      :width="size.w + 2 * BLEED"
      :height="size.h + 2 * BLEED"
      :viewBox="`0 0 ${size.w + 2 * BLEED} ${size.h + 2 * BLEED}`"
      class="pointer-events-none absolute overflow-visible"
      :style="{ left: `${-BLEED}px`, top: `${-BLEED}px` }"
      fill="none"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        v-for="(s, i) in strokes"
        :key="i"
        :d="s.d"
        :transform="s.at ? `translate(${s.at} ${s.at})` : undefined"
        :stroke="s.pen ? accent : undefined"
        :stroke-width="s.pen && variant === 'double' ? strokeWidth * 0.8 : undefined"
      />
    </svg>
  </div>
</template>
