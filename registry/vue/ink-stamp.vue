<script setup lang="ts">
/**
 * ink-stamp — a short word or two set inside a stamp a pen plots round it: a
 * round stamp with a line of text running round its rim, a rectangle ruled
 * twice, or a seal with a scalloped edge. Set a little askew, as a stamp
 * lands.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, lib/plotter, lib/ink-core and lib/ink-vue (installed with it).
 * Styling: Tailwind CSS. The whole stamp is in the one `accent` colour, as a
 * stamp is in one ink.
 *
 * The words (the default slot), and the rim's text on its circle, are in the
 * server HTML; the rings and the frame are made in the browser. Reduced
 * motion shows them drawn.
 */
import { Comment, Text, computed, onMounted, ref, shallowRef, useId, useSlots, type VNode } from 'vue';
import 'svg-scroll-draw/no-flash.css';
import { seedOf, stampRings } from '@/lib/plotter';
import { stampFrame, stampLayout } from '@/lib/ink-core';
import { vInk, vSized } from '@/lib/ink-vue';

export interface InkStampProps {
  variant?: 'circle' | 'rectangle' | 'seal';
  /** A line of text round the rim, for `circle` and `seal`. It is spaced to go once round. */
  rim?: string;
  /** The width and height of `circle` and `seal`, in px. */
  size?: number;
  /** How far the stamp is turned, in degrees. */
  rotate?: number;
  /** The stamp's ink. */
  accent?: string;
  strokeWidth?: number;
  seed?: number;
  /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: 'scroll' | 'view';
  /** With `view`, the drawing's length in ms. */
  duration?: number;
  className?: string;
}

const props = withDefaults(defineProps<InkStampProps>(), {
  variant: 'circle',
  size: 148,
  rotate: -8,
  accent: '#e0482a',
  strokeWidth: 1.4,
  trigger: 'scroll',
  duration: 1400,
  className: '',
});

const id = useId();
const slots = useSlots();
const s = computed(() => props.seed ?? seedOf(`${props.variant}${props.rim ?? ''}`));

/** The words, when the slot is plain text: they set the type's size so the longest fits inside the inner ring. */
function words(): string | undefined {
  const nodes = (slots.default?.() ?? []).filter((n: VNode) => n.type !== Comment);
  return nodes.length && nodes.every((n: VNode) => n.type === Text && typeof n.children === 'string') ? nodes.map((n) => n.children as string).join('') : undefined;
}
/** The rim's circle and type, and the words' size; read while rendering, as the slot is. */
const layout = () => stampLayout(props.variant === 'seal' ? 'seal' : 'circle', props.size, words());

// A round stamp's rings, made in the browser.
const mounted = ref(false);
onMounted(() => (mounted.value = true));
const rings = computed(() => (mounted.value && props.variant !== 'rectangle' ? stampRings({ size: 100, seed: s.value, kind: props.variant }) : null));

// A rectangle sizes to its words: ruled twice round the edge, then once more, finer, inside.
const measured = shallowRef<{ w: number; h: number } | null>(null);
const frame = computed(() => (props.variant === 'rectangle' && measured.value ? stampFrame(measured.value.w, measured.value.h, s.value) : null));
</script>

<template>
  <span
    v-if="variant === 'rectangle'"
    v-sized="(z: { w: number; h: number }) => (measured = z)"
    :class="`relative inline-flex items-center justify-center px-7 py-4 ${className}`"
    :style="{ rotate: `${rotate}deg`, color: accent }"
  >
    <span class="font-mono text-[15px] font-semibold uppercase leading-none tracking-[0.28em]"><slot /></span>
    <svg
      v-if="measured && frame"
      :key="`${measured.w}x${measured.h}`"
      v-ink="{ paths: frame.length, spread: 0.6, trigger, duration, version: frame }"
      data-scroll-draw-pending=""
      :data-ink="trigger"
      aria-hidden="true"
      :width="measured.w"
      :height="measured.h"
      :viewBox="`0 0 ${measured.w} ${measured.h}`"
      class="pointer-events-none absolute inset-0 overflow-visible"
      fill="none"
      :stroke="accent"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path v-for="(k, i) in frame" :key="i" :d="k.d" />
    </svg>
  </span>

  <span
    v-else
    :class="`relative inline-grid shrink-0 place-items-center ${className}`"
    :style="{ width: `${size}px`, height: `${size}px`, rotate: `${rotate}deg`, color: accent }"
  >
    <!-- The rim's text sits in the band between the outer rings and the inner one. -->
    <svg v-if="rim" aria-hidden="true" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="absolute inset-0 overflow-visible">
      <defs>
        <path :id="`${id}-rim`" :d="layout().circle" />
      </defs>
      <text fill="currentColor" class="font-mono uppercase" :style="{ fontSize: `${layout().rimFont}px`, letterSpacing: '0.12em' }" dominant-baseline="central">
        <textPath :href="`#${id}-rim`" :textLength="layout().rimLength" lengthAdjust="spacing">{{ rim }}</textPath>
      </text>
    </svg>
    <span class="max-w-[60%] text-center font-mono font-semibold uppercase leading-tight tracking-[0.2em]" :style="{ fontSize: `${layout().wordFont}px` }">
      <slot />
      <span v-if="rim" class="sr-only"> — {{ rim }}</span>
    </span>
    <svg
      v-if="rings"
      v-ink="{ paths: rings.length, spread: 0.6, trigger, duration, version: rings }"
      data-scroll-draw-pending=""
      :data-ink="trigger"
      aria-hidden="true"
      :width="size"
      :height="size"
      viewBox="0 0 100 100"
      class="pointer-events-none absolute inset-0 overflow-visible"
      fill="none"
      :stroke="accent"
      :stroke-width="strokeWidth * (100 / size)"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path v-for="(k, i) in rings" :key="i" :d="k.d" />
    </svg>
  </span>
</template>
