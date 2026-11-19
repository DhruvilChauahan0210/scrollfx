/**
 * ink-core — what the scrollfx ink components share, in no framework: ink(),
 * which hands an <svg> to svg-scroll-draw, either tied to the scroll
 * (finishing as it reaches the middle of the screen) or played once as it
 * comes into view; the strokes each component draws, from the sizes it
 * measures; and Hershey's script, a single-stroke handwriting font, for
 * ink-signature. The React, Vue and Svelte components all draw with it, so
 * they draw alike.
 *
 * ink() and sized() have the shape of a Svelte action (`use:ink={options}`);
 * lib/ink-vue.ts makes them Vue directives (v-ink, v-sized), and React's
 * useInk() (lib/ink.ts) calls ink() from an effect.
 *
 * Part of scrollfx (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: svg-scroll-draw, and lib/plotter (installed with it).
 */

import { scrollDraw } from 'svg-scroll-draw';
import {
  cropMarks,
  dial,
  gauge,
  hatch,
  inkBox,
  inkDots,
  inkLoop,
  inkStrike,
  inkUnderline,
  inkWave,
  paced,
  random,
  ruledLine,
  scrollWindow,
  sketchLine,
  sketchRect,
  staggerFor,
  type Line,
  type Point,
  type Stroke,
} from './plotter';

/**
 * When a drawing is made: `scroll` ties it to the scroll, the last stroke
 * landing as it reaches the middle of the screen; `view` plays it once, over
 * `duration` ms, when it comes into view. Reduced motion shows it drawn.
 */
export type InkTrigger = 'scroll' | 'view';

export interface InkOptions {
  /** How many paths the svg holds; the drawing waits until there are some. */
  paths: number;
  /** The strokes start one after another over this many ranges (see scrollWindow): 0 all at once, 1 spread over the drawing, paths − 1 strictly in turn. */
  spread?: number;
  trigger?: InkTrigger;
  /** With `view`, the whole drawing's length in ms. */
  duration?: number;
  /** Anything that changes when the strokes do, so the drawing starts again with them. */
  version?: unknown;
}

function start(svg: SVGSVGElement, { paths, spread = 0, trigger = 'scroll', duration = 1200 }: InkOptions) {
  if (!paths) return null;
  const stagger = staggerFor(paths, spread);
  return trigger === 'view'
    ? scrollDraw(svg, { selector: 'path', autoplay: true, once: true, duration: duration / (1 + spread), stagger, easing: 'linear', native: false })
    : scrollDraw(svg, { selector: 'path', stagger, easing: 'linear', trigger: scrollWindow(spread), progressVar: false });
}

const same = (a: InkOptions, b: InkOptions) =>
  a.paths === b.paths && (a.spread ?? 0) === (b.spread ?? 0) && (a.trigger ?? 'scroll') === (b.trigger ?? 'scroll') && (a.duration ?? 1200) === (b.duration ?? 1200) && Object.is(a.version, b.version);

/**
 * Hand `svg` to svg-scroll-draw, and start again when the options change.
 * Give the svg `data-scroll-draw-pending` (with svg-scroll-draw/no-flash.css
 * imported) and remount it when its strokes change, so new strokes never show
 * whole for a frame before the engine sets them.
 */
export function ink(svg: SVGSVGElement, options: InkOptions) {
  let last = options;
  let engine = start(svg, options);
  return {
    update(next: InkOptions) {
      if (same(last, next)) return;
      engine?.destroy();
      last = next;
      engine = start(svg, next);
    },
    destroy() {
      engine?.destroy();
      engine = null;
    },
  };
}

/** An element's size in whole px, now and whenever it changes: `onSize` is called with each new size. Shaped as a Svelte action. */
export function sized(el: HTMLElement, onSize: (size: { w: number; h: number }) => void) {
  let cb = onSize;
  let last: { w: number; h: number } | null = null;
  const measure = () => {
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (last && last.w === w && last.h === h) return;
    cb((last = { w, h }));
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(el);
  return {
    update(next: (size: { w: number; h: number }) => void) { cb = next; },
    destroy() { ro.disconnect(); },
  };
}

/** A stroke moved `by` px right and down (its numbers are x y pairs). */
export const shiftStroke = (k: Stroke, by: number): Stroke => ({ ...k, d: k.d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => `${(+x + by).toFixed(1)} ${(+y + by).toFixed(1)}`) });

