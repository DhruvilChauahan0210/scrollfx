<script setup lang="ts">
/**
 * ink-signature — a name written out by a pen, stroke by stroke, in writing
 * order and at one steady speed, then underlined with a flourish in the
 * accent pen. The name is set in Hershey's script, a single-stroke
 * handwriting font, so every line is drawn once, as a hand draws it. Or pass
 * your own signature as SVG paths.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, lib/plotter, lib/ink-core and lib/ink-vue (installed with it).
 * Styling: Tailwind CSS. The ink is `currentColor` unless you pass `color`.
 *
 * The name is in the server HTML (as the drawing's accessible name) and the
 * drawing's box is laid out there too, so nothing moves when it is drawn; the
 * strokes are made in the browser. Reduced motion shows the name written.
 */
import { computed, onMounted, ref } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { signatureLayout, signatureStrokes } from '@/lib/ink-core';
import { vInk } from '@/lib/ink-vue';

export interface InkSignatureProps {
  /** The name to write. Letters outside ASCII lose their accents; others are left out. */
  name?: string;
  /** The size of the writing: px to the em. */
  size?: number;
  /** How far the writing leans: x moved right per unit up. */
  slant?: number;
  /** Underline the name with a flourish in the accent pen. */
  flourish?: boolean;
  /**
   * Your own signature instead: SVG path data, one string per stroke, in the
   * order they were written, inside `viewBox`. Each stroke takes one beat.
   */
  paths?: string[];
  /** The box `paths` are drawn in, as an SVG viewBox ("0 0 w h"). */
  viewBox?: string;
  /** The ink's colour. */
  color?: string;
  /** The flourish's colour. */
  accent?: string;
  strokeWidth?: number;
  /** Shapes the flourish. */
  seed?: number;
  /** `scroll`: written as it rises, done at mid-screen. `view`: written once as it comes into view. */
  trigger?: 'scroll' | 'view';
  /** With `view`, how long the writing takes, in ms. */
  duration?: number;
  className?: string;
}

const props = withDefaults(defineProps<InkSignatureProps>(), {
  name: 'Ada Marlow',
  size: 56,
  slant: 0.2,
  flourish: true,
  color: 'currentColor',
  accent: '#e0482a',
  strokeWidth: 1.7,
  seed: 1,
  trigger: 'scroll',
  duration: 2600,
  className: '',
});

// Laid out on the server as well, so the box is the right size from the first paint.
const layout = computed(() =>
  signatureLayout({ name: props.name, size: props.size, slant: props.slant, strokeWidth: props.strokeWidth, flourish: props.flourish, paths: props.paths, viewBox: props.viewBox }),
);

// The strokes are made in the browser: even pieces, one after another, as the pen writes at one speed.
const mounted = ref(false);
onMounted(() => (mounted.value = true));
const strokes = computed(() =>
  mounted.value ? signatureStrokes({ laid: layout.value.laid, flourish: props.flourish, size: props.size, seed: props.seed, paths: props.paths }) : null,
);
const n = computed(() => strokes.value?.length ?? 0);
</script>

<template>
  <span role="img" :aria-label="paths ? `Signature: ${name}` : name" :class="`inline-block align-middle ${className}`">
    <svg
      :key="strokes ? 'drawn' : 'empty'"
      v-ink="{ paths: n, spread: Math.max(0, n - 1), trigger, duration, version: strokes }"
      data-scroll-draw-pending=""
      :data-ink="trigger"
      aria-hidden="true"
      :width="layout.w"
      :height="layout.h"
      :viewBox="layout.box"
      class="block h-auto max-w-full overflow-visible"
      fill="none"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path v-for="(s, i) in strokes ?? []" :key="i" :d="s.d" :stroke="s.pen ? accent : undefined" />
    </svg>
  </span>
</template>
