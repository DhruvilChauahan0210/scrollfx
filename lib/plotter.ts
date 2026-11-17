/**
 * plotter — line drawings the way a pen plotter makes them: flow fields,
 * contour maps, globes, tunnels, rosettes and hatching. Every generator is
 * seeded, so a seed gives the same drawing on every visit (engines may round
 * Math.sin differently and differ by a stroke or two), and returns plain SVG path
 * strings for svg-scroll-draw to ink in.
 *
 * Part of scrollfx (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 */

export interface Stroke {
  d: string;
  /** Which pen draws it: 0 is the ink, 1 the accent. */
  pen: 0 | 1;
}

type Pt = [number, number];

const f = (v: number) => v.toFixed(1);
const toPath = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');

/** A small, fast seeded random generator. */
export function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seed from any string, such as a version number. */
export function seedOf(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Classic 2D Perlin noise over a seeded permutation, about -0.7 to 0.7. */
export function noise2(seed: number) {
  const rand = random(seed);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = [...p, ...p];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h: number, x: number, y: number) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const a = perm[X] + Y;
    const b = perm[X + 1] + Y;
    const l1 = grad(perm[a], x, y) + u * (grad(perm[b], x - 1, y) - grad(perm[a], x, y));
    const l2 = grad(perm[a + 1], x, y - 1) + u * (grad(perm[b + 1], x - 1, y - 1) - grad(perm[a + 1], x, y - 1));
    return l1 + v * (l2 - l1);
  };
}

/**
 * A round flow field in a 1000 × 1000 box: evenly spaced streamlines that
 * never touch, ordered top to bottom as a plotter travels. The accent pen
 * takes the lines that pass through `accent` (a circle: x, y, radius).
 */
export function flowField({ seed = 417, spacing = 7, radius = 455, accent = [640, 610, 135] as [number, number, number] } = {}): Stroke[] {
  const rand = random(seed);
  const noise = noise2(seed);
  const C = 500;
  const step = 1.6;
  const test = spacing * 0.5;

  const angle = (x: number, y: number) => {
    const dx = x - C;
    const dy = y - C;
    const r = Math.hypot(dx, dy) / radius;
    // Noise for the drift, and a slow vortex round the centre for structure.
    const drift = noise(x * 0.0021, y * 0.0021) * Math.PI * 2.4;
    const swirl = Math.atan2(dy, dx) + Math.PI / 2;
    const w = 0.55 * (1 - r) * (1 - r);
    // Blend directions, not angles: angles wrap at ±π and leave a seam.
    return Math.atan2(Math.sin(drift) * (1 - w) + Math.sin(swirl) * w, Math.cos(drift) * (1 - w) + Math.cos(swirl) * w);
  };

  const cell = spacing;
  const cols = Math.ceil(1000 / cell);
  const grid = new Map<number, Pt[]>();
  const inside = (x: number, y: number) => Math.hypot(x - C, y - C) < radius;
  const free = (x: number, y: number, d: number) => {
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const pts = grid.get((cy + j) * cols + (cx + i));
        if (!pts) continue;
        for (const [px, py] of pts) if ((px - x) ** 2 + (py - y) ** 2 < d * d) return false;
      }
    }
    return true;
  };
  const trace = (sx: number, sy: number): Pt[] => {
    const half = (dir: 1 | -1) => {
      const out: Pt[] = [];
      let x = sx;
      let y = sy;
      for (let k = 0; k < 700; k++) {
        const a = angle(x, y);
        x += Math.cos(a) * step * dir;
        y += Math.sin(a) * step * dir;
        if (!inside(x, y) || !free(x, y, test)) break;
        out.push([x, y]);
      }
      return out;
    };
    return [...half(-1).reverse(), [sx, sy], ...half(1)];
  };

  const lines: { d: string; y: number; pen: 0 | 1 }[] = [];
  const queue: Pt[] = [[C, C]];
  const fallback: Pt[] = [];
  for (let y = C - radius; y < C + radius; y += spacing * 3) {
    for (let x = C - radius; x < C + radius; x += spacing * 3) fallback.push([x + rand() * spacing, y + rand() * spacing]);
  }
  for (let i = fallback.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [fallback[i], fallback[j]] = [fallback[j], fallback[i]];
  }

  while (queue.length || fallback.length) {
    const [sx, sy] = (queue.pop() ?? fallback.pop())!;
    if (!inside(sx, sy) || !free(sx, sy, spacing)) continue;
    const line = trace(sx, sy);
    if (line.length < 14) continue;
    for (const [x, y] of line) {
      const k = Math.floor(y / cell) * cols + Math.floor(x / cell);
      const bucket = grid.get(k);
      if (bucket) bucket.push([x, y]);
      else grid.set(k, [[x, y]]);
    }
    // New seeds one spacing away on either side, along the line.
    for (let i = 0; i < line.length; i += 6) {
      const [x, y] = line[i];
      const a = angle(x, y) + Math.PI / 2;
      queue.push([x + Math.cos(a) * spacing, y + Math.sin(a) * spacing]);
      queue.push([x - Math.cos(a) * spacing, y - Math.sin(a) * spacing]);
    }
    const [mx, my] = line[Math.floor(line.length / 2)];
    lines.push({
      d: toPath(line.filter((_, i) => i % 3 === 0 || i === line.length - 1)),
      y: Math.min(line[0][1], line[line.length - 1][1]),
      pen: Math.hypot(mx - accent[0], my - accent[1]) < accent[2] ? 1 : 0,
    });
  }
  return lines.sort((a, b) => a.y - b.y).map(({ d, pen }) => ({ d, pen }));
}

