/**
 * chart — what the scrollfx charts share, in React: the pens layered in one
 * box, the box's measured size, the labels up the left and along the bottom,
 * the key, and the data table for screen readers. The rest (series from a
 * config, nice ticks and scales, curves, markers, hatching for bars, areas and
 * wedges, and when each pen works: the axes first, then the hatching, then the
 * lines in the accent colour, the last pen lifting exactly as the chart
 * reaches the middle of the screen, or, with `trigger="view"`, played once in
 * the same order as it comes into view) is in lib/chart-core.ts, which the Vue
 * and Svelte charts share; it is re-exported here.
 *
 * Strokes are made in the browser at the chart's measured size, so hatching
 * keeps the same spacing at any width. Labels, ticks and the data table are
 * plain HTML, rendered on the server.
 *
 * Part of scrollfx (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 */

import { createElement as h, Fragment, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { LABEL, penLayers, penOptions, swatch, watchSize, xLabels, yLabelTop, yLabelsWidth, type ChartTrigger, type LegendKind, type Pen, type Series, type Size, type Tick } from './chart-core';

export * from './chart-core';

/** The pens, layered in order in one box: each its own svg-scroll-draw drawing. */
export function PenLayers({ size, pens, trigger = 'scroll', duration = 1800 }: { size: Size; pens: Pen[]; trigger?: ChartTrigger; duration?: number }) {
  return h(
    Fragment,
    null,
    penLayers(size, pens).map(({ pen: p, key }) =>
      h(
        ScrollDraw,
        {
          key,
          className: 'pointer-events-none absolute inset-0',
          'aria-hidden': true,
          ...penOptions(p, trigger, duration),
          children: h(
            'svg',
            { viewBox: `0 0 ${size.w} ${size.h}`, 'data-ink': trigger, className: 'block size-full overflow-visible', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' },
            p.marks.map((m, j) => h('path', { key: j, d: m.d, stroke: m.color, strokeWidth: m.width ?? 1, opacity: m.opacity })),
          ),
        },
      ),
    ),
  );
}

/**
 * The box's size in CSS pixels, once it is in the page (null on the server
 * and the first render, so the server HTML carries no strokes). Later
 * changes, such as a phone turning, settle for a moment before redrawing.
 */
export function useSize<T extends HTMLElement>(): [RefObject<T | null>, Size | null] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size | null>(null);
  useEffect(() => (ref.current ? watchSize(ref.current, setSize) : undefined), []);
  return [ref, size];
}

/** Labels up the left of a plot, each centred on its fraction of the height (0 at the bottom). */
export function YLabels({ ticks }: { ticks: Tick[] }) {
  return h(
    'div',
    { 'data-slot': 'y-labels', className: `relative shrink-0 ${LABEL} tabular-nums`, style: { width: `${yLabelsWidth(ticks)}ch` } },
    ticks.map((t, i) => h('span', { key: i, className: 'absolute right-[1ch] -translate-y-1/2 whitespace-nowrap leading-none', style: { top: yLabelTop(t) } }, t.label)),
  );
}

/**
 * Labels along the bottom, each centred on its fraction of the width; the
 * ones at the very ends align inward so they stay inside. Where the chart is
 * too narrow for them all (a container query, so it holds in a card as on a
 * phone), every other one goes, then all but every fourth.
 */
export function XLabels({ ticks, offset }: { ticks: Tick[]; offset?: string }) {
  return h(
    'div',
    { 'data-slot': 'x-labels', className: `@container relative mt-2.5 h-4 ${LABEL} tabular-nums`, style: offset ? { marginLeft: offset } : undefined },
    xLabels(ticks).map((t, i) => h('span', { key: i, className: t.className, style: { left: t.left } }, t.label)),
  );
}

/** A key: a small swatch for each series, drawn as its strokes are, beside its label. */
export function Legend({ series, kind, className = '' }: { series: Series[]; kind: LegendKind; className?: string }) {
  return h(
    'ul',
    { 'data-slot': 'legend', className: `flex flex-wrap items-center gap-x-6 gap-y-2 ${LABEL} ${className}` },
    series.map((s) =>
      h(
        'li',
        { key: s.key, className: 'flex items-center gap-2' },
        h(
          'svg',
          { viewBox: '0 0 18 12', className: 'h-3 w-[18px] shrink-0 overflow-visible', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          swatch(s, kind).map((p, i): ReactNode => h('path', { key: i, d: p.d, stroke: p.stroke, strokeWidth: p.width, opacity: p.opacity, fill: p.fill })),
        ),
        h('span', { className: 'text-foreground/80' }, s.label),
      ),
    ),
  );
}

/** The numbers behind a chart, as a table only screen readers see. */
export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return h(
    'table',
    { className: 'sr-only' },
    h('caption', null, caption),
    h('thead', null, h('tr', null, head.map((c, i) => h('th', { key: i, scope: 'col' }, c)))),
    h('tbody', null, rows.map((r, i) => h('tr', { key: i }, r.map((c, j) => (j === 0 ? h('th', { key: j, scope: 'row' }, c) : h('td', { key: j }, c)))))),
  );
}
