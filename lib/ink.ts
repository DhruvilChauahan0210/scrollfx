/**
 * ink — the React hooks the scrollfx ink components share: one that hands an
 * <svg> to svg-scroll-draw, either tied to the scroll (finishing as it
 * reaches the middle of the screen) or played once as it comes into view,
 * and one that measures an element. The strokes, and Hershey's script for
 * ink-signature, are in lib/ink-core, which the Vue and Svelte components
 * draw with too.
 *
 * Part of scrollfx (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/plotter and lib/ink-core (installed with it).
 */

import { useEffect, useState, type RefObject } from 'react';
import { ink, type InkOptions } from '@/lib/ink-core';

export { script, type InkOptions, type InkTrigger } from '@/lib/ink-core';

/**
 * Hand the svg in `ref` to svg-scroll-draw. Give the svg
 * `data-scroll-draw-pending` (with svg-scroll-draw/no-flash.css imported) and
 * a `key` that changes with its strokes, so new strokes never show whole for
 * a frame before the engine sets them.
 */
export function useInk(ref: RefObject<SVGSVGElement | null>, { paths, spread = 0, trigger = 'scroll', duration = 1200, version }: InkOptions) {
  useEffect(() => {
    const svg = ref.current;
    if (!svg || !paths) return;
    const draw = ink(svg, { paths, spread, trigger, duration });
    return () => draw.destroy();
  }, [ref, paths, spread, trigger, duration, version]);
}

/** An element's size in whole px, kept up to date; null until measured. */
export function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}
