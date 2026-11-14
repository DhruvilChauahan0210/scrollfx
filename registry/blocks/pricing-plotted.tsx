'use client';

/**
 * pricing-plotted — plans in columns, each headed by a mark that grows denser
 * with the plan, plotted as the section arrives. The recommended plan is
 * framed by a pen that goes round it twice, and the prices count up.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`.
 *
 * The prices are in the server HTML (the counter renders its final number).
 * Reduced motion shows the final prices, the marks and the frame drawn.
 */

import { useEffect, useRef, useState } from 'react';
import { ScrollCounter, ScrollDraw } from 'svg-scroll-draw/react';
import { scrollWindow, sketchRect, staggerFor, type Stroke } from '@/lib/plotter';

export interface Plan {
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
}

export interface PricingPlottedProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  plans?: Plan[];
  currency?: string;
  accent?: string;
  className?: string;
}

const DEFAULT_PLANS: Plan[] = [
  { name: 'Starter', description: 'For trying it on a side project.', monthly: 0, yearly: 0, features: ['3 dashboards', '7 days of history', 'Email reports', 'Community support'], cta: { label: 'Start free', href: '#' } },
  { name: 'Pro', description: 'For teams that run on their numbers.', monthly: 24, yearly: 19, features: ['Unlimited dashboards', '2 years of history', 'Realtime updates', 'Scheduled reports', 'Slack alerts', 'Priority support'], cta: { label: 'Start a 14-day trial', href: '#' }, featured: true },
  { name: 'Business', description: 'For companies with security reviews.', monthly: 64, yearly: 52, features: ['Everything in Pro', 'Unlimited history', 'SSO and SCIM', 'Audit log', 'Custom retention', 'A named engineer'], cta: { label: 'Talk to sales', href: '#' } },
];

function Heading({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

/** A mark of concentric rings: more rings for a bigger plan. */
function Mark({ rings, accent }: { rings: number; accent?: string }) {
  return (
    <ScrollDraw stagger={staggerFor(rings, 0.6)} easing="linear" trigger={scrollWindow(0.6)} className="size-14" aria-hidden>
      <svg viewBox="0 0 56 56" className="size-full" fill="none" stroke={accent ?? 'currentColor'} strokeWidth="0.9">
        {Array.from({ length: rings }, (_, i) => <circle key={i} cx="28" cy="28" r={26 - i * (22 / rings)} />)}
      </svg>
    </ScrollDraw>
  );
}

/** The pen's frame round the recommended plan, measured to fit it. */
function Frame({ accent }: { accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<{ w: number; h: number; strokes: Stroke[] } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      setFrame((f) => (f && f.w === w && f.h === h ? f : { w, h, strokes: sketchRect({ w, h, seed: 3 }) }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0">
      {frame && (
        // The second pass follows the first, both round as the card reaches
        // the middle of the screen.
        <ScrollDraw key={`${frame.w}x${frame.h}`} stagger={0.5} easing="linear" trigger={scrollWindow(0.5)} className="size-full" aria-hidden>
          <svg width={frame.w} height={frame.h} viewBox={`0 0 ${frame.w} ${frame.h}`} className="block overflow-visible" fill="none" strokeWidth="1.3" strokeLinecap="round">
            {frame.strokes.map((s, i) => <path key={i} d={s.d} stroke={s.pen ? accent : 'currentColor'} />)}
          </svg>
        </ScrollDraw>
      )}
    </div>
  );
}

export function PricingPlotted({
  eyebrow = 'Pricing',
  heading = 'Simple, *honest* pricing.',
  description = 'Start free. Upgrade when your team needs more history, more people or more control.',
  plans = DEFAULT_PLANS,
  currency = '$',
  accent = '#e0482a',
  className = '',
}: PricingPlottedProps) {
  const [yearly, setYearly] = useState(true);

  return (
    <section className={`mx-auto max-w-7xl px-6 py-28 sm:px-10 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
            <Heading text={heading} />
          </h2>
          <p className="mt-6 max-w-lg text-pretty text-[17px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border p-1 font-mono text-[12px] uppercase tracking-[0.14em]">
          {[{ label: 'Monthly', value: false }, { label: 'Yearly', value: true }].map((o) => (
            <button key={o.label} type="button" role="radio" aria-checked={yearly === o.value} onClick={() => setYearly(o.value)}
              className={`rounded-full px-4 py-2 transition-colors ${yearly === o.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-0">
        {plans.map((plan, i) => {
          const price = yearly ? plan.yearly : plan.monthly;
          return (
            <article key={plan.name} className={`relative flex flex-col p-8 sm:p-10 ${plan.featured ? 'bg-card' : i > 0 ? 'border-t lg:border-l lg:border-t-0' : ''} ${plan.featured ? 'rounded-[20px]' : ''}`}>
              {plan.featured && <Frame accent={accent} />}
              <Mark rings={2 + i * 3} accent={plan.featured ? accent : undefined} />
              <h3 className="mt-8 font-serif text-3xl tracking-[-0.02em]">{plan.name}</h3>
              <p className="mt-2 text-muted-foreground">{plan.description}</p>

              <p className="mt-10 flex items-baseline gap-2">
                <span className="font-serif text-6xl tracking-[-0.03em] tabular-nums">
                  {currency}
                  {/* A new key per period: the counter starts again from the new number. */}
                  <ScrollCounter key={`${plan.name}-${yearly}`} to={price} trigger={scrollWindow()} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">/ month</span>
              </p>
              <p className="mt-2 h-5 text-sm text-muted-foreground">{price > 0 ? (yearly ? 'Billed yearly' : 'Billed monthly') : 'Free, for as long as you like'}</p>

              <a href={plan.cta.href} className={`mt-8 inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-medium transition-transform hover:-translate-y-px ${plan.featured ? 'bg-foreground text-background' : 'border hover:bg-accent'}`}>
                {plan.cta.label}
              </a>

              <ul className="mt-10 space-y-3.5">
                {plan.features.map((ft) => (
                  <li key={ft} className="flex items-baseline gap-3.5">
                    <span aria-hidden className="mt-[0.55em] h-px w-4 shrink-0 bg-foreground/50" />
                    <span>{ft}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
