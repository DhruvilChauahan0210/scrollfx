/**
 * chart-core — the part of the scrollfx charts that belongs to no framework:
 * series from a config (as shadcn's chart takes one), nice ticks and scales,
 * curves, markers, hatching for bars, areas and wedges, the pens that ink a
 * chart in order as it scrolls in (the axes first, then the hatching, then the
 * lines in the accent colour, the last pen lifting exactly as the chart
 * reaches the middle of the screen), and the sums behind the labels and the
 * key. The React, Vue and Svelte charts all draw with it; each framework adds
 * only its own markup (lib/chart.ts for React, lib/chart-vue.ts for Vue,
 * $lib/chart-parts.svelte for Svelte).
 *
 * Part of scrollfx (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 */

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

/** A chart's size in CSS pixels, once it is in the page. */
export interface Size {
  w: number;
  h: number;
}

// The span of the scroll the pens share (where the chart's centre sits, 1.15 to 0.5), for timing them in `view`.
const SPAN = { from: 1.15, to: 0.5 };

/**
 * The svg-scroll-draw options for one pen: linear, its strokes staggered over
 * its spread, and either a scroll window or, with `view`, a delay and a
 * duration that start and lift it at the same share of `duration` as it does
 * of the scroll.
 */
export function penOptions(p: Pen, trigger: ChartTrigger = 'scroll', duration = 1800) {
  const span = SPAN.from - SPAN.to;
  const spread = p.spread ?? 0;
  const stagger = staggerFor(p.marks.length, spread);
  const timing =
    trigger === 'view'
      ? { autoplay: true, once: true, native: false, delay: Math.max(0, ((SPAN.from - p.from) / span) * duration), duration: (((p.from - p.to) / span) * duration) / (1 + spread) }
      : { trigger: scrollWindow(spread, { from: p.from, to: p.to }) };
  return { easing: 'linear' as const, progressVar: false, stagger, ...timing };
}

/** The pens worth drawing (a pen with no strokes is left out), each with a key that changes with the size, so a resize draws afresh. */
export const penLayers = (size: Size, pens: Pen[]) => pens.filter((p) => p.marks.length).map((p, i) => ({ pen: p, key: `${size.w}x${size.h}:${i}` }));

/**
 * Watches an element's size in CSS pixels: `set` is called at once (if it has
 * one) and again when it changes, later changes (a phone turning) settling for
 * a moment first. Returns the function that stops watching.
 */
export function watchSize(el: HTMLElement, set: (size: Size) => void): () => void {
  let timer = 0;
  let last: Size | null = null;
  const read = () => {
    const w = Math.round(el.clientWidth), hh = Math.round(el.clientHeight);
    if (w > 0 && hh > 0 && !(last && last.w === w && last.h === hh)) set((last = { w, h: hh }));
  };
  read();
  const ro = new ResizeObserver(() => { clearTimeout(timer); timer = window.setTimeout(read, 120); });
  ro.observe(el);
  return () => { ro.disconnect(); clearTimeout(timer); };
}

/** One label on an axis: its text and its fraction along the axis (0 at the bottom or the left). */
export interface Tick {
  label: string;
  at: number;
}

/** The look of every chart label. */
export const LABEL = 'font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground';

/** The width YLabels takes for these labels, to indent what sits under the plot by the same. */
export const gutter = (labels: string[]) => `${(Math.max(2, ...labels.map((l) => l.length)) * 1.15 + 1).toFixed(2)}ch`;

/** The width, in ch, of the labels up the left of a plot. */
export const yLabelsWidth = (ticks: Tick[]) => Math.max(2, ...ticks.map((t) => t.label.length)) * 1.15 + 1;

/** Where a label up the left sits: centred on its fraction of the height. */
export const yLabelTop = (t: Tick) => `${((1 - t.at) * 100).toFixed(2)}%`;

// Container widths (rem) at which a label may show, as whole class names so Tailwind finds them.
const TIERS: [number, string][] = [
  [20, 'hidden @xs:block'], [24, 'hidden @sm:block'], [28, 'hidden @md:block'], [32, 'hidden @lg:block'],
  [36, 'hidden @xl:block'], [42, 'hidden @2xl:block'], [48, 'hidden @3xl:block'], [56, 'hidden @4xl:block'], [64, 'hidden @5xl:block'],
];
const tier = (rem: number) => (rem <= 16 ? '' : (TIERS.find(([w]) => w >= rem) ?? TIERS[TIERS.length - 1])[1]);

/**
 * The labels along the bottom, each with its class and position: centred on
 * its fraction of the width, the ones at the very ends aligned inward so they
 * stay inside. Where the chart is too narrow for them all (a container query,
 * so it holds in a card as on a phone), every other one goes, then all but
 * every fourth.
 */
export function xLabels(ticks: Tick[]) {
  // The room they all need: about half a rem a character, with a gap of two.
  const need = ticks.length * (Math.max(...ticks.map((t) => t.label.length), 1) + 2) * 0.5;
  return ticks.map((t, i) => ({
    label: t.label,
    className: `absolute top-0 whitespace-nowrap leading-none ${t.at < 0.02 ? '' : t.at > 0.98 ? '-translate-x-full' : '-translate-x-1/2'} ${tier(i % 4 === 0 ? need / 4 : i % 2 === 0 ? need / 2 : need)}`,
    left: `${(t.at * 100).toFixed(2)}%`,
  }));
}

/** How a series' swatch in the key is drawn: as its line, its hatching, or its marker. */
export type LegendKind = 'line' | 'hatch' | 'marker';

/** One stroke of a swatch in the key (an 18 × 12 box). */
export interface SwatchStroke {
  d: string;
  stroke?: string;
  width: number;
  opacity?: number;
  fill?: string;
}

/** A series' swatch for the key, drawn as its strokes are. */
export function swatch(s: Series, kind: LegendKind): SwatchStroke[] {
  if (kind === 'hatch') {
    const box = rect(1, 1, 16, 10);
    return [
      ...hatchMarks(box, { ...s.hatch, gap: Math.max(2.4, s.hatch.gap * 0.55) }, { inset: 0.5, width: 0.8 }).map((m) => ({ d: m.d, width: 0.8, opacity: 0.85 })),
      { d: toPath([...box, box[0]]), stroke: s.color, width: 1.2 },
    ];
  }
  if (kind === 'marker') return [{ d: marker(s.marker, 9, 6, 3.4), stroke: s.color, width: 1.3 }];
  return [{ d: 'M1 6L17 6', stroke: s.color, width: 1.6 }, { d: marker(s.marker, 9, 6, 2.6), stroke: s.color, width: 1.2, fill: 'var(--background, white)' }];
}

/** Where a label round a circle sits (radar spoke names, pie shares): its fraction `r` of the box out from the centre, at `angle` clockwise from twelve. */
export function aroundLabel(angle: number, r: number, vertical = false) {
  const sx = Math.sin(angle), sy = -Math.cos(angle);
  const tx = sx > 0.3 ? '0%' : sx < -0.3 ? '-100%' : '-50%';
  const ty = vertical ? (sy < -0.6 ? '-100%' : sy > 0.6 ? '0%' : '-50%') : '-50%';
  return { left: `${(50 + sx * r * 100).toFixed(2)}%`, top: `${(50 + sy * r * 100).toFixed(2)}%`, translate: `${tx} ${ty}` };
}
