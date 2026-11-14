'use client';

/**
 * hero-tilt — a hero whose key phrase underlines itself, over a product
 * screenshot that starts tilted back and straightens as the reader scrolls.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw. Styling: Tailwind CSS with shadcn/ui tokens,
 * so it takes on your theme.
 *
 * Pass `screenshot` to show your product: an <img>, a <video>, or markup. The
 * default is a small dashboard drawn in HTML, so the block works with no files.
 *
 * Reduced motion: the screenshot sits flat and the underline is drawn from the
 * start. Without JavaScript the screenshot is flat and the page reads normally.
 */

import type { ReactNode } from 'react';
import { ScrollAnimate, ScrollDraw } from 'svg-scroll-draw/react';

export interface HeroTiltProps {
  badge?: string;
  /** The heading, before the underlined phrase. */
  heading?: string;
  /** The phrase that underlines itself. */
  highlight?: string;
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  screenshot?: ReactNode;
  className?: string;
}

export function HeroTilt({
  badge = 'New: realtime dashboards',
  heading = 'Know your numbers',
  highlight = 'before Monday',
  description = 'Every metric your team watches, in one place that updates as it happens. No spreadsheets, no exports, no waiting for the weekly report.',
  primary = { label: 'Start free', href: '#' },
  secondary = { label: 'Book a demo', href: '#' },
  screenshot,
  className = '',
}: HeroTiltProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* A faint grid that fades out toward the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000_40%,transparent_100%)]"
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 text-center sm:pt-32">
        {badge && (
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {badge}
          </span>
        )}

        <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
          {heading}{' '}
          <span className="relative inline-block whitespace-nowrap">
            {highlight}
            <ScrollDraw autoplay duration={1100} delay={250} easing="ease-out" className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full sm:-bottom-3 sm:h-4">
              <svg viewBox="0 0 300 16" preserveAspectRatio="none" className="size-full overflow-visible" fill="none" aria-hidden>
                <path d="M3 11 C 70 4, 150 3, 297 8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-emerald-500" />
              </svg>
            </ScrollDraw>
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">{description}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={primary.href} className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
            {primary.label}
          </a>
          <a href={secondary.href} className="inline-flex h-10 items-center rounded-md border bg-background px-5 text-sm font-medium transition-colors hover:bg-accent">
            {secondary.label}
          </a>
        </div>
      </div>

      {/* The screenshot: tilted back on arrival, flat by the time its top is near the top of the screen. */}
      <div className="relative mx-auto mt-16 max-w-6xl px-6 [perspective:1600px] sm:mt-20">
        <ScrollAnimate
          props={{ transform: ['rotateX(26deg) scale(0.92)', 'rotateX(0deg) scale(1)'], opacity: [0.6, 1] }}
          trigger={{ start: 'top 60%', end: 'top 15%' }}
          easing="ease-out"
          className="origin-top"
        >
          <div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-black/10 ring-1 ring-black/5 dark:shadow-black/40 dark:ring-white/5">
            {screenshot ?? <DashboardMock />}
          </div>
        </ScrollAnimate>
        {/* Fades the bottom of the screenshot into the page. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>
    </section>
  );
}

/** A small analytics dashboard in HTML, so the block needs no image. */
function DashboardMock() {
  const nav = ['Overview', 'Revenue', 'Customers', 'Reports', 'Settings'];
  const stats = [
    { label: 'Revenue', value: '$48,210', delta: '+12.4%' },
    { label: 'Active users', value: '3,904', delta: '+5.1%' },
    { label: 'Churn', value: '1.8%', delta: '−0.3%' },
  ];
  const rows = [
    ['Northwind', 'Enterprise', '$12,400'],
    ['Globex', 'Team', '$4,180'],
    ['Initech', 'Team', '$3,920'],
  ];
  return (
    <div className="flex text-left text-sm" aria-label="Product screenshot" role="img">
      <aside className="hidden w-48 shrink-0 border-r bg-muted/40 p-4 md:block">
        <div className="mb-6 flex items-center gap-2 font-semibold">
          <span className="size-5 rounded-md bg-primary" /> Acme
        </div>
        <ul className="space-y-1">
          {nav.map((n, i) => (
            <li key={n} className={`rounded-md px-2 py-1.5 ${i === 0 ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}>{n}</li>
          ))}
        </ul>
      </aside>
      <div className="min-w-0 flex-1 p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Overview</p>
            <p className="font-semibold">This week</p>
          </div>
          <span className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">Last 7 days</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-base font-semibold tabular-nums sm:text-xl">{s.value}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{s.delta}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border bg-background p-3">
          <svg viewBox="0 0 400 110" className="h-28 w-full" fill="none" aria-hidden>
            <path d="M0 90 C 40 84, 60 60, 100 64 S 160 40, 200 46 S 270 18, 310 26 S 370 10, 400 6" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500" />
            <path d="M0 90 C 40 84, 60 60, 100 64 S 160 40, 200 46 S 270 18, 310 26 S 370 10, 400 6 V110 H0 Z" className="fill-emerald-500/10" />
          </svg>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border bg-background">
          {rows.map(([name, plan, amount]) => (
            <div key={name} className="flex items-center justify-between border-b px-3 py-2 last:border-0">
              <span className="font-medium">{name}</span>
              <span className="text-muted-foreground">{plan}</span>
              <span className="tabular-nums">{amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