// ── ink-highlight ───────────────────────────────────────────────────────────

export type InkHighlightVariant = 'underline' | 'double-underline' | 'circle' | 'box' | 'strike' | 'hatch-fill';

/** One mark: where its box sits, from the highlight's own origin, in px, and its strokes. */
export interface InkMark {
  x: number;
  y: number;
  w: number;
  h: number;
  strokes: Stroke[];
}

export type InkRect = { x: number; y: number; w: number; h: number };

/** One mark per line the words take, sized to that line's box. */
export function highlightMark(variant: InkHighlightVariant, r: InkRect, seed: number): InkMark {
  const { x, y, w, h } = r;
  switch (variant) {
    case 'underline': {
      const box = { x: x - 3, y: y + h * 0.84, w: w + 6, h: 12 };
      return { ...box, strokes: inkUnderline({ w: box.w, h: box.h, seed }) };
    }
    case 'double-underline': {
      const box = { x: x - 3, y: y + h * 0.82, w: w + 6, h: 16 };
      return { ...box, strokes: inkUnderline({ w: box.w, h: box.h, seed, double: true }) };
    }
    case 'circle': {
      // An ellipse wide enough to hold the words' corners, or nearly.
      const px = 3 + h * 0.12, py = h * 0.4;
      const box = { x: x - px, y: y - py, w: w + px * 2, h: h + py * 2 };
      return { ...box, strokes: inkLoop({ w: box.w, h: box.h, seed }) };
    }
    case 'box': {
      // inkBox draws 4 px in from its box's edge: 5 px clear of the words left and right, 1 px above and below.
      const px = 9, py = 5;
      const box = { x: x - px, y: y - py, w: w + px * 2, h: h + py * 2 };
      return { ...box, strokes: inkBox({ w: box.w, h: box.h, seed }) };
    }
    case 'strike': {
      const box = { x: x - 3, y, w: w + 6, h };
      return { ...box, strokes: inkStrike({ w: box.w, h: box.h, seed }) };
    }
    case 'hatch-fill': {
      // Behind the lower part of the letters, as a highlighter pen sits.
      const box = { x: x - 5, y: y + h * 0.32, w: w + 10, h: Math.round(h * 0.6) };
      return { ...box, strokes: hatch({ w: box.w, h: box.h, gap: 5, angle: 62 }) };
    }
  }
}

/** Hatching sweeps left to right; a box's sides and a double underline's strokes follow one another. */
export const highlightSpread = (variant: InkHighlightVariant, n: number) => (variant === 'hatch-fill' ? 1 : variant === 'box' ? n - 1 : n > 1 ? 0.6 : 0);

/**
 * The boxes of the lines `el`'s words take, from `origin`: an empty box at
 * left 0, top 0 of the highlight's own containing block, wherever a browser
 * puts that for words broken over lines, so the marks land where they are
 * measured.
 */
export function measureLines(el: HTMLElement, origin: HTMLElement): InkRect[] {
  const at = origin.getBoundingClientRect();
  return [...el.getClientRects()]
    .filter((r) => r.width > 1 && r.height > 1)
    .map((r) => ({ x: Math.round(r.left - at.left), y: Math.round(r.top - at.top), w: Math.round(r.width), h: Math.round(r.height) }));
}

/** The block the words reflow in: they move when it changes width. */
export function blockOf(el: HTMLElement): HTMLElement {
  let block: HTMLElement | null = el.parentElement;
  while (block && getComputedStyle(block).display.startsWith('inline')) block = block.parentElement;
  return block ?? document.body;
}

// ── ink-divider ─────────────────────────────────────────────────────────────

