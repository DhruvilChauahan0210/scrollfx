'use client';

/**
 * pricing-count — three plans whose prices count up as the section arrives,
 * and whose checkmarks draw themselves in, row after row.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw. Styling: Tailwind CSS with shadcn/ui tokens.
 *
 * The prices are in the server HTML (the counter renders its final number),
 * so search engines and readers without JavaScript see them. Reduced motion
 * shows the final prices and the checks drawn.
 */

import { useState } from 'react';
import { ScrollCounter, ScrollDraw } from 'svg-scroll-draw/react';

export interface Plan {
  name: string;
  description: string;
  /** Price per month, billed monthly and billed yearly. */
  monthly: number;
  yearly: number;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
}

export interface PricingCountProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  plans?: Plan[];
  currency?: string;
  className?: string;
}

const DEFAULT_PLANS: Plan[] = [
  {
    name: 'Starter',
    description: 'For trying it out on a side project.',
    monthly: 0,
    yearly: 0,
    features: ['3 dashboards', '7 days of history', 'Email reports', 'Community support'],
    cta: { label: 'Start free', href: '#' },
  },
  {
    name: 'Pro',
    description: 'For teams that run on their numbers.',
    monthly: 24,
    yearly: 19,
    features: ['Unlimited dashboards', '2 years of history', 'Realtime updates', 'Scheduled reports', 'Slack alerts', 'Priority support'],
    cta: { label: 'Start a 14-day trial', href: '#' },
    featured: true,
  },
  {
    name: 'Business',
    description: 'For companies with security reviews.',
    monthly: 64,
    yearly: 52,
    features: ['Everything in Pro', 'Unlimited history', 'SSO and SCIM', 'Audit log', 'Custom data retention', 'A named support engineer'],
    cta: { label: 'Talk to sales', href: '#' },
  },
];

export function PricingCount({
  eyebrow = 'Pricing',
  heading = 'Simple pricing that grows with you',
  description = 'Start free. Upgrade when your team needs more history, more people or more control.',
  plans = DEFAULT_PLANS,
  currency = '$',
  className = '',
}: PricingCountProps) {
  const [yearly, setYearly] = useState(true);

  return (
    <section className={`mx-auto max-w-6xl px-6 py-24 ${className}`}>
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{heading}</h2>
        <p className="mt-3 text-pretty text-muted-foreground">{description}</p>

        <div role="radiogroup" aria-label="Billing period" className="mt-8 inline-flex rounded-full border bg-muted/50 p-1 text-sm">
          {[
            { label: 'Monthly', value: false },
            { label: 'Yearly', value: true },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={yearly === o.value}
              onClick={() => setYearly(o.value)}
              className={`rounded-full px-4 py-1.5 font-medium transition-colors ${yearly === o.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {o.label}
              {o.value && <span className="ml-1.5 text-xs text-emerald-600 dark:text-emerald-400">−20%</span>}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = yearly ? plan.yearly : plan.monthly;
          return (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${plan.featured ? 'border-foreground/80 bg-card shadow-xl shadow-black/5 dark:shadow-black/30' : 'bg-card/50'}`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-8 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">Most popular</span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight tabular-nums">
                  {currency}
                  {/* A new key per period: the counter starts again from the new number. */}
                  <ScrollCounter key={`${plan.name}-${yearly}`} to={price} trigger={{ start: 'top 90%', end: 'top 55%' }} />
                </span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </p>
              <p className="mt-1 h-5 text-xs text-muted-foreground">{price > 0 && yearly ? 'billed yearly' : price > 0 ? 'billed monthly' : 'free forever'}</p>

              <a
                href={plan.cta.href}
                className={`mt-6 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-opacity hover:opacity-90 ${plan.featured ? 'bg-primary text-primary-foreground shadow-sm' : 'border bg-background hover:bg-accent'}`}
              >
                {plan.cta.label}
              </a>

              <ScrollDraw stagger={0.08} easing="ease-out" trigger={{ start: 'top 85%', end: 'top 45%' }} className="mt-8">
                <ul className="space-y-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0" fill="none" aria-hidden>
                        <path d="M4 10.5 L8 14.5 L16 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </ScrollDraw>
            </article>
          );
        })}
      </div>
    </section>
  );
}
