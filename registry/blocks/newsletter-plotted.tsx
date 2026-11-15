'use client';

/**
 * newsletter-plotted — a sign-up beside a starburst a pen draws ray by ray,
 * clockwise from the top, as the section arrives: ink rays rising and falling
 * round the circle, every twelfth one long and in the accent colour.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`. The print is a `bg-card` sheet.
 *
 * The form is a plain HTML form: it posts `email` to `action`, or calls
 * `onSubmit` if you pass one. Sending the email is up to your provider. The
 * copy and the form are in the server HTML; the starburst is drawn in the
 * browser, finishing as it reaches the middle of the screen. Reduced motion
 * shows it drawn.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { scrollWindow, staggerFor, starburst, type Stroke } from '@/lib/plotter';

export interface NewsletterPlottedProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  /** Where the form posts. Ignored when `onSubmit` is given. */
  action?: string;
  onSubmit?: (email: string) => void;
  button?: string;
  /** A line under the form, such as how often you write. */
  note?: string;
  caption?: string;
  seed?: number;
  accent?: string;
  className?: string;
}

// The rays draw one after another over this many trigger ranges (see scrollWindow).
const SPREAD = 1;

function Heading({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

export function NewsletterPlotted({
  eyebrow = 'Letters',
  heading = 'One email, *once* a month.',
  description = 'What we shipped, what we learned, and one chart worth reading. Nothing else.',
  action = '#',
  onSubmit,
  button = 'Subscribe',
  note = 'Unsubscribe from any letter, in one click.',
  caption = 'Pl. — Starburst',
  seed = 23,
  accent = '#e0482a',
  className = '',
}: NewsletterPlottedProps) {
  const [rays, setRays] = useState<Stroke[] | null>(null);
  useEffect(() => setRays(starburst(seed)), [seed]);

  const submit = onSubmit
    ? (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(String(new FormData(e.currentTarget).get('email') ?? ''));
      }
    : undefined;

  return (
    <section className={`mx-auto grid max-w-7xl items-center gap-14 px-6 py-28 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-24 ${className}`}>
      <figure className="mx-auto w-full max-w-md lg:max-w-none">
        <div className="aspect-square w-full rounded-[3px] bg-card p-[7%] shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-18px_rgba(40,30,10,.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05),0_24px_60px_-20px_rgba(0,0,0,.8)]">
          {rays && (
            <ScrollDraw stagger={staggerFor(rays.length, SPREAD)} easing="linear" trigger={scrollWindow(SPREAD)} className="size-full" aria-hidden>
              <svg viewBox="0 0 400 400" className="size-full" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                {rays.map((r, i) => (r.pen ? <path key={i} d={r.d} stroke={accent} strokeWidth="1.4" /> : <path key={i} d={r.d} />))}
              </svg>
            </ScrollDraw>
          )}
        </div>
        <figcaption className="mt-4 flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>{caption}</span>
          <span>{rays ? rays.length : 0} rays · seed {seed}</span>
        </figcaption>
      </figure>

      <div className="max-w-lg">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-6 font-serif text-[clamp(2.6rem,5vw,4.4rem)] leading-[0.98] tracking-[-0.03em]">
          <Heading text={heading} />
        </h2>
        <p className="mt-6 text-pretty text-[17px] leading-relaxed text-muted-foreground">{description}</p>
        <form action={onSubmit ? undefined : action} method="post" onSubmit={submit} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="newsletter-email">Email address</label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="h-12 min-w-0 flex-1 rounded-full border bg-background px-5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button type="submit" className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-[15px] font-medium text-background transition-transform hover:-translate-y-px">
            {button}
          </button>
        </form>
        {note && <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{note}</p>}
      </div>
    </section>
  );
}