/**
 * A topographic map in a w × h box: the contour lines of a noisy island,
 * traced with marching squares and joined into whole lines. Every fifth
 * level is an index contour, drawn by the accent pen.
 */
export function contours({ seed = 7, w = 400, h = 300, levels = 18, cell = 5 } = {}): Stroke[] {
  const noise = noise2(seed);
  const nx = Math.ceil(w / cell) + 1;
  const ny = Math.ceil(h / cell) + 1;
  const v: number[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = i * cell;
      const y = j * cell;
      const dx = (x - w * 0.5) / (w * 0.5);
      const dy = (y - h * 0.5) / (h * 0.5);
      const fall = 1 - Math.min(1, Math.hypot(dx, dy * 0.95));
      const n = noise(x / 130, y / 130) + 0.5 * noise(x / 60 + 9, y / 60 + 9) + 0.25 * noise(x / 28 + 3, y / 28);
      v.push(fall * 1.1 + n * 0.55);
    }
  }
  const at = (i: number, j: number) => v[j * nx + i];
  const out: Stroke[] = [];
  for (let l = 1; l <= levels; l++) {
    const t = l / (levels + 1) * 1.2;
    // Segments for this level, then join them end to end.
    const segs: [Pt, Pt][] = [];
    const lerp = (a: number, b: number) => (t - a) / (b - a);
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
        const x = i * cell, y = j * cell;
        const e: Pt[] = [];
        if ((a < t) !== (b < t)) e.push([x + lerp(a, b) * cell, y]);
        if ((b < t) !== (c < t)) e.push([x + cell, y + lerp(b, c) * cell]);
        if ((d < t) !== (c < t)) e.push([x + lerp(d, c) * cell, y + cell]);
        if ((a < t) !== (d < t)) e.push([x, y + lerp(a, d) * cell]);
        if (e.length === 2) segs.push([e[0], e[1]]);
        else if (e.length === 4) { segs.push([e[0], e[1]]); segs.push([e[2], e[3]]); }
      }
    }
    const key = ([x, y]: Pt) => `${Math.round(x * 10)},${Math.round(y * 10)}`;
    const ends = new Map<string, number[]>();
    segs.forEach(([p, q], i) => {
      for (const k of [key(p), key(q)]) ends.set(k, [...(ends.get(k) ?? []), i]);
    });
    const used = new Set<number>();
    for (let s = 0; s < segs.length; s++) {
      if (used.has(s)) continue;
      used.add(s);
      const line: Pt[] = [segs[s][0], segs[s][1]];
      for (const forward of [true, false]) {
        for (;;) {
          const tip = forward ? line[line.length - 1] : line[0];
          const next = (ends.get(key(tip)) ?? []).find((i) => !used.has(i));
          if (next === undefined) break;
          used.add(next);
          const [p, q] = segs[next];
          const add = key(p) === key(tip) ? q : p;
          if (forward) line.push(add);
          else line.unshift(add);
        }
      }
      if (line.length > 6) out.push({ d: toPath(line), pen: l % 5 === 0 ? 1 : 0 });
    }
  }
  return out;
}

