'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { scrollDraw } from 'svg-scroll-draw';
import 'svg-scroll-draw/no-flash.css';
import { scrollWindow, staggerFor } from '@/lib/plotter';
import type { Callout, Dimension } from '@/registry/sheets/types';

type Pt = [number, number];
type Box = { l: number; t: number; r: number; b: number; w: number; h: number };
type Stroke = { d: string; width: number; opacity?: number };
type Placed = { x: number; y: number; side: 'left' | 'right' | 'below' };

interface Geometry {
  w: number;
  h: number;
  wide: boolean;
  strokes: Stroke[];
  /** Where each callout's label sits (wide), by index; null if its anchor was not found. */
  labels: (Placed | null)[];
  /** Where each dimension's figure sits (wide). */
  dims: (Placed | null)[];
  /** Balloon centres for the callouts (narrow). */
  balloons: (Pt | null)[];
}

const f = (v: number) => v.toFixed(1);
const line = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
const ring = ([x, y]: Pt, r: number) => `M${f(x + r)} ${f(y)}A${r} ${r} 0 1 1 ${f(x - r)} ${f(y)}A${r} ${r} 0 1 1 ${f(x + r)} ${f(y)}`;

/** A slender drafting arrowhead with its tip on `tip`, pointing along from → tip. */
function head(from: Pt, tip: Pt, len = 7, half = 2): string {
  const dx = tip[0] - from[0], dy = tip[1] - from[1];
  const n = Math.hypot(dx, dy) || 1;
  const ux = dx / n, uy = dy / n;
  const bx = tip[0] - ux * len, by = tip[1] - uy * len;
  return line([[bx - uy * half, by + ux * half], tip, [bx + uy * half, by - ux * half], [bx - uy * half, by + ux * half]]);
}

/** Stack labels down one margin: each as near its anchor's height as it can be without touching the next. */
function stack(items: { i: number; want: number; h: number }[], height: number, gap = 10) {
  const sorted = [...items].sort((a, b) => a.want - b.want);
  const y = new Map<number, number>();
  let floor = 6;
  for (const it of sorted) {
    const c = Math.max(it.want, floor + it.h / 2);
    y.set(it.i, c);
    floor = c + it.h / 2 + gap;
  }
  let ceil = height - 6;
  for (const it of [...sorted].reverse()) {
    const c = Math.min(y.get(it.i)!, ceil - it.h / 2);
    y.set(it.i, Math.max(c, 6 + it.h / 2));
    ceil = c - it.h / 2 - gap;
  }
  return y;
}

/**
 * The drawing on a sheet, with its callouts: leaders from labels in the
 * margins to the parts each prop shapes, and dimensions for the sizes. The
 * labels are text in the server HTML; the leaders are measured to the drawing
 * in the browser and plotted by svg-scroll-draw just after the drawing, tied
 * to the scroll like it, or played once when the drawing is re-plotted. On a
 * phone the margins go: each callout becomes a numbered balloon by its part,
 * keyed in a list under the drawing.
 */
