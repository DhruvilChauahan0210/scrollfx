'use client';

/**
 * ink-highlight — a mark a pen makes on words in running text: an underline,
 * a double underline, a loop round them, a box, a line struck through, or
 * hatching behind. It sits inline in a paragraph and follows the words when
 * they wrap: each line the phrase takes gets its own mark, drawn in turn.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/plotter and lib/ink (installed with it).
 * Styling: Tailwind CSS. The words keep the paragraph's own type and colour.
 *
 *   <p>Most sections <InkHighlight variant="circle">sit still</InkHighlight>.</p>
 *
 * The words are plain text in the server HTML; the marks are made in the
 * browser, measured to the words, and made again when the layout changes.
 * Reduced motion shows them drawn.
 */

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import 'svg-scroll-draw/no-flash.css';
import { hatch, inkBox, inkLoop, inkStrike, inkUnderline, type Stroke } from '@/lib/plotter';
import { useInk, type InkTrigger } from '@/lib/ink';

export type InkHighlightVariant = 'underline' | 'double-underline' | 'circle' | 'box' | 'strike' | 'hatch-fill';

export interface InkHighlightProps {
  children: ReactNode;
  variant?: InkHighlightVariant;
  /** The pen's colour. */
  accent?: string;
  strokeWidth?: number;
  /** Shapes the marks; the same seed draws the same marks. */
  seed?: number;
  /** `scroll`: drawn as the words rise, done at mid-screen. `view`: played once as they come into view. */
  trigger?: InkTrigger;
  /** With `view`, how long each line's mark takes, in ms. */
  duration?: number;
  /** The element the words sit in: `mark` by default, `s` for a strike. */
  as?: ElementType;
  className?: string;
}

interface Placed {
  /** Where the mark's box sits, from the highlight's own origin, in px. */
  x: number;
  y: number;
  w: number;
  h: number;
  strokes: Stroke[];
}

/** One mark per line the words take, sized to that line's box. */
function place(variant: InkHighlightVariant, r: { x: number; y: number; w: number; h: number }, seed: number): Placed {
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

function Mark({ mark, variant, accent, strokeWidth, trigger, duration }: { mark: Placed; variant: InkHighlightVariant; accent: string; strokeWidth: number; trigger: InkTrigger; duration: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const n = mark.strokes.length;
  // Hatching sweeps left to right; a box's sides and a double underline's strokes follow one another.
  const spread = variant === 'hatch-fill' ? 1 : variant === 'box' ? n - 1 : n > 1 ? 0.6 : 0;
  useInk(ref, { paths: n, spread, trigger, duration, version: mark });
  return (
    <svg
      ref={ref}
      data-scroll-draw-pending=""
      data-ink={trigger}
      aria-hidden
      width={mark.w}
      height={mark.h}
      viewBox={`0 0 ${mark.w} ${mark.h}`}
      className={`pointer-events-none absolute overflow-visible ${variant === 'hatch-fill' ? '-z-10 opacity-80' : ''}`}
      style={{ left: mark.x, top: mark.y }}
      fill="none"
      stroke={accent}
      strokeWidth={variant === 'hatch-fill' ? strokeWidth * 0.9 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {mark.strokes.map((s, i) => (
        <path key={i} d={s.d} />
      ))}
    </svg>
  );
}

export function InkHighlight({
  children,
  variant = 'underline',
  accent = '#e0482a',
  strokeWidth = 1.8,
  seed = 1,
  trigger = 'scroll',
  duration = 900,
  as,
  className = '',
}: InkHighlightProps) {
  const ref = useRef<HTMLElement>(null);
  const origin = useRef<HTMLSpanElement>(null);
  const [marks, setMarks] = useState<Placed[]>([]);
  const Tag = as ?? (variant === 'strike' ? 's' : 'mark');

  useEffect(() => {
    const el = ref.current, o = origin.current;
    if (!el || !o) return;
    let last = '';
    const measure = () => {
      // The origin is an empty box at left 0, top 0 of the highlight's own
      // containing block, wherever a browser puts that for words broken over
      // lines, so the marks land where they are measured.
      const at = o.getBoundingClientRect();
      const lines = [...el.getClientRects()]
        .filter((r) => r.width > 1 && r.height > 1)
        .map((r) => ({ x: Math.round(r.left - at.left), y: Math.round(r.top - at.top), w: Math.round(r.width), h: Math.round(r.height) }));
      const sig = JSON.stringify(lines);
      if (sig === last) return;
      last = sig;
      setMarks(lines.map((r, i) => place(variant, r, seed + i * 7)));
    };
    measure();
    // Words reflow when their block changes width, or when a web font arrives.
    let block: HTMLElement | null = el.parentElement;
    while (block && getComputedStyle(block).display.startsWith('inline')) block = block.parentElement;
    const ro = new ResizeObserver(measure);
    ro.observe(block ?? document.body);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [variant, seed]);

  return (
    // <mark>'s own yellow and black are reset here; `className` goes on the
    // words inside, so a colour passed in wins.
    <Tag ref={ref} className={`relative bg-transparent text-inherit no-underline ${variant === 'hatch-fill' ? 'isolate' : ''}`}>
      <span ref={origin} aria-hidden className="pointer-events-none absolute left-0 top-0 size-0" />
      {className ? <span className={className}>{children}</span> : children}
      {marks.map((m, i) => (
        <Mark key={`${i}:${m.x},${m.y},${m.w}x${m.h}`} mark={m} variant={variant} accent={accent} strokeWidth={strokeWidth} trigger={trigger} duration={duration} />
      ))}
    </Tag>
  );
}