/** A wireframe globe in a w × h box: meridians and parallels, tilted, front half only. */
export function globe({ w = 400, h = 300, tilt = 0.4, turn = 0.35, step = 10 } = {}): Stroke[] {
  const R = Math.min(w, h) * 0.44;
  const cx = w / 2, cy = h / 2;
  const project = (lat: number, lon: number): [number, number, number] => {
    let x = Math.cos(lat) * Math.sin(lon + turn);
    let y = Math.sin(lat);
    let z = Math.cos(lat) * Math.cos(lon + turn);
    [y, z] = [y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)];
    return [cx + x * R, cy - y * R, z];
  };
  const out: Stroke[] = [];
  const trace = (fn: (t: number) => [number, number, number], n: number, pen: 0 | 1) => {
    let run: Pt[] = [];
    for (let k = 0; k <= n; k++) {
      const [x, y, z] = fn(k / n);
      if (z >= 0) run.push([x, y]);
      else if (run.length) { if (run.length > 2) out.push({ d: toPath(run), pen }); run = []; }
    }
    if (run.length > 2) out.push({ d: toPath(run), pen });
  };
  const rad = Math.PI / 180;
  for (let lon = 0; lon < 180; lon += step) {
    trace((t) => project((t * 360 - 180) * rad, lon * rad), 120, 0);
  }
  for (let lat = -80; lat <= 80; lat += step) {
    trace((t) => project(lat * rad, t * Math.PI * 2), 160, lat === 0 ? 1 : 0);
  }
  out.push({ d: toPath(Array.from({ length: 121 }, (_, k): Pt => [cx + R * Math.cos((k / 120) * Math.PI * 2), cy + R * Math.sin((k / 120) * Math.PI * 2)])), pen: 0 });
  return out;
}

/** A tunnel in a w × h box: nested squares, each smaller and turned a little. */
export function tunnel({ w = 400, h = 300, count = 34, shrink = 0.92, twist = 4 } = {}): Stroke[] {
  const out: Stroke[] = [];
  let s = Math.min(w, h) * 0.86;
  const cx = w / 2, cy = h / 2;
  for (let i = 0; i < count; i++) {
    const a = (i * twist * Math.PI) / 180;
    // Drift the centre a little, as if the tunnel bends away.
    const ox = cx + Math.sin(i * 0.12) * i * 0.9;
    const oy = cy - i * 0.7;
    const pts: Pt[] = [0, 1, 2, 3, 4].map((k) => {
      const t = a + Math.PI / 4 + (k * Math.PI) / 2;
      return [ox + (Math.cos(t) * s) / Math.SQRT2, oy + (Math.sin(t) * s) / Math.SQRT2];
    });
    out.push({ d: toPath(pts) + 'Z', pen: i === count - 1 ? 1 : 0 });
    s *= shrink;
  }
  return out;
}

/** A rosette (a hypotrochoid) in a size × size box, shaped by the seed. */
export function rosette(seed: number, size = 100): Stroke[] {
  const rand = random(seed);
  const R = 5 + Math.floor(rand() * 5);
  const r = 2 + Math.floor(rand() * (R - 2));
  const d = r * (0.6 + rand() * 0.9);
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const turns = r / gcd(R, r);
  const scale = (size * 0.46) / (R - r + d);
  const n = Math.round(turns * 140);
  const pts: Pt[] = [];
  for (let k = 0; k <= n; k++) {
    const t = (k / n) * turns * Math.PI * 2;
    pts.push([size / 2 + scale * ((R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t)), size / 2 + scale * ((R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t))]);
  }
  return [{ d: toPath(pts), pen: 0 }];
}

