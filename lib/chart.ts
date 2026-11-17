/**
 * chart — what the scrollfx charts share: series from a config (as shadcn's
 * chart takes one), nice ticks and scales, curves, markers, hatching for bars,
 * areas and wedges, and the pens that ink a chart in order as it scrolls in:
 * the axes first, then the hatching, then the lines in the accent colour, the
 * last pen lifting exactly as the chart reaches the middle of the screen (or,
 * with `trigger="view"`, played once in the same order as it comes into view).
 *
 * Strokes are made in the browser at the chart's measured size, so hatching
 * keeps the same spacing at any width. Labels, ticks and the data table are
 * plain HTML, rendered on the server.
 *
 * Part of scrollfx (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 */

import { createElement as h, Fragment, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { hatchPolygon, scrollWindow, staggerFor } from './plotter';

export type Pt = [number, number];
/** One row of chart data: the index key (a label) and a number per series. */
export type Datum = Record<string, string | number>;

/** How one series is named and inked. */
export interface SeriesConfig {
  label: string;
  /** Its pen colour. The first series takes the accent, the rest the ink (currentColor). */
  color?: string;
}
/** Series by key, in drawing order, like shadcn's ChartConfig. */
export type ChartConfig = Record<string, SeriesConfig>;

/** Parallel strokes: their angle in degrees (0 across, 90 upright), spacing, and a second pass across. */
export interface Hatch {
  angle: number;
  gap: number;
  cross?: boolean;
}
export type MarkerKind = 'circle' | 'square' | 'triangle' | 'diamond' | 'cross';

export interface Series {
  key: string;
  label: string;
  color: string;
  hatch: Hatch;
  marker: MarkerKind;
}

/** The scrollfx accent, a vermilion. */
export const ACCENT = '#e0482a';

/** Hatches told apart by angle and density, the way a plotter shades without colour. */
export const HATCHES: Hatch[] = [
  { angle: 60, gap: 5 },
  { angle: 120, gap: 5 },
  { angle: 90, gap: 4 },
  { angle: 45, gap: 7, cross: true },
  { angle: 0, gap: 4 },
  { angle: 30, gap: 6 },
];
export const MARKERS: MarkerKind[] = ['circle', 'square', 'triangle', 'diamond', 'cross'];

/** The series to draw: from the config, or every numeric key in the first datum. */
export function seriesOf(data: Datum[], index: string, config: ChartConfig | undefined, accent: string): Series[] {
  const keys = config ? Object.keys(config) : Object.keys(data[0] ?? {}).filter((k) => k !== index && typeof data[0][k] === 'number');
  return keys.map((key, i) => ({
    key,
    label: config?.[key]?.label ?? key,
    color: config?.[key]?.color ?? (i === 0 ? accent : 'currentColor'),
    hatch: HATCHES[i % HATCHES.length],
    marker: MARKERS[i % MARKERS.length],
  }));
}

export const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Round ticks covering lo to hi, about `count` of them: steps of 1, 2 or 5 times a power of ten. */
export function niceTicks(lo: number, hi: number, count = 5): number[] {
  if (!(hi > lo)) hi = lo + 1;
  const raw = (hi - lo) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const e = raw / mag;
  const step = (e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1) * mag;
  const out: number[] = [];
  for (let v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + step * 1e-6; v += step) out.push(+v.toPrecision(12));
  return out;
}

/** A linear scale from [d0, d1] to [r0, r1]. */
export const linear = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

/** How axis numbers are written: compact by default (1.2K). Fixed to one locale so the server and browser agree. */
export function formatter(format?: Intl.NumberFormatOptions, locale = 'en-US') {
  const nf = new Intl.NumberFormat(locale, format ?? { notation: 'compact', maximumFractionDigits: 1 });
  return (v: number) => nf.format(v);
}

const f = (v: number) => v.toFixed(1);
export const toPath = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');

export type Curve = 'smooth' | 'linear' | 'step';

/**
 * A line through points, as dense points (for hatching under it). Smooth is a
 * monotone cubic: it never overshoots a point, so a curve never dips below zero
 * between two positive values.
 */
export function curvePoints(pts: Pt[], curve: Curve = 'smooth', per = 14): Pt[] {
  if (pts.length < 2) return pts;
  if (curve === 'linear') return pts;
  if (curve === 'step') {
    const out: Pt[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1][0] + pts[i][0]) / 2;
      out.push([mx, pts[i - 1][1]], [mx, pts[i][1]]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  const m = monotoneTangents(pts);
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const dx = x1 - x0;
    for (let k = 1; k <= per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const y = (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * dx * m[i] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * dx * m[i + 1];
      out.push([x0 + dx * t, y]);
    }
  }
  return out;
}

/** The same line as an SVG path: cubic Béziers for smooth, so the pen runs one clean stroke. */
export function curvePath(pts: Pt[], curve: Curve = 'smooth'): string {
  if (curve !== 'smooth' || pts.length < 3) return toPath(curvePoints(pts, curve));
  const m = monotoneTangents(pts);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const k = (x1 - x0) / 3;
    d += `C${f(x0 + k)} ${f(y0 + k * m[i])} ${f(x1 - k)} ${f(y1 - k * m[i + 1])} ${f(x1)} ${f(y1)}`;
  }
  return d;
}

// Fritsch–Carlson tangents (d3's curveMonotoneX).
function monotoneTangents(pts: Pt[]): number[] {
  const n = pts.length;
  const s = Array.from({ length: n - 1 }, (_, i) => (pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0] || 1));
  const m = pts.map((_, i) => (i === 0 ? s[0] : i === n - 1 ? s[n - 2] : s[i - 1] * s[i] <= 0 ? 0 : (s[i - 1] + s[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (s[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / s[i], b = m[i + 1] / s[i];
    const r = a * a + b * b;
    if (r > 9) { const t = 3 / Math.sqrt(r); m[i] = t * a * s[i]; m[i + 1] = t * b * s[i]; }
  }
  return m;
}

/** A circle as one path the pen can draw round, starting at its right. */
export const circle = (cx: number, cy: number, r: number) => `M${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 1 ${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 1 ${f(cx + r)} ${f(cy)}`;

/** A small plotted marker centred on (x, y). */
export function marker(kind: MarkerKind, x: number, y: number, r = 3.2): string {
  switch (kind) {
    case 'circle': return circle(x, y, r);
    case 'square': return toPath([[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r], [x - r, y - r]]);
    case 'triangle': return toPath([[x, y - r * 1.2], [x + r * 1.1, y + r * 0.8], [x - r * 1.1, y + r * 0.8], [x, y - r * 1.2]]);
    case 'diamond': return toPath([[x, y - r * 1.3], [x + r * 1.1, y], [x, y + r * 1.3], [x - r * 1.1, y], [x, y - r * 1.3]]);
    case 'cross': return `${toPath([[x - r, y - r], [x + r, y + r]])}${toPath([[x + r, y - r], [x - r, y + r]])}`;
  }
}

/** A rectangle's corners, clockwise from its top left. */
export const rect = (x: number, y: number, w: number, hh: number): Pt[] => [[x, y], [x + w, y], [x + w, y + hh], [x, y + hh]];

/** Points along an arc, angles in radians clockwise from twelve o'clock. */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, step = 0.04): Pt[] {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  return Array.from({ length: n + 1 }, (_, k): Pt => {
    const a = a0 + ((a1 - a0) * k) / n;
    return [cx + Math.sin(a) * r, cy - Math.cos(a) * r];
  });
}

/** A wedge of a pie (inner 0) or a ring segment of a donut, as an outline. */
export function wedge(cx: number, cy: number, inner: number, outer: number, a0: number, a1: number): Pt[] {
  const o = arc(cx, cy, outer, a0, a1);
  return inner > 0 ? [...o, ...arc(cx, cy, inner, a1, a0)] : [[cx, cy], ...o];
}

/** One stroke for the pens: its path, and how it is inked. */
export interface Mark {
  d: string;
  color?: string;
  width?: number;
  opacity?: number;
}

/** Hatching inside an outline (or several), as marks in one colour. */
export function hatchMarks(outline: Pt[] | Pt[][], hatch: Hatch, { color, width = 0.9, opacity = 0.8, inset = 2.5, reverse = false }: { color?: string; width?: number; opacity?: number; inset?: number; reverse?: boolean } = {}): Mark[] {
  const lines = hatchPolygon(outline, { angle: hatch.angle, gap: hatch.gap, inset, reverse });
  const cross = hatch.cross ? hatchPolygon(outline, { angle: hatch.angle + 90, gap: hatch.gap, inset, reverse }) : [];
  return [...lines, ...cross].map((s) => ({ d: s.d, color, width, opacity }));
}

/**
 * A pen: a set of strokes inked one after another between two points of the
 * scroll. `from` and `to` are where the drawing's centre sits on the screen
 * (1 is the bottom edge, 0.5 the middle) when this pen starts and lifts;
 * `spread` is how far the strokes are staggered (see scrollWindow).
 */
export interface Pen {
  marks: Mark[];
  from: number;
  to: number;
  spread?: number;
}

/** When each pen works, as the chart's centre rises up the screen. The last lifts at the middle. */
export const PHASE = {
  axes: { from: 1.15, to: 0.92 },
  fill: { from: 1.06, to: 0.7 },
  ink: { from: 0.8, to: 0.5 },
} as const;

/**
 * When a chart is inked: `scroll` ties it to the scroll, the last pen lifting
 * as the chart reaches the middle of the screen; `view` plays it once, over
 * `duration` ms, as it comes into view, each pen in the same order and overlap
 * it keeps on the scroll. Reduced motion shows it drawn either way.
 */
export type ChartTrigger = 'scroll' | 'view';

// The span of the scroll the pens share (where the chart's centre sits, 1.15 to 0.5), for timing them in `view`.
const SPAN = { from: 1.15, to: 0.5 };

/** The pens, layered in order in one box: each its own svg-scroll-draw drawing. */
export function PenLayers({ size, pens, trigger = 'scroll', duration = 1800 }: { size: { w: number; h: number }; pens: Pen[]; trigger?: ChartTrigger; duration?: number }) {
  const span = SPAN.from - SPAN.to;
  return h(
    Fragment,
    null,
    pens.filter((p) => p.marks.length).map((p, i) => {
      const spread = p.spread ?? 0;
      const stagger = staggerFor(p.marks.length, spread);
      // On arrival, each pen starts and lifts at the same share of `duration` as it does of the scroll.
      const timing =
        trigger === 'view'
          ? { autoplay: true, once: true, native: false, delay: Math.max(0, ((SPAN.from - p.from) / span) * duration), duration: (((p.from - p.to) / span) * duration) / (1 + spread) }
          : { trigger: scrollWindow(spread, { from: p.from, to: p.to }) };
      return h(
        ScrollDraw,
        {
          key: `${size.w}x${size.h}:${i}`,
          className: 'pointer-events-none absolute inset-0',
          'aria-hidden': true,
          easing: 'linear',
          progressVar: false,
          stagger,
          ...timing,
          children: h(
            'svg',
            { viewBox: `0 0 ${size.w} ${size.h}`, 'data-ink': trigger, className: 'block size-full overflow-visible', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' },
            p.marks.map((m, j) => h('path', { key: j, d: m.d, stroke: m.color, strokeWidth: m.width ?? 1, opacity: m.opacity })),
          ),
        },
      );
    }),
  );
}

/**
 * The box's size in CSS pixels, once it is in the page (null on the server
 * and the first render, so the server HTML carries no strokes). Later
 * changes, such as a phone turning, settle for a moment before redrawing.
 */
export function useSize<T extends HTMLElement>(): [RefObject<T | null>, { w: number; h: number } | null] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    const read = () => {
      const w = Math.round(el.clientWidth), hh = Math.round(el.clientHeight);
      if (w > 0 && hh > 0) setSize((s) => (s && s.w === w && s.h === hh ? s : { w, h: hh }));
    };
    read();
    const ro = new ResizeObserver(() => { clearTimeout(timer); timer = window.setTimeout(read, 120); });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(timer); };
  }, []);
  return [ref, size];
}

/** The width YLabels takes for these labels, to indent what sits under the plot by the same. */
export const gutter = (labels: string[]) => `${(Math.max(2, ...labels.map((l) => l.length)) * 1.15 + 1).toFixed(2)}ch`;

const LABEL = 'font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground';

/** Labels up the left of a plot, each centred on its fraction of the height (0 at the bottom). */
export function YLabels({ ticks }: { ticks: { label: string; at: number }[] }) {
  const width = Math.max(2, ...ticks.map((t) => t.label.length)) * 1.15 + 1;
  return h(
    'div',
    { 'data-slot': 'y-labels', className: `relative shrink-0 ${LABEL} tabular-nums`, style: { width: `${width}ch` } },
    ticks.map((t, i) => h('span', { key: i, className: 'absolute right-[1ch] -translate-y-1/2 whitespace-nowrap leading-none', style: { top: `${((1 - t.at) * 100).toFixed(2)}%` } }, t.label)),
  );
}

// Container widths (rem) at which a label may show, as whole class names so Tailwind finds them.
const TIERS: [number, string][] = [
  [20, 'hidden @xs:block'], [24, 'hidden @sm:block'], [28, 'hidden @md:block'], [32, 'hidden @lg:block'],
  [36, 'hidden @xl:block'], [42, 'hidden @2xl:block'], [48, 'hidden @3xl:block'], [56, 'hidden @4xl:block'], [64, 'hidden @5xl:block'],
];
const tier = (rem: number) => (rem <= 16 ? '' : (TIERS.find(([w]) => w >= rem) ?? TIERS[TIERS.length - 1])[1]);

/**
 * Labels along the bottom, each centred on its fraction of the width; the
 * ones at the very ends align inward so they stay inside. Where the chart is
 * too narrow for them all (a container query, so it holds in a card as on a
 * phone), every other one goes, then all but every fourth.
 */
export function XLabels({ ticks, offset }: { ticks: { label: string; at: number }[]; offset?: string }) {
  // The room they all need: about half a rem a character, with a gap of two.
  const need = ticks.length * (Math.max(...ticks.map((t) => t.label.length), 1) + 2) * 0.5;
  return h(
    'div',
    { 'data-slot': 'x-labels', className: `@container relative mt-2.5 h-4 ${LABEL} tabular-nums`, style: offset ? { marginLeft: offset } : undefined },
    ticks.map((t, i) =>
      h(
        'span',
        {
          key: i,
          className: `absolute top-0 whitespace-nowrap leading-none ${t.at < 0.02 ? '' : t.at > 0.98 ? '-translate-x-full' : '-translate-x-1/2'} ${tier(i % 4 === 0 ? need / 4 : i % 2 === 0 ? need / 2 : need)}`,
          style: { left: `${(t.at * 100).toFixed(2)}%` },
        },
        t.label,
      ),
    ),
  );
}

/** A key: a small swatch for each series, drawn as its strokes are, beside its label. */
export function Legend({ series, kind, className = '' }: { series: Series[]; kind: 'line' | 'hatch' | 'marker'; className?: string }) {
  return h(
    'ul',
    { 'data-slot': 'legend', className: `flex flex-wrap items-center gap-x-6 gap-y-2 ${LABEL} ${className}` },
    series.map((s) =>
      h(
        'li',
        { key: s.key, className: 'flex items-center gap-2' },
        h('svg', { viewBox: '0 0 18 12', className: 'h-3 w-[18px] shrink-0 overflow-visible', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, swatch(s, kind)),
        h('span', { className: 'text-foreground/80' }, s.label),
      ),
    ),
  );
}

function swatch(s: Series, kind: 'line' | 'hatch' | 'marker'): ReactNode {
  if (kind === 'hatch') {
    const box = rect(1, 1, 16, 10);
    return [
      ...hatchMarks(box, { ...s.hatch, gap: Math.max(2.4, s.hatch.gap * 0.55) }, { inset: 0.5, width: 0.8 }).map((m, i) => h('path', { key: i, d: m.d, strokeWidth: 0.8, opacity: 0.85 })),
      h('path', { key: 'o', d: toPath([...box, box[0]]), stroke: s.color, strokeWidth: 1.2 }),
    ];
  }
  if (kind === 'marker') return h('path', { d: marker(s.marker, 9, 6, 3.4), stroke: s.color, strokeWidth: 1.3 });
  return [h('path', { key: 'l', d: 'M1 6L17 6', stroke: s.color, strokeWidth: 1.6 }), h('path', { key: 'm', d: marker(s.marker, 9, 6, 2.6), stroke: s.color, strokeWidth: 1.2, fill: 'var(--background, white)' })];
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
