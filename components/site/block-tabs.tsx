'use client';

import { useState, type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';

export function BlockTabs({ slug, tall, preview, code }: { slug: string; tall?: boolean; preview: ReactNode; code: ReactNode }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  return (
    <div>
      <div className="mb-3 flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em]">
        {(['preview', 'code'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`rounded-full px-4 py-2 ${tab === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t}
          </button>
        ))}
        <a href={`/preview/${slug}`} target="_blank" rel="noopener" className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-muted-foreground hover:text-foreground">
          Full screen <ExternalLink className="size-3" />
        </a>
      </div>
      <div className={tab === 'preview' ? '' : 'hidden'}>
        {/* The preview sits on the page like a print: a sheet with a soft drop. */}
        <div className={`overflow-hidden rounded-[3px] bg-background shadow-[0_0_0_1px_var(--border),0_18px_40px_-20px_rgba(40,30,10,.28)] ${tall ? 'h-[760px]' : 'h-[640px]'}`}>{preview}</div>
      </div>
      <div className={tab === 'code' ? '' : 'hidden'}>{code}</div>
    </div>
  );
}
