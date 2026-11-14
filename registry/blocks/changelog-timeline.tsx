'use client';

/**
 * changelog-timeline — releases on a vertical rail. The rail draws down as the
 * reader scrolls, its tip held at 60% of the screen, and each release lights
 * up as the line reaches it.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw. Styling: Tailwind CSS with shadcn/ui tokens.
 *
 * Every part reads without the motion: the releases start at reduced opacity,
 * not hidden, and reduced motion shows the rail drawn and every release lit.
 */

import { ScrollAnimate } from 'svg-scroll-draw/react';

export interface Release {
  version: string;
  date: string;
  title: string;
  body: string;
  tag?: 'New' | 'Improved' | 'Fixed' | 'Security';
}

export interface ChangelogTimelineProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  releases?: Release[];
  className?: string;
}

const DEFAULT_RELEASES: Release[] = [
  { version: 'v3.2', date: 'Nov 12, 2026', title: 'Realtime dashboards', body: 'Every chart now updates the moment the data changes. No refresh button, no polling interval to set.', tag: 'New' },
  { version: 'v3.1', date: 'Oct 28, 2026', title: 'Scheduled reports', body: 'Pick a dashboard, a day and an inbox. The report arrives as a PDF and a link, at the same time every week.', tag: 'New' },
  { version: 'v3.0', date: 'Oct 2, 2026', title: 'A faster editor', body: 'Large workspaces open four times faster, and filters apply as you type instead of after you press enter.', tag: 'Improved' },
  { version: 'v2.9', date: 'Sep 15, 2026', title: 'Single sign-on on every plan', body: 'SAML and OIDC are no longer an Enterprise extra. Connect Okta, Entra ID or Google in a few minutes.', tag: 'Security' },
  { version: 'v2.8', date: 'Aug 30, 2026', title: 'Dark mode', body: 'Follows your system setting, or set it per workspace. Charts pick colours that keep their contrast in both.', tag: 'New' },
];

const TAG_STYLE: Record<NonNullable<Release['tag']>, string> = {
  New: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  Improved: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  Fixed: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  Security: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export function ChangelogTimeline({
  eyebrow = 'Changelog',
  heading = 'What we shipped',
  description = 'New features, improvements and fixes, every two weeks.',
  releases = DEFAULT_RELEASES,
  className = '',
}: ChangelogTimelineProps) {
  return (
    <section className={`mx-auto max-w-3xl px-6 py-24 ${className}`}>
      <header className="mb-14">
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{heading}</h2>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </header>

      <ol className="relative">
        {/* The rail: a faint track, and the line that draws down over it. */}
        <div aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-border sm:left-[143px]" />
        <ScrollAnimate
          aria-hidden
          props={{ transform: ['scaleY(0)', 'scaleY(1)'] }}
          trigger={{ start: 'top 60%', end: 'bottom 60%' }}
          easing="linear"
          className="absolute bottom-2 left-[7px] top-2 w-px origin-top sm:left-[143px]"
        >
          <div className="h-full w-px bg-foreground" />
        </ScrollAnimate>

        {releases.map((r) => (
          <li key={r.version} className="relative grid grid-cols-[16px_1fr] gap-x-5 pb-12 last:pb-0 sm:grid-cols-[120px_16px_1fr] sm:gap-x-6">
            <div className="hidden pt-0.5 text-right sm:block">
              <p className="font-mono text-sm font-medium">{r.version}</p>
              <p className="text-xs text-muted-foreground">{r.date}</p>
            </div>

            {/* The dot: an empty ring that fills as the line reaches it. */}
            <div className="relative mt-1.5 size-4 rounded-full border-2 border-border bg-background">
              <ScrollAnimate
                aria-hidden
                props={{ opacity: [0, 1], transform: ['scale(0.3)', 'scale(1)'] }}
                trigger={{ start: 'top 62%', end: 'top 58%' }}
                className="absolute -inset-0.5"
              >
                <div className="size-4 rounded-full border-2 border-foreground bg-foreground" />
              </ScrollAnimate>
            </div>

            <ScrollAnimate
              props={{ opacity: [0.45, 1], transform: ['translateX(8px)', 'translateX(0px)'] }}
              trigger={{ start: 'top 68%', end: 'top 56%' }}
              easing="ease-out"
            >
              <p className="mb-1 font-mono text-xs text-muted-foreground sm:hidden">
                {r.version} · {r.date}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{r.title}</h3>
                {r.tag && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TAG_STYLE[r.tag]}`}>{r.tag}</span>}
              </div>
              <p className="mt-1.5 text-pretty text-muted-foreground">{r.body}</p>
            </ScrollAnimate>
          </li>
        ))}
      </ol>
    </section>
  );
}
