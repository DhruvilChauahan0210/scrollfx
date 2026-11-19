'use client';

/**
 * ink-stamp — a short word or two set inside a stamp a pen plots round it: a
 * round stamp with a line of text running round its rim, a rectangle ruled
 * twice, or a seal with a scalloped edge. Set a little askew, as a stamp
 * lands.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, lib/plotter, lib/ink-core and lib/ink (installed with it).
 * Styling: Tailwind CSS. The whole stamp is in the one `accent` colour, as a
 * stamp is in one ink.
 *
 * The words, and the rim's text on its circle, are in the server HTML; the
 * rings and the frame are made in the browser. Reduced motion shows them
 * drawn.
 */

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import 'svg-scroll-draw/no-flash.css';
import { seedOf, stampRings, type Stroke } from '@/lib/plotter';
import { stampFrame, stampLayout } from '@/lib/ink-core';
import { useInk, useSize, type InkTrigger } from '@/lib/ink';

export type InkStampVariant = 'circle' | 'rectangle' | 'seal';

export interface InkStampProps {
  /** The words in the middle: keep them short. */
  children: ReactNode;
  variant?: InkStampVariant;
  /** A line of text round the rim, for `circle` and `seal`. It is spaced to go once round. */
  rim?: string;
  /** The width and height of `circle` and `seal`, in px. */
  size?: number;
  /** How far the stamp is turned, in degrees. */
  rotate?: number;
  /** The stamp's ink. */
  accent?: string;
  strokeWidth?: number;
  seed?: number;
  /** `scroll`: drawn as it rises, done at mid-screen. `view`: played once as it comes into view. */
  trigger?: InkTrigger;
  /** With `view`, the drawing's length in ms. */
  duration?: number;
  className?: string;
}

function Strokes({ strokes, w, h, view, accent, strokeWidth, trigger, duration, spread }: { strokes: Stroke[]; w: number; h: number; view?: string; accent: string; strokeWidth: number; trigger: InkTrigger; duration: number; spread: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useInk(ref, { paths: strokes.length, spread, trigger, duration, version: strokes });
  return (
    <svg ref={ref} data-scroll-draw-pending="" data-ink={trigger} aria-hidden width={w} height={h} viewBox={view ?? `0 0 ${w} ${h}`} className="pointer-events-none absolute inset-0 overflow-visible" fill="none" stroke={accent} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {strokes.map((s, i) => <path key={i} d={s.d} />)}
    </svg>
  );
}

export function InkStamp({
  children,
  variant = 'circle',
  rim,
  size = 148,
  rotate = -8,
  accent = '#e0482a',
  strokeWidth = 1.4,
  seed,
  trigger = 'scroll',
  duration = 1400,
  className = '',
}: InkStampProps) {
  const id = useId();
  const s = seed ?? seedOf(`${variant}${rim ?? ''}`);
  const pen = { accent, trigger, duration };
  const box = useRef<HTMLSpanElement>(null);
  const measured = useSize(box);
  const [rings, setRings] = useState<Stroke[] | null>(null);
  useEffect(() => {
    if (variant !== 'rectangle') setRings(stampRings({ size: 100, seed: s, kind: variant }));
  }, [variant, s]);

  // Ruled twice round the edge, then once more, finer, inside.
  const frame = useMemo(
    () => (variant === 'rectangle' && measured ? stampFrame(measured.w, measured.h, s) : null),
    [variant, measured, s],
  );

  if (variant === 'rectangle') {
    const strokes = frame;
    return (
      <span ref={box} className={`relative inline-flex items-center justify-center px-7 py-4 ${className}`} style={{ rotate: `${rotate}deg`, color: accent }}>
        <span className="font-mono text-[15px] font-semibold uppercase leading-none tracking-[0.28em]">{children}</span>
        {measured && strokes && <RectFrame key={`${measured.w}x${measured.h}`} strokes={strokes} w={measured.w} h={measured.h} {...pen} strokeWidth={strokeWidth} />}
      </span>
    );
  }

  // The rim's text sits in the band between the outer rings and the inner one; the words fit inside the inner ring.
  const { rimFont, wordFont, circle, rimLength } = stampLayout(variant, size, typeof children === 'string' ? children : undefined);
  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size, rotate: `${rotate}deg`, color: accent }}>
      {rim && (
        <svg aria-hidden width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 overflow-visible">
          <defs>
            <path id={`${id}-rim`} d={circle} />
          </defs>
          <text fill="currentColor" className="font-mono uppercase" style={{ fontSize: rimFont, letterSpacing: '0.12em' }} dominantBaseline="central">
            <textPath href={`#${id}-rim`} textLength={rimLength} lengthAdjust="spacing">{rim}</textPath>
          </text>
        </svg>
      )}
      <span className="max-w-[60%] text-center font-mono font-semibold uppercase leading-tight tracking-[0.2em]" style={{ fontSize: wordFont }}>
        {children}
        {rim && <span className="sr-only"> — {rim}</span>}
      </span>
      {rings && <Strokes strokes={rings} w={size} h={size} view="0 0 100 100" spread={0.6} {...pen} strokeWidth={strokeWidth * (100 / size)} />}
    </span>
  );
}

function RectFrame(props: { strokes: Stroke[]; w: number; h: number; accent: string; strokeWidth: number; trigger: InkTrigger; duration: number }) {
  return <Strokes {...props} spread={0.6} />;
}
