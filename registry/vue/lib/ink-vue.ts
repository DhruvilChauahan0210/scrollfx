/**
 * ink-vue — what the scrollfx ink components share, in Vue 3: ink() and
 * sized() from lib/ink-core.ts as directives. `v-ink="options"` on an <svg>
 * hands it to svg-scroll-draw (on the scroll, finishing at mid-screen, or
 * once in view) and starts again when the options change; `v-sized="fn"` on
 * an element calls `fn` with its size in whole px, now and whenever it
 * changes. The strokes, and Hershey's script, are in lib/ink-core.ts, which
 * the React and Svelte components share.
 *
 * Part of scrollfx (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 */

import type { Directive } from 'vue';
import { ink, sized, type InkOptions } from '@/lib/ink-core';

type Action<E extends Element, T> = (el: E, value: T) => { update(value: T): void; destroy(): void };

/** An action as a directive: made when the element mounts, updated with the component, destroyed with the element. */
function asDirective<E extends Element, T>(action: Action<E, T>): Directive<E, T> {
  const live = new WeakMap<E, ReturnType<Action<E, T>>>();
  return {
    mounted(el, binding) { live.set(el, action(el, binding.value)); },
    updated(el, binding) { live.get(el)?.update(binding.value); },
    beforeUnmount(el) { live.get(el)?.destroy(); live.delete(el); },
  };
}

/** `v-ink="{ paths, spread, trigger, duration, version }"`: give the svg `data-scroll-draw-pending` and a `key` that changes with its strokes. */
export const vInk = asDirective<SVGSVGElement, InkOptions>(ink);

/** `v-sized="(size) => …"`: the element's size in whole px, now and whenever it changes. */
export const vSized = asDirective<HTMLElement, (size: { w: number; h: number }) => void>(sized);
