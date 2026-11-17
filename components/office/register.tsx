'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export interface RegisterEntry {
  slug: string;
  no: string;
  name: string;
  family: string;
}

/**
 * The drawing register: every sheet in the set, by number, with its title and
 * revision, the one in hand marked. In the set it follows the reading and
 * jumps between sheets; on a sheet's own page it links to the others.
 */
export function Register({ entries, rev, current, inSet }: { entries: RegisterEntry[]; rev: string; current?: string; inSet?: boolean }) {
  const [here, setHere] = useState(current ?? 'cover');

  useEffect(() => {
    if (!inSet) return;
    const sheets = [...document.querySelectorAll<HTMLElement>('article[data-sheet]')];
    // The sheet under the middle of the screen is the one being read.
    const io = new IntersectionObserver(
      (seen) => {
        for (const e of seen) if (e.isIntersecting) setHere((e.target as HTMLElement).dataset.sheet ?? 'cover');
      },
      { rootMargin: '-45% 0px -54% 0px' },
    );
    sheets.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [inSet]);

  const href = (slug: string) => (inSet ? `#${slug}` : slug === 'cover' ? '/components' : `/components/${slug}`);
  const families = [...new Set(entries.map((e) => e.family))];
  const row = (slug: string, no: string, name: string) => {
    const on = slug === here;
    return (
      <li key={slug}>
        <Link
          href={href(slug)}
          aria-current={on ? (inSet ? 'location' : 'page') : undefined}
          className={`group grid grid-cols-[1.6rem_minmax(0,1fr)_auto] items-baseline gap-2 border-t border-[var(--hair)] py-[5px] pl-2 pr-1.5 transition-colors ${on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <span className="relative font-mono text-[10px] tabular-nums">
            {on && <span aria-hidden className="absolute -left-2 top-1/2 h-px w-1.5 -translate-y-1/2 bg-foreground" />}
            {no}
          </span>
          <span className={`truncate text-[12.5px] ${on ? 'font-medium' : ''}`}>{name}</span>
          <span className="font-mono text-[9.5px] tabular-nums opacity-70">{rev}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Drawing register" className="sheet-register border border-[var(--line)] bg-card [--hair:color-mix(in_oklab,var(--foreground)_14%,transparent)] [--line:color-mix(in_oklab,var(--foreground)_60%,transparent)]">
      <div className="flex items-baseline justify-between px-2 pb-2 pt-2.5">
        <p className="drafting text-[9px] text-foreground">Drawing register</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Rev</p>
      </div>
      <ol>
        {row('cover', '00', 'Cover sheet')}
        {families.map((f) => (
          <li key={f}>
            <p className="drafting border-t border-[var(--line)] px-2 pb-1 pt-2.5 text-[8.5px] text-muted-foreground">{f}</p>
            <ol>{entries.filter((e) => e.family === f).map((e) => row(e.slug, e.no, e.name))}</ol>
          </li>
        ))}
      </ol>
    </nav>
  );
}
