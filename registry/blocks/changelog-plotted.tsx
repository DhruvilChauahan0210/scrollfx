'use client';

/**
 * changelog-plotted — releases down a rail that inks itself as you read, each
 * stamped with a rosette drawn from its version number: every release gets a
 * mark of its own, and the same one every time.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: react, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn/ui tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`.
 *
 * The releases are plain text in the server HTML; the stamps are drawn in the
 * browser. Reduced motion shows the rail and the stamps drawn.
 */

import { useEffect, useState } from 'react';
import { ScrollAnimate, ScrollDraw } from 'svg-scroll-draw/react';
import 'svg-scroll-draw/no-flash.css';
import { rosette, scrollWindow, seedOf } from '@/lib/plotter';

export interface Release {
  version: string;
  date: string;
  title: string;
  body: string;
}

export interface ChangelogPlottedProps {
  eyebrow?: string;
  heading?: string;
  releases?: Release[];
  accent?: string;
  className?: string;
}

const DEFAULT_RELEASES: Release[] = [
  { version: '3.2', date: 'Nov 12, 2026', title: 'Realtime dashboards', body: 'Every chart updates the moment the data changes. No refresh button, no polling interval to set.' },
  { version: '3.1', date: 'Oct 28, 2026', title: 'Scheduled reports', body: 'Pick a dashboard, a day and an inbox. The report arrives as a PDF and a link, at the same time every week.' },
  { version: '3.0', date: 'Oct 2, 2026', title: 'A faster editor', body: 'Large workspaces open four times faster, and filters apply as you type instead of after you press enter.' },
  { version: '2.9', date: 'Sep 15, 2026', title: 'Single sign-on on every plan', body: 'SAML and OIDC are no longer an Enterprise extra. Connect Okta, Entra ID or Google in a few minutes.' },
  { version: '2.8', date: 'Aug 30, 2026', title: 'Dark mode', body: 'Follows your system setting, or set it per workspace. Charts pick colours that keep their contrast in both.' },
];

function Heading({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') ? <em key={i} className="italic">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>;
}

function Stamp({ version, accent, latest }: { version: string; accent: string; latest: boolean }) {
  const [d, setD] = useState<string | null>(null);
  useEffect(() => setD(rosette(seedOf(version), 100)[0].d), [version]);
  return (
    <div className="relative size-16 rounded-full bg-background p-0.5">
      {d && (
        <ScrollDraw easing="linear" trigger={scrollWindow()} className="size-full" aria-hidden>
          <svg viewBox="0 0 100 100" className="size-full" fill="none" stroke={latest ? accent : 'currentColor'} strokeWidth="1.25" strokeLinejoin="round">
            <path d={d} />
          </svg>
        </ScrollDraw>
      )}
    </div>
  );
}

export function ChangelogPlotted({
  eyebrow = 'Changelog',
  heading = 'What we *shipped*.',
  releases = DEFAULT_RELEASES,
  accent = '#e0482a',
  className = '',
}: ChangelogPlottedProps) {
  return (
    <section className={`mx-auto max-w-5xl px-6 py-28 sm:px-10 ${className}`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
        <Heading text={heading} />
      </h2>

      <ol className="relative mt-20">
        {/* The rail: a hairline, and the ink that runs down it as you read. */}
        <div aria-hidden className="absolute bottom-8 left-8 top-8 w-px bg-border sm:left-[200px]" />
        <ScrollAnimate aria-hidden props={{ transform: ['scaleY(0)', 'scaleY(1)'] }} trigger={{ start: 'top 60%', end: 'bottom 60%' }} easing="linear" className="absolute bottom-8 left-8 top-8 w-px origin-top sm:left-[200px]">
          <div className="h-full w-px bg-foreground" />
        </ScrollAnimate>

        {releases.map((r, i) => (
          <li key={r.version} className="relative grid grid-cols-[64px_1fr] gap-x-6 pb-20 last:pb-0 sm:grid-cols-[136px_64px_1fr] sm:gap-x-8">
            <div className="hidden pt-5 text-right sm:block">
              <p className="font-mono text-sm">v{r.version}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{r.date}</p>
            </div>
            <Stamp version={r.version} accent={accent} latest={i === 0} />
            <div className="pt-3">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:hidden">v{r.version} · {r.date}</p>
              <h3 className="font-serif text-[1.9rem] leading-tight tracking-[-0.02em]">{r.title}</h3>
              <p className="mt-3 max-w-xl text-pretty text-[17px] leading-relaxed text-muted-foreground">{r.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
