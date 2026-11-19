<script setup lang="ts">
/**
 * ink-divider — a rule between sections that a pen draws across the page:
 * straight, wavy, sketchy (ruled twice, ink then accent), dotted, or a pair
 * of rules drawn outward from a label in the middle.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, lib/plotter, lib/ink-core and lib/ink-vue (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens; it takes the width it is given.
 *
 * The label is in the server HTML; the rules are made in the browser at the
 * width they find, and made again when it changes. Reduced motion shows them
 * drawn.
 */
import { computed, onMounted, reactive, ref } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { sketchCircle, type Stroke } from '@/lib/plotter';
import { DIVIDER_H as H, dividerLabelRule, dividerSpread, dividerStrokes } from '@/lib/ink-core';
import { vInk, vSized } from '@/lib/ink-vue';

export interface InkDividerProps {
  variant?: 'straight' | 'wavy' | 'sketchy' | 'dotted' | 'with-label';
  /** The words in the middle, for `with-label`. */
  label?: string;
  /** The ink's colour. */
  color?: string;
  /** The accent pen's colour (the sketchy second pass, the label's dots). */
  accent?: string;
  strokeWidth?: number;
  seed?: number;
  /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: 'scroll' | 'view';
  /** With `view`, the drawing's length in ms. */
  duration?: number;
  className?: string;
}

const props = withDefaults(defineProps<InkDividerProps>(), {
  variant: 'straight',
  label: 'Section',
  color: 'currentColor',
  accent: '#e0482a',
  strokeWidth: 1.1,
  seed: 1,
  trigger: 'scroll',
  duration: 1200,
  className: '',
});

type Side = 'left' | 'right' | 'main';
/** Each rule's box, measured; a rule is drawn across the width it finds. */
const widths = reactive<Partial<Record<Side, number>>>({});
const measure = (side: Side) => (s: { w: number }) => { widths[side] = s.w; };
const measures = { left: measure('left'), right: measure('right'), main: measure('main') };

/** A rule's strokes across the width it finds: beside the label, drawn outward from it; or the variant's one rule. */
function strokesFor(side: Side, w: number): Stroke[] {
  if (side === 'left' || side === 'right') return dividerLabelRule(side, w, props.seed);
  return dividerStrokes(props.variant as Exclude<typeof props.variant, 'with-label'>, w, props.seed);
}
/**
 * Each measured rule, drawn. The two beside a label are drawn at once; dots
 * go down one after another, left to right; the sketchy rule's second pass
 * follows the first.
 */
const drawn = computed(() => {
  const out: Partial<Record<Side, { w: number; strokes: Stroke[]; spread: number }>> = {};
  for (const side of ['left', 'right', 'main'] as const) {
    const w = widths[side];
    if (!w || w <= 4 || (side === 'main') === (props.variant === 'with-label')) continue;
    const strokes = strokesFor(side, w);
    out[side] = { w, strokes, spread: side === 'main' ? dividerSpread(props.variant, strokes.length) : 0 };
  }
  return out;
});

/** What the divider is made of, in order: one rule, or a rule, a ring, the label, a ring and a rule. */
const parts = computed(() => (props.variant === 'with-label' ? (['left', 0, 'label', 1, 'right'] as const) : (['main'] as const)));

/** The small rings in the accent pen beside the label, made in the browser. */
const mounted = ref(false);
onMounted(() => (mounted.value = true));
const dots = computed(() => (mounted.value ? [sketchCircle({ size: 10, seed: props.seed + 1, r: 2.6 }), sketchCircle({ size: 10, seed: props.seed + 2, r: 2.6 })] : [[], []]));
</script>

<template>
  <div role="separator" :aria-label="variant === 'with-label' ? label : undefined" :class="variant === 'with-label' ? `flex items-center gap-3 ${className}` : `flex ${className}`">
    <template v-for="part in parts" :key="part">
      <span v-if="part === 'label'" class="shrink-0 px-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ label }}</span>
      <svg
        v-else-if="part === 0 || part === 1"
        v-ink="{ paths: dots[part].length, trigger, duration: duration * 0.4, version: dots[part] }"
        data-scroll-draw-pending=""
        :data-ink="trigger"
        aria-hidden="true"
        width="10"
        height="10"
        viewBox="0 0 10 10"
        class="shrink-0 overflow-visible"
        fill="none"
        :stroke="accent"
        :stroke-width="strokeWidth * 1.2"
        stroke-linecap="round"
      >
        <path v-for="(s, i) in dots[part]" :key="i" :d="s.d" />
      </svg>
      <div v-else v-sized="measures[part]" class="relative h-4 min-w-0 flex-1">
        <svg
          v-if="drawn[part]"
          :key="drawn[part].w"
          v-ink="{ paths: drawn[part].strokes.length, spread: drawn[part].spread, trigger, duration, version: drawn[part].w }"
          data-scroll-draw-pending=""
          :data-ink="trigger"
          aria-hidden="true"
          :width="drawn[part].w"
          :height="H"
          :viewBox="`0 0 ${drawn[part].w} ${H}`"
          class="absolute inset-0 block overflow-visible"
          fill="none"
          :stroke="color"
          :stroke-width="part === 'main' && variant === 'dotted' ? strokeWidth * 1.7 : strokeWidth"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path v-for="(s, i) in drawn[part].strokes" :key="i" :d="s.d" :stroke="s.pen ? accent : undefined" />
        </svg>
      </div>
    </template>
  </div>
</template>
