'use client';

import { useState, type ReactNode } from 'react';

/** One example on a component's page: the live preview, or its code. */
export function ExampleTabs({ preview, code }: { preview: ReactNode; code: ReactNode }) {
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
            {t === 'preview' ? 'Preview' : 'Code'}
          </button>
        ))}
      </div>
      <div className={tab === 'preview' ? '' : 'hidden'}>{preview}</div>
      <div className={tab === 'code' ? '' : 'hidden'}>{code}</div>
    </div>
  );
}
