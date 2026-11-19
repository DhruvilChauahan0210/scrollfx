/**
 * chart-vue — what the scrollfx charts share, in Vue 3: the pens layered in
 * one box, the box's measured size, the labels up the left and along the
 * bottom, the key, and the data table for screen readers. The sums behind
 * them (scales, ticks, curves, hatching and when each pen works) are in
 * lib/chart-core.ts, which the React and Svelte charts share.
 *
 * Strokes are made in the browser at the chart's measured size, so hatching
 * keeps the same spacing at any width. Labels, ticks and the data table are
 * plain HTML, rendered on the server.
 *
 * Part of scrollfx (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 */

import { defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, type PropType, type Ref } from 'vue';
import { ScrollDraw } from 'svg-scroll-draw/vue';
import { LABEL, penLayers, penOptions, swatch, watchSize, xLabels, yLabelTop, yLabelsWidth, type ChartTrigger, type LegendKind, type Pen, type Series, type Size, type Tick } from '@/lib/chart-core';

/**
 * The box's size in CSS pixels, once it is in the page (null on the server
 * and before mounting, so the server HTML carries no strokes). Later changes,
 * such as a phone turning, settle for a moment before redrawing.
 */
export function useSize(): [Ref<HTMLElement | null>, Ref<Size | null>] {
  const el = ref<HTMLElement | null>(null);
  const size = shallowRef<Size | null>(null);
  let stop = () => {};
  onMounted(() => { if (el.value) stop = watchSize(el.value, (s) => (size.value = s)); });
  onBeforeUnmount(() => stop());
  return [el, size];
}

/** The pens, layered in order in one box: each its own svg-scroll-draw drawing. */
export const PenLayers = defineComponent({
  name: 'PenLayers',
  props: {
    size: { type: Object as PropType<Size>, required: true },
    pens: { type: Array as PropType<Pen[]>, required: true },
    trigger: { type: String as PropType<ChartTrigger>, default: 'scroll' },
    duration: { type: Number, default: 1800 },
  },
  setup(props) {
    return () =>
      penLayers(props.size, props.pens).map(({ pen: p, key }) =>
        h(
          ScrollDraw,
          { key, class: 'pointer-events-none absolute inset-0', 'aria-hidden': 'true', ...penOptions(p, props.trigger, props.duration) },
          () =>
            h(
              'svg',
              { viewBox: `0 0 ${props.size.w} ${props.size.h}`, 'data-ink': props.trigger, class: 'block size-full overflow-visible', fill: 'none', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
              p.marks.map((m, j) => h('path', { key: j, d: m.d, stroke: m.color, 'stroke-width': m.width ?? 1, opacity: m.opacity })),
            ),
        ),
      );
  },
});

/** Labels up the left of a plot, each centred on its fraction of the height (0 at the bottom). */
export const YLabels = defineComponent({
  name: 'YLabels',
  props: { ticks: { type: Array as PropType<Tick[]>, required: true } },
  setup(props) {
    return () =>
      h(
        'div',
        { 'data-slot': 'y-labels', class: `relative shrink-0 ${LABEL} tabular-nums`, style: { width: `${yLabelsWidth(props.ticks)}ch` } },
        props.ticks.map((t, i) => h('span', { key: i, class: 'absolute right-[1ch] -translate-y-1/2 whitespace-nowrap leading-none', style: { top: yLabelTop(t) } }, t.label)),
      );
  },
});

/**
 * Labels along the bottom, each centred on its fraction of the width; the
 * ones at the very ends align inward so they stay inside. Where the chart is
 * too narrow for them all (a container query, so it holds in a card as on a
 * phone), every other one goes, then all but every fourth.
 */
export const XLabels = defineComponent({
  name: 'XLabels',
  props: { ticks: { type: Array as PropType<Tick[]>, required: true }, offset: String },
  setup(props) {
    return () =>
      h(
        'div',
        { 'data-slot': 'x-labels', class: `@container relative mt-2.5 h-4 ${LABEL} tabular-nums`, style: props.offset ? { marginLeft: props.offset } : undefined },
        xLabels(props.ticks).map((t, i) => h('span', { key: i, class: t.className, style: { left: t.left } }, t.label)),
      );
  },
});

/** A key: a small swatch for each series, drawn as its strokes are, beside its label. */
export const Legend = defineComponent({
  name: 'Legend',
  props: {
    series: { type: Array as PropType<Series[]>, required: true },
    kind: { type: String as PropType<LegendKind>, required: true },
  },
  setup(props) {
    // Its class (spacing, alignment) falls through from the chart onto the list.
    return () =>
      h(
        'ul',
        { 'data-slot': 'legend', class: `flex flex-wrap items-center gap-x-6 gap-y-2 ${LABEL}` },
        props.series.map((s) =>
          h('li', { key: s.key, class: 'flex items-center gap-2' }, [
            h(
              'svg',
              { viewBox: '0 0 18 12', class: 'h-3 w-[18px] shrink-0 overflow-visible', fill: 'none', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' },
              swatch(s, props.kind).map((p, i) => h('path', { key: i, d: p.d, stroke: p.stroke, 'stroke-width': p.width, opacity: p.opacity, fill: p.fill })),
            ),
            h('span', { class: 'text-foreground/80' }, s.label),
          ]),
        ),
      );
  },
});

/** The numbers behind a chart, as a table only screen readers see. */
export const DataTable = defineComponent({
  name: 'DataTable',
  props: {
    caption: { type: String, required: true },
    head: { type: Array as PropType<string[]>, required: true },
    rows: { type: Array as PropType<(string | number)[][]>, required: true },
  },
  setup(props) {
    return () =>
      h('table', { class: 'sr-only' }, [
        h('caption', null, props.caption),
        h('thead', null, h('tr', null, props.head.map((c, i) => h('th', { key: i, scope: 'col' }, c)))),
        h('tbody', null, props.rows.map((r, i) => h('tr', { key: i }, r.map((c, j) => (j === 0 ? h('th', { key: j, scope: 'row' }, c) : h('td', { key: j }, c)))))),
      ]);
  },
});
