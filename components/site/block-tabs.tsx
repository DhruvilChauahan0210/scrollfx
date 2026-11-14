'use client';

import { useState, type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';

export function BlockTabs({ slug, tall, preview, code }: { slug: string; tall?: boolean; preview: ReactNode; code: ReactNode }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  return (
    <div>
      <div className="mb-3 flex items-center gap-1">
        {(['preview', 'code'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${tab === t ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t}
          </button>
        ))}
        <a href={`/preview/${slug}`} target="_blank" rel="noopener" className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
          Open full screen <ExternalLink className="size-3.5" />
        </a>
      </div>
      <div className={tab === 'preview' ? '' : 'hidden'}>
        <div className={`overflow-hidden rounded-xl border bg-background ${tall ? 'h-[760px]' : 'h-[640px]'}`}>{preview}</div>
      </div>
      <div className={tab === 'code' ? '' : 'hidden'}>{code}</div>
    </div>
  );
}