export type InkDividerVariant = 'straight' | 'wavy' | 'sketchy' | 'dotted' | 'with-label';

/** A rule's height, in px. */
export const DIVIDER_H = 16;

export function dividerStrokes(variant: Exclude<InkDividerVariant, 'with-label'>, w: number, seed: number): Stroke[] {
  switch (variant) {
    case 'straight': return ruledLine({ w, h: DIVIDER_H, seed });
    case 'wavy': return inkWave({ w, h: DIVIDER_H, seed, period: 34 });
    case 'sketchy': return sketchLine({ w, h: DIVIDER_H, seed, wobble: 0.8 });
    case 'dotted': return inkDots({ w, h: DIVIDER_H, seed, gap: 8 });
  }
}

/** Dots go down one after another, left to right; the sketchy rule's second pass follows the first. */
export const dividerSpread = (variant: InkDividerVariant, n: number) => (variant === 'dotted' ? 1 : variant === 'sketchy' ? 0.5 : 0) * (n > 1 ? 1 : 0);

/** The two rules beside a label, drawn outward from it: the left one right to left. */
export const dividerLabelRule = (side: 'left' | 'right', w: number, seed: number) =>
  side === 'left' ? ruledLine({ w, h: DIVIDER_H, seed, reverse: true }) : ruledLine({ w, h: DIVIDER_H, seed: seed + 3 });

// ── ink-frame ───────────────────────────────────────────────────────────────

export type InkFrameVariant = 'rect' | 'rounded' | 'double' | 'corner-marks';

/** How far the drawing reaches past the box on each side, so strokes on its edge are not cut. */
export const FRAME_BLEED = 10;

/** A frame's stroke, drawn in its own box moved `at` px in from the drawing's corner. */
export type FrameStroke = Stroke & { at: number };

export function frameStrokes(variant: InkFrameVariant, w: number, h: number, seed: number): FrameStroke[] {
  const place = (s: Stroke[], at: number) => s.map((k) => ({ ...k, at }));
  const BLEED = FRAME_BLEED;
  switch (variant) {
    case 'rect':
      return place(sketchRect({ w: w + 4, h: h + 4, seed, wobble: 1.3, r: 3 }), BLEED - 2);
    case 'rounded':
      return place(sketchRect({ w: w + 4, h: h + 4, seed, wobble: 1.3, r: 16 }), BLEED - 2);
    case 'double':
      return [
        ...place(sketchRect({ w: w + 4, h: h + 4, seed, wobble: 1.2, r: 3 }).slice(0, 1), BLEED - 2),
        ...place(sketchRect({ w: w - 10, h: h - 10, seed: seed + 5, wobble: 0.9, r: 2 }).slice(0, 1).map((k) => ({ ...k, pen: 1 as const })), BLEED + 5),
      ];
    case 'corner-marks':
      return place(cropMarks({ w: w + 2 * BLEED, h: h + 2 * BLEED, seed, len: Math.min(22, Math.max(10, Math.min(w, h) * 0.08)), inset: 2 }), 0);
  }
}

// ── ink-progress ────────────────────────────────────────────────────────────

export type InkProgressVariant = 'bar' | 'ring' | 'gauge';

/** The bar's height, in px; its scale hangs 12 px below it. */
export const BAR_H = 18;

/** The bar's strokes: its outline, a scale under it, the hatching out to the value, and a mark at the value. */
export function barStrokes(w: number, share: number, seed: number): Stroke[] {
  const out: Stroke[] = [sketchRect({ w, h: BAR_H, seed, wobble: 0.7, r: 2 })[0]];
  for (let i = 0; i <= 10; i++) {
    const x = 1 + ((w - 2) * i) / 10;
    out.push({ d: `M${x.toFixed(1)} ${BAR_H + 5}L${x.toFixed(1)} ${BAR_H + (i % 5 === 0 ? 11 : 8)}`, pen: 0 });
  }
  const fill = Math.max(0, (w - 6) * share);
  if (fill > 1) {
    // hatch() draws from the box's corner; each of its strokes is `Mx yLx y`, moved in 3 px here.
    for (const h of hatch({ w: fill, h: BAR_H - 6, gap: 3.4, angle: 58 })) out.push({ d: shiftStroke(h, 3).d, pen: 1 });
  }
  const x = 3 + fill;
  out.push({ d: `M${x.toFixed(1)} -4L${(x + 0.4).toFixed(1)} ${BAR_H + 4}`, pen: 0 });
  return out;
}