export function DrawingField({
  callouts,
  dimensions,
  mode,
  version,
  viewClass = '',
  children,
}: {
  callouts: Callout[];
  dimensions: Dimension[];
  mode: 'scroll' | 'view';
  /** Changes when the drawing does (a re-plot, another variant), to measure again. */
  version: string;
  viewClass?: string;
  children: ReactNode;
}) {
  const field = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const labelEls = useRef<(HTMLElement | null)[]>([]);
  const dimEls = useRef<(HTMLElement | null)[]>([]);
  const [geo, setGeo] = useState<Geometry | null>(null);

  useEffect(() => {
    const fieldEl = field.current, viewEl = view.current;
    if (!fieldEl || !viewEl) return;
    let raf = 0, last = '';
    const measure = () => {
      const fr = fieldEl.getBoundingClientRect();
      if (!fr.width) return;
      const rel = (r: DOMRect): Box => ({ l: r.left - fr.left, t: r.top - fr.top, r: r.right - fr.left, b: r.bottom - fr.top, w: r.width, h: r.height });
      const content = (viewEl.firstElementChild as HTMLElement | null) ?? viewEl;
      const c = rel(content.getBoundingClientRect());
      const boxOf = (sel?: string, line?: number) => {
        const el = sel ? viewEl.querySelector(sel) : content;
        if (!el) return null;
        const r = line === undefined ? el.getBoundingClientRect() : el.getClientRects()[line];
        return r ? rel(r) : null;
      };
      const w = Math.round(fr.width), h = Math.round(fr.height);
      const strokes: Stroke[] = [];
      const wide = parseFloat(getComputedStyle(fieldEl).paddingLeft) > 90;
      const anchors = callouts.map((co): Pt | null => {
        const at = !wide && co.phone ? co.phone : co;
        const b = boxOf(at.in ?? co.in, at.line ?? co.line);
        return b && b.w + b.h > 0 ? [b.l + at.at[0] * b.w, b.t + at.at[1] * b.h] : null;
      });
      const vias = callouts.map((co, i): Pt[] => {
        const a = anchors[i];
        if (!a || !co.via) return [];
        return co.via.flatMap((v) => {
          const b = boxOf(v.in, v.line);
          return b ? [[b.l + v.at[0] * b.w, v.at[1] === 'anchor' ? a[1] : b.t + v.at[1] * b.h] as Pt] : [];
        });
      });
      const dimBoxes = dimensions.map((d) => boxOf(d.in));
      const labels: (Placed | null)[] = callouts.map(() => null);
      const dims: (Placed | null)[] = dimensions.map(() => null);
      const balloons: (Pt | null)[] = callouts.map(() => null);
      const terminate = (from: Pt, tip: Pt, end: Callout['end']) =>
        strokes.push(end === 'dot' ? { d: ring(tip, 1.6), width: 1.4 } : { d: head(from, tip), width: 0.9 });

      if (wide) {
        // Dimensions first: a y dimension takes the inside of its margin, so labels sit beyond it.
        const taken = { left: 0, right: 0 };
        dimensions.forEach((d, k) => {
          const b = dimBoxes[k];
          if (!b) return;
          if (d.axis === 'y') {
            const side = d.side ?? 'right';
            const x = side === 'right' ? Math.max(c.r, b.r) + 18 : Math.min(c.l, b.l) - 18;
            const from = side === 'right' ? b.r + 4 : Math.min(c.l, b.l) - 4;
            const out = side === 'right' ? 4 : -4;
            strokes.push({ d: line([[from, b.t], [x + out, b.t]]), width: 0.6, opacity: 0.7 });
            strokes.push({ d: line([[from, b.b], [x + out, b.b]]), width: 0.6, opacity: 0.7 });
            strokes.push({ d: line([[x, b.t], [x, b.b]]), width: 0.8 });
            strokes.push({ d: line([[x - 3.5, b.t + 3.5], [x + 3.5, b.t - 3.5]]), width: 1.1 });
            strokes.push({ d: line([[x - 3.5, b.b + 3.5], [x + 3.5, b.b - 3.5]]), width: 1.1 });
            dims[k] = { x: side === 'right' ? x + 7 : x - 7, y: (b.t + b.b) / 2, side };
            taken[side] = 30;
          } else {
            const y = b.b + 16;
            strokes.push({ d: line([[b.l, b.b + 4], [b.l, y + 4]]), width: 0.6, opacity: 0.7 });
            strokes.push({ d: line([[b.r, b.b + 4], [b.r, y + 4]]), width: 0.6, opacity: 0.7 });
            strokes.push({ d: line([[b.l, y], [b.r, y]]), width: 0.8 });
            strokes.push({ d: line([[b.l - 3.5, y + 3.5], [b.l + 3.5, y - 3.5]]), width: 1.1 });
            strokes.push({ d: line([[b.r - 3.5, y + 3.5], [b.r + 3.5, y - 3.5]]), width: 1.1 });
            dims[k] = { x: (b.l + b.r) / 2, y: y + 5, side: 'below' };
          }
        });
        // Then the labels, stacked down each margin near their anchors' heights.
        for (const side of ['left', 'right'] as const) {
          const items = callouts.flatMap((co, i) => (co.side === side && anchors[i] ? [{ i, want: (vias[i][0] ?? anchors[i]!)[1], h: labelEls.current[i]?.offsetHeight || 16 }] : []));
          const ys = stack(items, h);
          const edge = side === 'left' ? c.l - 26 - taken.left : c.r + 26 + taken.right;
          for (const { i } of items) {
            const a = anchors[i]!, y = ys.get(i)!;
            const x = side === 'left' ? Math.max(edge, (labelEls.current[i]?.offsetWidth ?? 0) + 8) : Math.min(edge, w - (labelEls.current[i]?.offsetWidth ?? 0) - 8);
            labels[i] = { x, y, side };
            const s = side === 'left' ? 1 : -1;
            const p0: Pt = [x + s * 6, y], p1: Pt = [x + s * 16, y];
            const via = vias[i];
            const pts: Pt[] = via.length ? [p0, p1, ...via, a] : Math.abs(a[1] - y) < 1.5 || s * (a[0] - p1[0]) < 4 ? [p0, a] : [p0, p1, a];
            strokes.push({ d: line(pts), width: 0.75 });
            terminate(pts[pts.length - 2], a, callouts[i].end);
          }
        }
      } else {
        // Balloons: each by its part, but never on words. Every line of text in
        // the drawing is an obstacle; a balloon goes to the nearest place clear
        // of them and of the other balloons (the gutters either side of the
        // drawing included), preferring a leader that crosses no text.
        const texts: Box[] = [];
        const walker = document.createTreeWalker(viewEl, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (!n.textContent?.trim() || n.parentElement?.closest('.sr-only')) continue;
          range.selectNodeContents(n);
          for (const r of range.getClientRects()) if (r.width && r.height) texts.push(rel(r));
        }
        // Words drawn rather than set (a signature) count as words too.
        for (const el of viewEl.querySelectorAll('[role=img]')) texts.push(rel(el.getBoundingClientRect()));
        const r = 8.5, pad = 2;
        const hitsText = ([x, y]: Pt, rad: number) => texts.some((t) => x + rad > t.l - pad && x - rad < t.r + pad && y + rad > t.t - pad && y - rad < t.b + pad);
        const crossings = (a: Pt, b: Pt) => {
          const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
          const crossed = new Set<number>();
          for (let k = 2; k <= n; k++) {
            const x = a[0] + ((b[0] - a[0]) * k) / n, y = a[1] + ((b[1] - a[1]) * k) / n;
            texts.forEach((t, j) => { if (x > t.l && x < t.r && y > t.t && y < t.b && !(a[0] >= t.l && a[0] <= t.r && a[1] >= t.t && a[1] <= t.b)) crossed.add(j); });
          }
          return crossed.size;
        };
        const mid: Pt = [(c.l + c.r) / 2, (c.t + c.b) / 2];
        anchors.forEach((a, i) => {
          if (!a) return;
          const cands: Pt[] = [];
          for (const d of [26, 34, 44, 56, 70, 86, 104, 126]) for (let k = 0; k < 24; k++) cands.push([a[0] + Math.cos((k / 24) * Math.PI * 2) * d, a[1] + Math.sin((k / 24) * Math.PI * 2) * d]);
          for (let dy = -48; dy <= 48; dy += 12) cands.push([c.l / 2, a[1] + dy], [(c.r + w) / 2, a[1] + dy]);
          let best: Pt | null = null, score = Infinity;
          for (const b of cands) {
            if (b[0] < r + 2 || b[0] > w - r - 2 || b[1] < r + 2 || b[1] > h - r - 2) continue;
            if (hitsText(b, r) || balloons.some((o) => o && Math.hypot(o[0] - b[0], o[1] - b[1]) < r * 2 + 4)) continue;
            // Near is good; outward from the drawing's middle is better; across words is worst.
            const out = (b[0] - a[0]) * (a[0] - mid[0]) + (b[1] - a[1]) * (a[1] - mid[1]) > 0 ? 0 : 8;
            const sc = Math.hypot(b[0] - a[0], b[1] - a[1]) + out + crossings(a, b) * 80;
            if (sc < score) { score = sc; best = b; }
          }
          const b: Pt = best ?? [Math.min(w - r - 2, Math.max(r + 2, a[0] + 30)), Math.min(h - r - 2, Math.max(r + 2, a[1] - 30))];
          const ex = b[0] - a[0], ey = b[1] - a[1], en = Math.hypot(ex, ey) || 1;
          const edge: Pt = [b[0] - (ex / en) * r, b[1] - (ey / en) * r];
          strokes.push({ d: line([edge, a]), width: 0.75 });
          terminate(edge, a, callouts[i].end);
          strokes.push({ d: ring(b, r), width: 0.8 });
          balloons[i] = b;
        });
      }
      const next: Geometry = { w, h, wide, strokes, labels, dims, balloons };
      const key = JSON.stringify(next);
      if (key !== last) { last = key; setGeo(next); }
    };
    const soon = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    soon();
    const late = window.setTimeout(soon, 400);
    document.fonts?.ready.then(soon);
    const ro = new ResizeObserver(soon);
    ro.observe(fieldEl);
    ro.observe(viewEl);
    return () => { cancelAnimationFrame(raf); clearTimeout(late); ro.disconnect(); };
  }, [callouts, dimensions, version]);

  // Plot the leaders: just after the drawing, as it reaches the middle of the screen, or on arrival.
  const strokeKey = geo ? `${geo.w}x${geo.h}:${geo.strokes.length}:${geo.strokes[0]?.d ?? ''}:${version}:${mode}` : '';
  useEffect(() => {
    const el = svg.current;
    if (!el || !geo?.strokes.length) return;
    const spread = 1.5;
    const stagger = staggerFor(geo.strokes.length, spread);
    const draw =
      mode === 'view'
        ? scrollDraw(el, { selector: 'path', autoplay: true, once: true, delay: 1500, duration: 1000 / (1 + spread), stagger, easing: 'linear', native: false })
        : scrollDraw(el, { selector: 'path', stagger, easing: 'linear', trigger: scrollWindow(spread, { from: 0.56, to: 0.46 }), progressVar: false });
    return () => draw.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokeKey]);

  const label = (co: Callout | Dimension) => (
    <>
      <span className="text-foreground">{co.prop}</span>
      {co.note ? <span className="text-muted-foreground"> · {co.note}</span> : null}
    </>
  );

  return (
    <div>
      <div ref={field} className="relative px-8 pb-12 pt-10 sm:px-10 lg:px-[9.5rem] lg:pb-16 lg:pt-14">
        <div ref={view} className={`mx-auto ${viewClass}`}>{children}</div>

        {/* The leaders, dimensions and balloons: strokes only. */}
        {geo && geo.strokes.length > 0 && (
          <svg key={strokeKey} ref={svg} data-scroll-draw-pending="" data-ink={mode} aria-hidden width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} className="pointer-events-none absolute inset-0 overflow-visible" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            {geo.strokes.map((s, i) => <path key={i} d={s.d} strokeWidth={s.width} opacity={s.opacity} />)}
          </svg>
        )}

        {/* Labels in the margins (wide sheets), placed once the drawing is measured. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden font-mono text-[11px] leading-[1.35] lg:block">
          {callouts.map((co, i) => {
            const p = geo?.wide ? geo.labels[i] : null;
            return (
              <span
                key={i}
                ref={(el) => { labelEls.current[i] = el; }}
                className={`absolute max-w-[8.25rem] text-pretty transition-opacity duration-300 ${co.side === 'left' ? 'text-right' : 'text-left'} ${p ? 'opacity-100' : 'opacity-0'}`}
                style={p ? { top: p.y, ...(p.side === 'left' ? { right: `calc(100% - ${p.x}px)` } : { left: p.x }), translate: '0 -50%' } : { top: 0, left: 0 }}
              >
                {label(co)}
              </span>
            );
          })}
          {dimensions.map((d, k) => {
            const p = geo?.wide ? geo.dims[k] : null;
            const vertical = d.axis === 'y';
            return (
              <span
                key={k}
                ref={(el) => { dimEls.current[k] = el; }}
                className={`absolute whitespace-nowrap transition-opacity duration-300 ${p ? 'opacity-100' : 'opacity-0'}`}
                style={
                  p
                    ? vertical
                      ? { top: p.y, left: p.x, translate: p.side === 'left' ? '-100% -50%' : '0 -50%', writingMode: 'vertical-rl', rotate: '180deg' }
                      : { top: p.y, left: p.x, translate: '-50% 0' }
                    : { top: 0, left: 0 }
                }
              >
                {label(d)}
              </span>
            );
          })}
        </div>

        {/* Balloon numbers (narrow sheets). */}
        {geo && !geo.wide && (
          <div aria-hidden className="pointer-events-none absolute inset-0 font-mono text-[9.5px] lg:hidden">
            {geo.balloons.map((b, i) => (b ? <span key={i} className="absolute grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center leading-none" style={{ left: b[0], top: b[1] }}>{i + 1}</span> : null))}
          </div>
        )}
      </div>

      {/* The key: what each callout says, in order. Read out on every sheet; shown under the drawing on a phone. */}
      {callouts.length + dimensions.length > 0 && (
        <ol className="grid gap-x-6 gap-y-1.5 border-t border-[var(--hair)] px-4 py-4 font-mono text-[11px] sm:grid-cols-2 sm:px-8 lg:sr-only">
          {callouts.map((co, i) => (
            <li key={i} className="flex items-baseline gap-2.5">
              <span className="grid size-4 shrink-0 translate-y-[3px] place-items-center rounded-full border border-[var(--line)] text-[9px] leading-none">{i + 1}</span>
              <span>{label(co)}</span>
            </li>
          ))}
          {dimensions.map((d, k) => (
            <li key={`d${k}`} className="flex items-baseline gap-2.5">
              <span aria-hidden className="w-4 shrink-0 text-center text-muted-foreground">{d.axis === 'y' ? '↕' : '↔'}</span>
              <span>{label(d)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
