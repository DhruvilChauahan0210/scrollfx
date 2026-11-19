'use client';

/**
 * ink-highlight — a mark a pen makes on words in running text: an underline,
 * a double underline, a loop round them, a box, a line struck through, or
 * hatching behind. It sits inline in a paragraph and follows the words when
 * they wrap: each line the phrase takes gets its own mark, drawn in turn.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/plotter, lib/ink-core and lib/ink (installed with it).
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
import { blockOf, highlightMark, highlightSpread, measureLines, type InkMark } from '@/lib/ink-core';
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

function Mark({ mark, variant, accent, strokeWidth, trigger, duration }: { mark: InkMark; variant: InkHighlightVariant; accent: string; strokeWidth: number; trigger: InkTrigger; duration: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const n = mark.strokes.length;
  const spread = highlightSpread(variant, n);
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
  const [marks, setMarks] = useState<InkMark[]>([]);
  const Tag = as ?? (variant === 'strike' ? 's' : 'mark');

  useEffect(() => {
    const el = ref.current, o = origin.current;
    if (!el || !o) return;
    let last = '';
    const measure = () => {
      const lines = measureLines(el, o);
      const sig = JSON.stringify(lines);
      if (sig === last) return;
      last = sig;
      setMarks(lines.map((r, i) => highlightMark(variant, r, seed + i * 7)));
    };
    measure();
    // Words reflow when their block changes width, or when a web font arrives.
    const ro = new ResizeObserver(measure);
    ro.observe(blockOf(el));
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