/** A ring's or gauge's strokes, in a 100 × 100 box. */
export const roundStrokes = (variant: 'ring' | 'gauge', seed: number, share: number): Stroke[] =>
  variant === 'ring' ? dial({ size: 100, seed, share }) : gauge({ seed, size: 100, share });

/** The figure an ink-progress shows: a percentage of max (with `%` unless a suffix is given), or the value itself. */
export function progressFigure({ value, max, display = 'percent', prefix = '', suffix, decimals = 0 }: { value: number; max: number; display?: 'percent' | 'value'; prefix?: string; suffix?: string; decimals?: number }) {
  return display === 'percent'
    ? { value: (value / max) * 100, prefix, suffix: suffix ?? '%', decimals }
    : { value, prefix, suffix: suffix ?? '', decimals };
}

// ── ink-stamp ───────────────────────────────────────────────────────────────

export type InkStampVariant = 'circle' | 'rectangle' | 'seal';

/** A rectangle stamp's frame: ruled twice round the edge, then once more, finer, inside. */
export const stampFrame = (w: number, h: number, seed: number): Stroke[] => [
  ...sketchRect({ w, h, seed, wobble: 1, r: 3 }),
  shiftStroke(sketchRect({ w: w - 10, h: h - 10, seed: seed + 3, wobble: 0.7, r: 2 })[0], 5),
];

/**
 * A round stamp's type: the circle its rim's text runs round (in the band
 * between the outer rings and the inner one), the rim's size, and the words'
 * size, set to fit inside the inner ring by their longest word (`words`, when
 * they are plain text; 6 letters otherwise).
 */
export function stampLayout(variant: 'circle' | 'seal', size: number, words?: string) {
  const r = size * (variant === 'seal' ? 0.36 : 0.38);
  const rimFont = Math.max(7, size * (variant === 'seal' ? 0.056 : 0.066));
  // A monospaced letter here is about 0.8 em wide with its tracking.
  const longest = typeof words === 'string' ? Math.max(...words.split(/\s+/).map((w) => w.length)) : 6;
  const wordFont = Math.max(9, Math.min(size * 0.1, (size * 0.48) / (longest * 0.8)));
  const circle = `M${size / 2 - r} ${size / 2}a${r} ${r} 0 1 1 ${r * 2} 0a${r} ${r} 0 1 1 ${-r * 2} 0`;
  return { r, rimFont, wordFont, circle, rimLength: Math.PI * 2 * r - size * 0.04 };
}

// ── ink-signature ───────────────────────────────────────────────────────────