/** Diagonal hatching across a w × h box, one stroke per line, left to right. */
export function hatch({ w, h, gap = 4, angle = 60 }: { w: number; h: number; gap?: number; angle?: number }): Stroke[] {
  const out: Stroke[] = [];
  const run = h / Math.tan((angle * Math.PI) / 180);
  for (let x = -run; x < w; x += gap) {
    // Clip the line from (x, h) to (x + run, 0) to the box.
    let x0 = x, y0 = h, x1 = x + run, y1 = 0;
    if (x0 < 0) { y0 = h - ((0 - x0) / run) * h; x0 = 0; }
    if (x1 > w) { y1 = h - ((w - x) / run) * h; x1 = w; }
    if (y0 - y1 > 1) out.push({ d: `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, pen: 0 });
  }
  return out;
}

/** A smooth curve through points (Catmull-Rom as cubic Béziers). */
export function smooth(pts: Pt[]): string {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], e = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`;
  }
  return d;
}

/** A point on that curve's x, found by sampling (for hatching under it). */
export function curveY(pts: Pt[], x: number): number {
  // Piecewise cubic Hermite with Catmull-Rom tangents, the same curve as smooth().
  for (let i = 0; i < pts.length - 1; i++) {
    const b = pts[i], c = pts[i + 1];
    if (x < b[0] || x > c[0]) continue;
    const a = pts[Math.max(0, i - 1)], e = pts[Math.min(pts.length - 1, i + 2)];
    const p1: Pt = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const p2: Pt = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    // Solve the Bézier's x for t by bisection, then take its y.
    let lo = 0, hi = 1;
    const bx = (t: number) => (1 - t) ** 3 * b[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t * t * p2[0] + t ** 3 * c[0];
    for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (bx(m) < x) lo = m; else hi = m; }
    const t = (lo + hi) / 2;
    return (1 - t) ** 3 * b[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3 * c[1];
  }
  return pts[pts.length - 1][1];
}

/** A hand-drawn rectangle: the pen goes round twice, never quite on the same line. */
export function sketchRect({ w, h, seed = 1, wobble = 2.2, r = 18 }: { w: number; h: number; seed?: number; wobble?: number; r?: number }): Stroke[] {
  const rand = random(seed);
  const j = () => (rand() - 0.5) * wobble * 2;
  const pass = (o: number): string => {
    const k = r * 0.45;
    const p = [
      [r + j(), o + j()], [w - r + j(), o + j()],
      [w - o + j(), r + j()], [w - o + j(), h - r + j()],
      [w - r + j(), h - o + j()], [r + j(), h - o + j()],
      [o + j(), h - r + j()], [o + j(), r + j()],
    ].map(([x, y]) => [f(x), f(y)]);
    return `M${p[0][0]} ${p[0][1]}L${p[1][0]} ${p[1][1]}C${f(w - r + k)} ${f(o)} ${f(w - o)} ${f(r - k)} ${p[2][0]} ${p[2][1]}L${p[3][0]} ${p[3][1]}C${f(w - o)} ${f(h - r + k)} ${f(w - r + k)} ${f(h - o)} ${p[4][0]} ${p[4][1]}L${p[5][0]} ${p[5][1]}C${f(r - k)} ${f(h - o)} ${f(o)} ${f(h - r + k)} ${p[6][0]} ${p[6][1]}L${p[7][0]} ${p[7][1]}C${f(o)} ${f(r - k)} ${f(r - k)} ${f(o)} ${f(r + 6)} ${f(o + 1)}`;
  };
  return [{ d: pass(1), pen: 0 }, { d: pass(3), pen: 1 }];
}

/**
 * A harmonograph in a size × size box: the trace of two damped pendulums, one
 * long line that spirals in as the swing dies away. Shaped by the seed.
 */
export function harmonograph(seed: number, size = 1000): Stroke[] {
  const rand = random(seed);
  // Near-whole frequency ratios give the slow, braided precession plotters are known for.
  const f = [2 + rand() * 0.02, 3 + rand() * 0.02, 3 + rand() * 0.02, 2 + rand() * 0.02];
  const p = [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI, rand() * Math.PI];
  const damp = 0.0042 + rand() * 0.0015;
  const R = size * 0.23;
  const pts: Pt[] = [];
  // Fine steps keep the wide outer loops round; stopping once the swing is a
  // fifth of its start keeps the centre from filling in solid.
  for (let t = 0; ; t += 0.05) {
    const e = Math.exp(-damp * t);
    if (e < 0.2) break;
    pts.push([
      size / 2 + R * e * (Math.sin(f[0] * t + p[0]) + Math.sin(f[1] * t + p[1])),
      size / 2 + R * e * (Math.sin(f[2] * t + p[2]) + Math.sin(f[3] * t + p[3])),
    ]);
  }
  return [{ d: toPath(pts), pen: 0 }];
}

/**
 * A route through points, the way a pen wanders between them on a map: each
 * leg bows to one side by a seeded amount, so the line never runs straight.
 */
export function route(stops: Pt[], seed = 1, bow = 0.22): string {
  const rand = random(seed);
  let d = `M${f(stops[0][0])} ${f(stops[0][1])}`;
  for (let i = 0; i < stops.length - 1; i++) {
    const [ax, ay] = stops[i], [bx, by] = stops[i + 1];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    // A perpendicular nudge for each control point, opposite signs for an S.
    const nx = -dy / len, ny = dx / len;
    const k1 = (rand() * 0.6 + 0.4) * bow * len * (i % 2 ? 1 : -1);
    const k2 = (rand() * 0.6 + 0.4) * bow * len * (i % 2 ? -1 : 1);
    d += `C${f(ax + dx / 3 + nx * k1)} ${f(ay + dy / 3 + ny * k1)} ${f(ax + (2 * dx) / 3 + nx * k2)} ${f(ay + (2 * dy) / 3 + ny * k2)} ${f(bx)} ${f(by)}`;
  }
  return d;
}

/**
 * The scroll window for a drawing that should finish exactly as it reaches the
 * middle of the screen: not before (it played while nobody looked), not after
 * (it is still drawing up by the header).
 *
 * In svg-scroll-draw each path draws across the whole trigger, and `stagger`
 * starts each one later than the last, so the last path ends `spread` ranges
 * after `trigger.end` (spread = stagger × (paths − 1)). Measuring both ends
 * from the element's centre makes the range a fixed share of the screen at
 * any element height, so the end can be solved for:
 *
 *   start: centre at `from`        finish: centre at `to`
 *   end = (to + spread × from) / (1 + spread)
 *
 * Pass the same spread you give the drawing: `stagger = spread / (paths - 1)`.
 */
export function scrollWindow(spread = 0, { from = 1.15, to = 0.5 } = {}) {
  const end = (to + spread * from) / (1 + spread);
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  return { start: `center ${pct(from)}`, end: `center ${pct(end)}` };
}

/** The stagger that spreads `paths` over `spread` ranges (see scrollWindow). */
export const staggerFor = (paths: number, spread: number) => (paths > 1 ? spread / (paths - 1) : 0);

/**
 * A spiral medallion in a size × size box: one line wound from the rim inward,
 * its radius breathing a little as a hand-drawn spiral does. Shaped by the
 * seed, so a name always gets the same mark.
 */
export function spiral(seed: number, size = 100, { turns = 9, inner = 0.42 } = {}): Stroke[] {
  const noise = noise2(seed);
  const c = size / 2;
  const outer = size * 0.47;
  const steps = turns * 90;
  const pts: Pt[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const a = t * turns * Math.PI * 2 + (seed % 360) * (Math.PI / 180);
    const r = (outer - (outer - outer * inner) * t) * (1 + 0.045 * noise(Math.cos(a) * 1.3 + t * 4, Math.sin(a) * 1.3));
    pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r]);
  }
  return [{ d: toPath(pts), pen: 0 }];
}

/**
 * A Lissajous knot in a w × h box: one closed figure drawn four times, each a
 * little smaller, the way a plotter builds weight by repeating a line. The
 * seed picks one of four ratios; a quarter-turn phase closes each of them (at
 * other phases some retrace themselves into an open curve).
 */
export function lissajous(seed: number, w = 400, h = 400): Stroke[] {
  const shapes: [number, number, number][] = [[3, 2, Math.PI / 2], [5, 4, Math.PI / 2], [3, 4, Math.PI / 2], [5, 6, Math.PI / 2]];
  const [a, b, delta] = shapes[seed % shapes.length];
  const n = 1400;
  return [0, 1, 2, 3].map((k) => {
    const s = 0.44 * Math.pow(0.9, k);
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push([w / 2 + Math.sin(a * t + delta) * w * s, h / 2 + Math.sin(b * t) * h * s]);
    }
    return { d: toPath(pts), pen: k === 0 ? 1 : 0 } as Stroke;
  });
}

