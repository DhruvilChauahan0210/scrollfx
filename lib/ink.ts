/**
 * ink — what the scrollfx ink components share: a hook that hands an <svg> to
 * svg-scroll-draw, either tied to the scroll (finishing as it reaches the
 * middle of the screen) or played once as it comes into view; a hook that
 * measures an element; and Hershey's script, a single-stroke handwriting
 * font, for ink-signature.
 *
 * Part of scrollfx (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 */

import { useEffect, useState, type RefObject } from 'react';
import { scrollDraw } from 'svg-scroll-draw';
import { scrollWindow, staggerFor, type Point } from '@/lib/plotter';

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
    const stagger = staggerFor(paths, spread);
    const draw =
      trigger === 'view'
        ? scrollDraw(svg, { selector: 'path', autoplay: true, once: true, duration: duration / (1 + spread), stagger, easing: 'linear', native: false })
        : scrollDraw(svg, { selector: 'path', stagger, easing: 'linear', trigger: scrollWindow(spread), progressVar: false });
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