/** A swash under the writing: in from below the first letters, a long shallow curve, and a lift at the end. */
export function swash(w: number, baseline: number, size: number, seed: number): Point[] {
  const rand = random(seed);
  const x0 = w * (0.04 + rand() * 0.06), x1 = w * (0.97 + rand() * 0.02);
  const y = baseline + size * 0.16;
  const sag = size * (0.07 + rand() * 0.05);
  const pts: Point[] = [];
  const n = Math.max(30, Math.round((x1 - x0) / 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // Down into the stroke, a long sag, then up and away at the end.
    pts.push([x0 + (x1 - x0) * t, y + sag * Math.sin(Math.PI * t * 0.92) - size * 0.12 * t ** 6 + (1 - t) ** 8 * -size * 0.06]);
  }
  return pts;
}

/** A signature's layout: the writing and the box it is drawn in ("0 0 w h"), the flourish's room included. */
export function signatureLayout({ name, size, slant, strokeWidth, flourish, paths, viewBox }: { name: string; size: number; slant: number; strokeWidth: number; flourish: boolean; paths?: string[]; viewBox?: string }) {
  const laid = script(name, { size, slant, pad: Math.ceil(strokeWidth * 2) });
  const extra = flourish && !paths ? Math.round(size * 0.32) : 0;
  const box = paths ? viewBox ?? '0 0 300 120' : `0 0 ${laid.w} ${laid.h + extra}`;
  const [, , w, h] = box.split(/[\s,]+/).map(Number);
  return { laid, box, w, h };
}

/** A signature's strokes: your own paths, one beat each; or the name in even pieces, one after another, as a pen writes at one speed, then the flourish. */
export function signatureStrokes({ laid, flourish, size, seed, paths }: { laid: ReturnType<typeof script>; flourish: boolean; size: number; seed: number; paths?: string[] }): Stroke[] {
  if (paths) return paths.map((d) => ({ d, pen: 0 }));
  const lines: Line[] = laid.lines.map((pts) => ({ pts, pen: 0 }));
  if (flourish) lines.push({ pts: swash(laid.w, laid.baseline, size, seed), pen: 1 });
  return paced(lines, Math.max(4, size / 9));
}

// ── Hershey's script ────────────────────────────────────────────────────────

/*
 * Hershey's script simplex, ASCII 32–126, from the hershey-fonts package by
 * Kamal Mostafa (https://github.com/kamalmostafa/hershey-fonts, cursive.jhf).
 * The Hershey fonts are in the public domain, with these acknowledgements to
 * go with the data:
 *
 *   - The Hershey Fonts were originally created by Dr. A. V. Hershey while
 *     working at the U. S. National Bureau of Standards.
 *   - The format of the Font data in this distribution was originally created
 *     by James Hurt, Cognition, Inc., 900 Technology Park Drive, Billerica,
 *     MA 01821 (mit-eddie!ci-dandelion!hurt).
 *
 * Each string is one glyph: two characters for its left and right edges, then
 * the pen's points as pairs, each coordinate its char code minus 82 ('R'), x
 * right and y down, the baseline at y = 9. " R" lifts the pen.
 */
const SCRIPT: readonly string[] = [
  "JZ", // space
  "MWRFRT RRYQZR[SZRY", // !
  "JZNFNM RVFVM", // "
  "H]SBLb RYBRb RLOZO RKUYU", // #
  "H\\PBP_ RTBT_ RYIWGTFPFMGKIKKLMMNOOUQWRXSYUYXWZT[P[MZKX", // $
  "F^[FI[ RNFPHPJOLMMKMIKIIJGLFNFPGSHVHYG[F RWTUUTWTYV[X[ZZ[X[VYTWT", // %
  "E_\\O\\N[MZMYNXPVUTXRZP[L[JZIYHWHUISJRQNRMSKSIRGPFNGMIMKNNPQUXWZY[[[\\Z\\Y", // &
  "PTRMRQ", // '
  "KYVBTDRGPKOPOTPYR]T`Vb", // (
  "KYNBPDRGTKUPUTTYR]P`Nb", // )
  "JZRLRX RMOWU RWOMU", // *
  "E_RIR[ RIR[R", // +
  "NVSWRXQWRVSWSYQ[", // ,
  "E_IR[R", // -
  "NVRVQWRXSWRV", // .
  "G][BIb", // /
  "H\\QFNGLJKOKRLWNZQ[S[VZXWYRYOXJVGSFQF", // 0
  "H\\NJPISFS[", // 1
  "H\\LKLJMHNGPFTFVGWHXJXLWNUQK[Y[", // 2
  "H\\MFXFRNUNWOXPYSYUXXVZS[P[MZLYKW", // 3
  "H\\UFKTZT RUFU[", // 4
  "H\\WFMFLOMNPMSMVNXPYSYUXXVZS[P[MZLYKW", // 5
  "H\\XIWGTFRFOGMJLOLTMXOZR[S[VZXXYUYTXQVOSNRNOOMQLT", // 6
  "H\\YFO[ RKFYF", // 7
  "H\\PFMGLILKMMONSOVPXRYTYWXYWZT[P[MZLYKWKTLRNPQOUNWMXKXIWGTFPF", // 8
  "H\\XMWPURRSQSNRLPKMKLLINGQFRFUGWIXMXRWWUZR[P[MZLX", // 9
  "NVROQPRQSPRO RRVQWRXSWRV", // :
  "NVROQPRQSPRO RSWRXQWRVSWSYQ[", // ;
  "F^ZIJRZ[", // <
  "E_IO[O RIU[U", // =
  "F^JIZRJ[", // >
  "I[LKLJMHNGPFTFVGWHXJXLWNVORQRT RRYQZR[SZRY", // ?
  "E`WNVLTKQKOLNMMPMSNUPVSVUUVS RWKVSVUXVZV\\T]Q]O\\L[JYHWGTFQFNGLHJJILHOHRIUJWLYNZQ[T[WZYYZX", // @
  "G[G[IZLWOSSLVFV[UXSUQSNQLQKRKTLVNXQZT[Y[", // A
  "F]SHTITLSPRSQUOXMZK[J[IZIWJRKOLMNJPHRGUFXFZG[I[KZMYNWOTP RSPTPWQXRYTYWXYWZU[R[PZOX", // B
  "H\\TLTMUNWNYMZKZIYGWFTFQGOIMLLNKRKVLYMZO[Q[TZVXWV", // C
  "G^TFRGQIPMOSNVMXKZI[G[FZFXGWIWKXMZP[S[VZXXZT[O[KZHYGWFTFRHRJSMUPWRZT\\U", // D
  "H\\VJVKWLYLZKZIYGVFRFOGNINLONPOSPPPMQLRKTKWLYMZP[S[VZXXYV", // E
  "H\\RLPLNKMINGQFTFXG[G]F RXGVNTTRXPZN[L[JZIXIVJULUNV RQPZP", // F
  "G^G[IZMVPQQNRJRGQFPFOGNINLONQOUOXNYMZKZQYVXXVZS[O[LZJXIVIT", // G
  "F^MMKLJJJIKGMFNFPGQIQKPONULYJ[H[GZGX RMRVOXN[L]J^H^G]F\\FZHXLVRUWUZV[W[YZZY\\V", // H
  "IZWVUTSQROQLQIRGSFUFVGWIWLVQTVSXQZO[M[KZJXJVKUMUOV", // I
  "JYT^R[PVOPOJPGRFTFUGVJVMURR[PaOdNfLgKfKdLaN^P\\SZWX", // J
  "F^MMKLJJJIKGMFNFPGQIQKPONULYJ[H[GZGX R^I^G]F\\FZGXIVLTNROPO RROSQSXTZU[V[XZYY[V", // K
  "I\\MRORSQVOXMYKYHXFVFUGTISNRSQVPXNZL[J[IZIXJWLWNXQZT[V[YZ[X", // L
  "@aEMCLBJBICGEFFFHGIIIKHPGTE[ RGTJLLHMGOFPFRGSISKRPQTO[ RQTTLVHWGYFZF\\G]I]K\\PZWZZ[[\\[^Z_YaV", // M
  "E]JMHLGJGIHGJFKFMGNINKMPLTJ[ RLTOLQHRGTFVFXGYIYKXPVWVZW[X[ZZ[Y]V", // N
  "H]TFQGOIMLLNKRKVLYMZO[Q[TZVXXUYSZOZKYHXGVFTFRHRKSNUQWSZU\\V", // O
  "F_SHTITLSPRSQUOXMZK[J[IZIWJRKOLMNJPHRGUFZF\\G]H^J^M]O\\PZQWQUPTO", // P
  "H^ULTNSOQPOPNNNLOIQGTFWFYGZIZMYPWSSWPYNZK[I[HZHXIWKWMXPZS[V[YZ[X", // Q
  "F_SHTITLSPRSQUOXMZK[J[IZIWJRKOLMNJPHRGUFYF[G\\H]J]M\\O[PYQVQSPTQUSUXVZX[ZZ[Y]V", // R
  "H\\H[JZLXOTQQSMTJTGSFRFQGPIPKQMSOVQXSYUYWXYWZT[P[MZKXJVJT", // S
  "H[RLPLNKMINGQFTFXG[G]F RXGVNTTRXPZN[L[JZIXIVJULUNV", // T
  "E]JMHLGJGIHGJFKFMGNINKMOLRKVKXLZN[P[RZSYUUXMZF RXMWQVWVZW[X[ZZ[Y]V", // U
  "F]KMILHJHIIGKFLFNGOIOKNOMRLVLYM[O[QZTWVTXPYMZIZGYFXFWGVIVKWNYP[Q", // V
  "C_HMFLEJEIFGHFIFKGLILLK[ RUFK[ RUFS[ RaF_G\\JYNVTS[", // W
  "F^NLLLKKKILGNFPFRGSISLQUQXRZT[V[XZYXYVXUVU R]I]G\\FZFXGVITLPUNXLZJ[H[GZGX", // X
  "F]KMILHJHIIGKFLFNGOIOKNOMRLVLXMZN[P[RZTXVUWSYM R[FYMVWT]RbPfNgMfMdNaP^S[VY[V", // Y
  "H]ULTNSOQPOPNNNLOIQGTFWFYGZIZMYPWTTWPZN[K[JZJXKWNWPXQYR[R^QaPcNfLgKfKdLaN^Q[TYZV", // Z
  "KYPBPb ROBVB RObVb", // [
  "KYKFY^", // \
  "KYUBUb RNBUB RNbUb", // ]
  "JZRDJR RRDZR", // ^
  "G[Gb[b", // _
  "NVSKQMQORPSORNQO", // `
  "L\\UUTSRRPRNSMTLVLXMZO[Q[SZTXVRUWUZV[W[YZZY\\V", // a
  "M[MVOSRNSLTITGSFQGPIOMNTNZO[P[RZTXUUURVVWWYW[V", // b
  "MXTTTSSRQROSNTMVMXNZP[S[VYXV", // c
  "L\\UUTSRRPRNSMTLVLXMZO[Q[SZTXZF RVRUWUZV[W[YZZY\\V", // d
  "NXOYQXRWSUSSRRQROSNUNXOZQ[S[UZVYXV", // e
  "OWOVSQUNVLWIWGVFTGSIQQNZKaJdJfKgMfNcOZP[R[TZUYWV", // f
  "L[UUTSRRPRNSMTLVLXMZO[Q[SZTY RVRTYPdOfMgLfLdMaP^S\\U[XY[V", // g
  "M\\MVOSRNSLTITGSFQGPIOMNSM[ RM[NXOVQSSRURVSVUUXUZV[W[YZZY\\V", // h
  "PWSMSNTNTMSM RPVRRPXPZQ[R[TZUYWV", // i
  "PWSMSNTNTMSM RPVRRLdKfIgHfHdIaL^O\\Q[TYWV", // j
  "M[MVOSRNSLTITGSFQGPIOMNSM[ RM[NXOVQSSRURVSVUTVQV RQVSWTZU[V[XZYY[V", // k
  "OWOVQSTNULVIVGUFSGRIQMPTPZQ[R[TZUYWV", // l
  "E^EVGSIRJSJTIXH[ RIXJVLSNRPRQSQTPXO[ RPXQVSSURWRXSXUWXWZX[Y[[Z\\Y^V", // m
  "J\\JVLSNROSOTNXM[ RNXOVQSSRURVSVUUXUZV[W[YZZY\\V", // n
  "LZRRPRNSMTLVLXMZO[Q[SZTYUWUUTSRRQSQURWTXWXYWZV", // o
  "KZKVMSNQMUGg RMUNSPRRRTSUUUWTYSZQ[ RMZO[R[UZWYZV", // p
  "L[UUTSRRPRNSMTLVLXMZO[Q[SZ RVRUUSZPaOdOfPgRfScS\\U[XY[V", // q
  "MZMVOSPQPSSSTTTVSYSZT[U[WZXYZV", // r
  "NYNVPSQQQSSVTXTZR[ RNZP[T[VZWYYV", // s
  "OXOVQSSO RVFPXPZQ[S[UZVYXV RPNWN", // t
  "L[LVNRLXLZM[O[QZSXUU RVRTXTZU[V[XZYY[V", // u
  "L[LVNRMWMZN[O[RZTXUUUR RURVVWWYW[V", // v
  "I^LRJTIWIYJ[L[NZPX RRRPXPZQ[S[UZWXXUXR RXRYVZW\\W^V", // w
  "JZJVLSNRPRQSQZR[U[XYZV RWSVRTRSSOZN[L[KZ", // x
  "L[LVNRLXLZM[O[QZSXUU RVRPdOfMgLfLdMaP^S\\U[XY[V", // y
  "LZLVNSPRRRTTTVSXQZN[P\\Q^QaPdOfMgLfLdMaP^S\\WYZV", // z
  "KYRCQEQGRISJTLTNSPORSTTVTXSZR[Q]Q_Ra", // {
  "NVRBRb", // |
  "KYRCSESGRIQJPLPNQPURQTPVPXQZR[S]S_Ra", // }
  "F^ISJQLPNPPQTTVUXUZT[Q[O", // ~
];

/** Hershey's em is 32 units. */
const EM = 32;
const BASELINE = 9;

/** Curves where a glyph turns gently, as a pen does: each such corner becomes a quadratic between its neighbours' midpoints. */
function rounded(pts: Point[]): Point[] {
  if (pts.length < 3) return pts;
  const out: Point[] = [pts[0]];
  const mid = (i: number): Point => [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
  for (let i = 1; i < pts.length - 1; i++) {
    const ax = pts[i][0] - pts[i - 1][0], ay = pts[i][1] - pts[i - 1][1];
    const bx = pts[i + 1][0] - pts[i][0], by = pts[i + 1][1] - pts[i][1];
    const n = Math.hypot(ax, ay) * Math.hypot(bx, by);
    if (n > 0 && (ax * bx + ay * by) / n > Math.cos((70 * Math.PI) / 180)) {
      const p0 = mid(i - 1), p2 = mid(i);
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        out.push([(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * pts[i][0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * pts[i][1] + t * t * p2[1]]);
      }
    } else out.push(pts[i]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * `text` written in Hershey's script at `size` px to the em, leaning `slant`
 * (x moved right per unit up): the pen's lines in writing order, letter by
 * letter, moved so the ink's box starts at `pad`, with that box's size (pad
 * included) and the baseline's y. Characters outside ASCII are left out
 * (accents are dropped first). Pure, so it lays out the same on the server.
 */
export function script(text: string, { size = 56, slant = 0.18, pad = 4 } = {}) {
  const k = size / EM;
  const raw: Point[][] = [];
  let x = 0;
  for (const ch of text.normalize('NFD').replace(/[̀-ͯ]/g, '')) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code > 126) continue;
    const g = SCRIPT[code - 32];
    const v = (i: number) => g.charCodeAt(i) - 82;
    const ox = x - v(0);
    for (const s of g.slice(2).split(' R').filter(Boolean)) {
      const pts: Point[] = [];
      for (let i = 0; i + 1 < s.length; i += 2) {
        const gx = s.charCodeAt(i) - 82, gy = s.charCodeAt(i + 1) - 82;
        pts.push([(ox + gx + (BASELINE - gy) * slant) * k, gy * k]);
      }
      raw.push(rounded(pts));
    }
    x += v(1) - v(0);
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const l of raw) for (const [px, py] of l) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
  if (!raw.length) return { lines: [] as Point[][], w: 0, h: 0, baseline: 0 };
  const lines = raw.map((l) => l.map(([px, py]): Point => [px - x0 + pad, py - y0 + pad]));
  return { lines, w: Math.ceil(x1 - x0 + pad * 2), h: Math.ceil(y1 - y0 + pad * 2), baseline: BASELINE * k - y0 + pad };
}