/**
 * Ridgelines in a w × h box: evenly spaced rows, flat at the edges and rising
 * toward the middle in peaks of their own, the nearer rows hiding the ones
 * behind, as a plotter draws a landscape with hidden lines removed. The accent
 * pen takes the nearest ridge. Strokes come back to front, as they are read.
 */
export function ridgelines({ seed = 9, w = 1200, h = 260, rows = 18, step = 5 } = {}): Stroke[] {
  const noise = noise2(seed);
  const rand = random(seed);
  const cols = Math.ceil(w / step) + 1;
  // Each row's own peaks: two or three bumps inside the middle half.
  const peaks = Array.from({ length: rows }, () =>
    Array.from({ length: 2 + Math.floor(rand() * 2) }, () => ({ at: w * (0.3 + rand() * 0.4), width: w * (0.04 + rand() * 0.07), height: 0.4 + rand() * 0.6 })),
  );
  const horizon = new Array<number>(cols).fill(Infinity);
  const out: Stroke[] = [];
  const amp = h * 0.34;
  // Front to back, keeping the highest point drawn so far in each column: a
  // ridge behind is drawn only where it rises above everything in front.
  for (let r = rows - 1; r >= 0; r--) {
    const base = h * 0.5 + (r / (rows - 1)) * h * 0.46;
    let run: Pt[] = [];
    const flush = () => { if (run.length > 1) out.push({ d: toPath(run), pen: r === rows - 1 ? 1 : 0 }); run = []; };
    for (let i = 0; i < cols; i++) {
      const x = i * step;
      const middle = Math.exp(-(((x - w / 2) / (w * 0.24)) ** 4));
      // The tallest bump, not their sum: overlapping bumps would add up past the box.
      const bumps = Math.max(...peaks[r].map((p) => p.height * Math.exp(-(((x - p.at) / p.width) ** 2))));
      const y = base - amp * middle * (bumps + 0.15 * (noise(x / 60, r * 0.8) + 0.5)) - 2.5 * noise(x / 25, r * 3.1);
      if (y < horizon[i] - 0.5) {
        run.push([x, y]);
        horizon[i] = y;
      } else flush();
    }
    flush();
  }
  return out.reverse();
}

