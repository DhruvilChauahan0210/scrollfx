'use client';

/**
 * cta-harmonograph — the closing call to action, beside a harmonograph: the
 * trace of two swinging pendulums, one unbroken line that a pen draws as the
 * section arrives, spiralling in as the swing dies away.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`. The print is a `bg-card` sheet.
 *
 * The copy and buttons are in the server HTML; the line is made in the
 * browser from `seed`. Reduced motion shows it drawn.
 */

import { useEffect, useState } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { harmonograph, scrollWindow } from '@/lib/plotter';

export interface CtaHarmonographProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  caption?: string;
  seed?: number;
  className?: string;
}

function Heading({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

export function CtaHarmonograph({
  eyebrow = 'Begin',
  heading = 'Ready when *you* are.',
  description = 'Start free, with every feature, for fourteen days. No card, and your data comes with you if you leave.',
  primary = { label: 'Start free', href: '#' },
  secondary = { label: 'Talk to us', href: '#' },
  caption = 'Pl. — Harmonograph',
  seed = 34,
  className = '',
}: CtaHarmonographProps) {
  const [d, setD] = useState<string | null>(null);
  useEffect(() => setD(harmonograph(seed)[0].d), [seed]);

  return (
    <section className={`mx-auto grid max-w-7xl items-center gap-14 px-6 py-28 sm:px-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-24 ${className}`}>
      <figure>
        <div className="aspect-square w-full rounded-[3px] bg-card p-[5%] shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-18px_rgba(40,30,10,.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05),0_24px_60px_-20px_rgba(0,0,0,.8)]">
          {d && (
            // One line, finished as the print reaches the middle of the screen.
            <ScrollDraw easing="linear" trigger={scrollWindow()} className="size-full" aria-hidden>
              <svg viewBox="0 0 1000 1000" className="size-full" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity={0.85}>
                <path d={d} />
              </svg>
            </ScrollDraw>
          )}
        </div>
        <figcaption className="mt-4 flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>{caption}</span>
          <span>One line · seed {seed}</span>
        </figcaption>
      </figure>

      <div className="max-w-lg">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-6 font-serif text-[clamp(2.8rem,5.6vw,5rem)] leading-[0.96] tracking-[-0.03em]">
          <Heading text={heading} />
        </h2>
        <p className="mt-6 text-pretty text-[17px] leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href={primary.href} className="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-[15px] font-medium text-background transition-transform hover:-translate-y-px">
            {primary.label}
          </a>
          <a href={secondary.href} className="inline-flex h-12 items-center rounded-full border px-7 text-[15px] font-medium transition-colors hover:bg-accent">
            {secondary.label}
          </a>
        </div>
      </div>
    </section>
  );
}
