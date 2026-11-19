<script setup lang="ts">
/**
 * ink-highlight — a mark a pen makes on words in running text: an underline,
 * a double underline, a loop round them, a box, a line struck through, or
 * hatching behind. It sits inline in a paragraph and follows the words when
 * they wrap: each line the phrase takes gets its own mark, drawn in turn.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, lib/plotter, lib/ink-core and lib/ink-vue (installed with it).
 * Styling: Tailwind CSS. The words keep the paragraph's own type and colour.
 *
 *   <p>Most sections <InkHighlight variant="circle">sit still</InkHighlight>.</p>
 *
 * The words are plain text in the server HTML; the marks are made in the
 * browser, measured to the words, and made again when the layout changes.
 * Reduced motion shows them drawn.
 */
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { blockOf, highlightMark, highlightSpread, measureLines, type InkMark } from '@/lib/ink-core';
import { vInk } from '@/lib/ink-vue';

export interface InkHighlightProps {
  variant?: 'underline' | 'double-underline' | 'circle' | 'box' | 'strike' | 'hatch-fill';
  /** The pen's colour. */
  accent?: string;
  strokeWidth?: number;
  /** Shapes the marks; the same seed draws the same marks. */
  seed?: number;
  /** `scroll`: drawn as the words rise, done at mid-screen. `view`: played once as they come into view. */
  trigger?: 'scroll' | 'view';
  /** With `view`, how long each line's mark takes, in ms. */
  duration?: number;
  /** The element the words sit in: `mark` by default, `s` for a strike. */
  as?: string;
  className?: string;
}

const props = withDefaults(defineProps<InkHighlightProps>(), {
  variant: 'underline',
  accent: '#e0482a',
  strokeWidth: 1.8,
  seed: 1,
  trigger: 'scroll',
  duration: 900,
  className: '',
});

// <mark>'s own yellow and black are reset in the template; `className` goes on
// the words inside, so a colour passed in wins.

const root = ref<HTMLElement | null>(null);
const origin = ref<HTMLElement | null>(null);
/** One mark per line the words take, sized to that line's box. */
const marks = shallowRef<InkMark[]>([]);
let last = '';
const measure = () => {
  if (!root.value || !origin.value) return;
  const lines = measureLines(root.value, origin.value);
  const sig = JSON.stringify(lines);
  if (sig === last) return;
  last = sig;
  marks.value = lines.map((r, i) => highlightMark(props.variant, r, props.seed + i * 7));
};
let ro: ResizeObserver | undefined;
onMounted(() => {
  measure();
  // Words reflow when their block changes width, or when a web font arrives.
  ro = new ResizeObserver(measure);
  ro.observe(blockOf(root.value!));
  document.fonts?.ready.then(measure);
});
onBeforeUnmount(() => ro?.disconnect());
watch(() => [props.variant, props.seed], () => { last = ''; measure(); });
</script>

<template>
  <component :is="as ?? (variant === 'strike' ? 's' : 'mark')" ref="root" :class="`relative bg-transparent text-inherit no-underline ${variant === 'hatch-fill' ? 'isolate' : ''}`">
    <span ref="origin" aria-hidden="true" class="pointer-events-none absolute left-0 top-0 size-0" />
    <span v-if="className" :class="className"><slot /></span>
    <slot v-else />
    <svg
      v-for="(m, i) in marks"
      :key="`${i}:${m.x},${m.y},${m.w}x${m.h}`"
      v-ink="{ paths: m.strokes.length, spread: highlightSpread(variant, m.strokes.length), trigger, duration, version: m }"
      data-scroll-draw-pending=""
      :data-ink="trigger"
      aria-hidden="true"
      :width="m.w"
      :height="m.h"
      :viewBox="`0 0 ${m.w} ${m.h}`"
      :class="`pointer-events-none absolute overflow-visible ${variant === 'hatch-fill' ? '-z-10 opacity-80' : ''}`"
      :style="{ left: `${m.x}px`, top: `${m.y}px` }"
      fill="none"
      :stroke="accent"
      :stroke-width="variant === 'hatch-fill' ? strokeWidth * 0.9 : strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path v-for="(s, k) in m.strokes" :key="k" :d="s.d" />
    </svg>
  </component>
</template>