/**
 * A fingerprint in a size × size box: open rings around a slightly off-centre
 * core, pushed about by noise as ridges are. The push is read from one field at
 * each point's place, so neighbouring rings bend together and never cross.
 * Shaped by the seed, so a name always gets the same print. Inside out.
 */
export function fingerprint(seed: number, size = 100, { rings = 13 } = {}): Stroke[] {
  const noise = noise2(seed);
  const rand = random(seed);
  const cx = size * (0.47 + rand() * 0.06);
  const cy = size * (0.45 + rand() * 0.08);
  const gap = (size * 0.43) / rings;
  const out: Stroke[] = [];
  for (let k = 1; k <= rings; k++) {
    const r = k * gap;
    // Each ridge breaks off somewhere, as real ones do; the outer ones more.
    const start = rand() * Math.PI * 2;
    const sweep = Math.PI * 2 * (k < 3 ? 0.97 : 0.78 + rand() * 0.18);
    const n = Math.max(24, Math.round(r * 2.4));
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const a = start + (i / n) * sweep;
      const x = cx + Math.cos(a) * r * 1.08;
      const y = cy + Math.sin(a) * r * 0.92;
      // Displace along the radius by the field at this place: under one gap, so no crossings.
      const push = gap * 0.85 * noise(x / (size * 0.22), y / (size * 0.22));
      pts.push([x + Math.cos(a) * push, y + Math.sin(a) * push]);
    }
    out.push({ d: toPath(pts), pen: 0 });
  }
  return out;
}

/**
 * A starburst in a size × size box: rays from a small ring outward, their
 * lengths rising and falling with noise round the circle, drawn clockwise from
 * the top as a plotter sweeps. Every `every`-th ray is the accent pen's.
 */
export function starburst(seed: number, size = 400, { rays = 144, every = 12 } = {}): Stroke[] {
  const noise = noise2(seed);
  const c = size / 2;
  const inner = size * 0.08;
  const outer = size * 0.48;
  const out: Stroke[] = [];
  for (let i = 0; i < rays; i++) {
    const a = -Math.PI / 2 + (i / rays) * Math.PI * 2;
    const swell = 0.5 + 0.5 * Math.min(1, Math.max(0, (noise(Math.cos(a) * 1.8, Math.sin(a) * 1.8) + 0.7) / 1.4));
    const len = inner + (outer - inner) * (i % every === 0 ? 1 : swell * 0.92);
    out.push({
      d: `M${f(c + Math.cos(a) * inner)} ${f(c + Math.sin(a) * inner)}L${f(c + Math.cos(a) * len)} ${f(c + Math.sin(a) * len)}`,
      pen: i % every === 0 ? 1 : 0,
    });
  }
  return out;
}

const ring = (cx: number, cy: number, r: number, n = 64, from = 0, to = Math.PI * 2): Pt[] =>
  Array.from({ length: n + 1 }, (_, k): Pt => {
    const a = from + ((to - from) * k) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

/**
 * A gauge in a size × size box, the way a plotter draws an instrument face:
 * ticks round three quarters of a circle, clockwise from the lower left, every
 * fifth one long; a band of three arcs in the accent pen out to `share` (0 to
 * 1) of the way round; and a needle pointing at it. The seed nudges each tick,
 * so no two faces are quite alike.
 */
export function gauge({ seed = 1, size = 100, share = 0.7, ticks = 41 }: { seed?: number; size?: number; share?: number; ticks?: number } = {}): Stroke[] {
  const rand = random(seed);
  const c = size / 2;
  const R = size * 0.46;
  const a0 = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  const s = Math.max(0, Math.min(1, share));
  const out: Stroke[] = [];
  for (let i = 0; i < ticks; i++) {
    const a = a0 + (sweep * i) / (ticks - 1) + (rand() - 0.5) * 0.012;
    const len = size * (i % 5 === 0 ? 0.12 : 0.06) * (0.92 + rand() * 0.16);
    out.push({ d: toPath([[c + Math.cos(a) * R, c + Math.sin(a) * R], [c + Math.cos(a) * (R - len), c + Math.sin(a) * (R - len)]]), pen: 0 });
  }
  if (s > 0) {
    for (const k of [0.7, 0.66, 0.62]) out.push({ d: toPath(ring(c, c, R * k, Math.max(4, Math.round(60 * s)), a0, a0 + sweep * s)), pen: 1 });
  }
  const an = a0 + sweep * s;
  out.push({ d: toPath([[c, c], [c + Math.cos(an) * R * 0.5, c + Math.sin(an) * R * 0.5]]), pen: 0 });
  out.push({ d: toPath(ring(c, c, size * 0.03, 16)), pen: 0 });
  return out;
}

/** The kinds of mark logoMark draws. */
export type MarkKind = 'rings' | 'disc' | 'delta' | 'wave' | 'grid' | 'burst';

/**
 * A simple generic mark in a size × size box, for a placeholder logo: rings,
 * a hatched disc, nested triangles, waves, a ruled square or a burst of rays.
 * The seed nudges every line a little, as a pen would.
 */
export function logoMark(kind: MarkKind, size = 40, seed = 1): Stroke[] {
  const rand = random(seed);
  const j = () => (rand() - 0.5) * size * 0.012;
  const c = size / 2;
  const R = size * 0.45;
  const line = (pts: Pt[]): Stroke => ({ d: toPath(pts.map(([x, y]): Pt => [x + j(), y + j()])), pen: 0 });
  switch (kind) {
    case 'rings':
      return [1, 0.74, 0.48, 0.22].map((k) => ({ d: toPath(ring(c, c, R * k, 48)), pen: 0 }));
    case 'disc': {
      const out: Stroke[] = [{ d: toPath(ring(c, c, R, 56)), pen: 0 }];
      // Hatching at 45°, clipped to the circle.
      const q = Math.SQRT1_2;
      for (let o = -R + size * 0.08; o < R; o += size * 0.08) {
        const h = Math.sqrt(R * R - o * o) * 0.94;
        out.push(line([[c + (o - h) * q, c + (o + h) * q], [c + (o + h) * q, c + (o - h) * q]]));
      }
      return out;
    }
    case 'delta':
      return [1, 0.66, 0.33].map((k) =>
        line([0, 1, 2, 3].map((i): Pt => {
          const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
          return [c + Math.cos(a) * R * k, c + size * 0.06 + Math.sin(a) * R * k];
        })),
      );
    case 'wave':
      return [0.3, 0.43, 0.56, 0.69].map((y) => line(Array.from({ length: 25 }, (_, i): Pt => [size * 0.08 + (i / 24) * size * 0.84, size * y + Math.sin((i / 24) * Math.PI * 3) * size * 0.08])));
    case 'grid': {
      const a = size * 0.1, b = size * 0.9;
      const out: Stroke[] = [line([[a, a], [b, a], [b, b], [a, b], [a, a]])];
      for (const t of [0.3, 0.5, 0.7]) {
        const p = a + (b - a) * t;
        out.push(line([[p, a], [p, b]]));
        out.push(line([[a, p], [b, p]]));
      }
      return out;
    }
    case 'burst':
      return Array.from({ length: 12 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 12;
        const r0 = R * 0.28, r1 = R * (i % 3 === 0 ? 1 : 0.72);
        return line([[c + Math.cos(a) * r0, c + Math.sin(a) * r0], [c + Math.cos(a) * r1, c + Math.sin(a) * r1]]);
      });
  }
}

/**
 * A rule a pen draws across a w × h box, twice, never quite on the same line:
 * the first pass in ink, the second in the accent pen.
 */
export function sketchLine({ w, h = 12, seed = 1, wobble = 1 }: { w: number; h?: number; seed?: number; wobble?: number }): Stroke[] {
  const rand = random(seed);
  const pass = (dy: number, pen: 0 | 1): Stroke => {
    const n = 16;
    return { d: toPath(Array.from({ length: n + 1 }, (_, i): Pt => [1 + ((w - 2) * i) / n, h / 2 + dy + (rand() - 0.5) * wobble * 2])), pen };
  };
  return [pass(-1.2, 0), pass(1.2, 1)];
}

/**
 * A moiré in a size × size box: two sets of concentric rings, their centres a
 * little apart, so where they cross the paper fills with interference
 * fringes. The rings are drawn from the middle outward, one from each set in
 * turn; the accent pen takes one ring of the second set.
 */
export function moire({ seed = 5, size = 400, rings = 18 }: { seed?: number; size?: number; rings?: number } = {}): Stroke[] {
  const rand = random(seed);
  const d = size * (0.05 + rand() * 0.03);
  const tilt = rand() * Math.PI * 2;
  const R = size * 0.4;
  const a: Pt = [size / 2 - Math.cos(tilt) * d, size / 2 - Math.sin(tilt) * d];
  const b: Pt = [size / 2 + Math.cos(tilt) * d, size / 2 + Math.sin(tilt) * d];
  const accent = Math.floor(rings * 0.7);
  const out: Stroke[] = [];
  for (let i = 1; i <= rings; i++) {
    const r = (R * i) / rings;
    const n = Math.max(24, Math.round(r * 0.9));
    out.push({ d: toPath(ring(a[0], a[1], r, n)), pen: 0 });
    out.push({ d: toPath(ring(b[0], b[1], r, n)), pen: i === accent ? 1 : 0 });
  }
  return out;
}

/**
 * Hatching inside any outline (or several, even-odd, so a ring leaves its hole
 * open): parallel strokes at `angle` degrees (0 runs across, 90 up the page),
 * `gap` apart, each kept `inset` clear of the outline so the line drawn round
 * it stands free. Lines sit on one grid across the page, so two shapes hatched
 * alike line up, and the pen sweeps left to right, turning at each end as a
 * plotter does (`reverse` sweeps back the other way).
 */
export function hatchPolygon(
  outline: [number, number][] | [number, number][][],
  { angle = 45, gap = 5, inset = 0, reverse = false }: { angle?: number; gap?: number; inset?: number; reverse?: boolean } = {},
): Stroke[] {
  const rings = (typeof outline[0][0] === 'number' ? [outline] : outline) as Pt[][];
  const a = (angle * Math.PI) / 180;
  // u runs along the strokes; n across them, pointed rightward so the sweep reads left to right.
  const u: Pt = [Math.cos(a), -Math.sin(a)];
  let n: Pt = [Math.sin(a), Math.cos(a)];
  if (n[0] < -1e-9 || (Math.abs(n[0]) < 1e-9 && n[1] < 0)) n = [-n[0], -n[1]];
  if (reverse) n = [-n[0], -n[1]];
  const dot = (p: Pt, v: Pt) => p[0] * v[0] + p[1] * v[1];
  const all = rings.flat();
  const s = all.map((p) => dot(p, n));
  const lo = Math.min(...s), hi = Math.max(...s);
  const out: Stroke[] = [];
  let flip = false;
  for (let c = Math.ceil(lo / gap) * gap; c <= hi; c += gap) {
    const ts: number[] = [];
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i++) {
        const p = ring[i], q = ring[(i + 1) % ring.length];
        const sp = dot(p, n), sq = dot(q, n);
        // Half-open, so a vertex on the line counts once.
        if ((sp <= c && sq > c) || (sq <= c && sp > c)) {
          const k = (c - sp) / (sq - sp);
          ts.push(dot(p, u) + k * (dot(q, u) - dot(p, u)));
        }
      }
    }
    ts.sort((x, y) => x - y);
    const runs: [number, number][] = [];
    for (let i = 0; i + 1 < ts.length; i += 2) {
      const t0 = ts[i] + inset, t1 = ts[i + 1] - inset;
      if (t1 - t0 > 0.8) runs.push([t0, t1]);
    }
    if (flip) runs.reverse();
    for (const [t0, t1] of runs) {
      const [ta, tb] = flip ? [t1, t0] : [t0, t1];
      out.push({ d: toPath([[c * n[0] + ta * u[0], c * n[1] + ta * u[1]], [c * n[0] + tb * u[0], c * n[1] + tb * u[1]]]), pen: 0 });
    }
    if (runs.length) flip = !flip;
  }
  return out;
}
