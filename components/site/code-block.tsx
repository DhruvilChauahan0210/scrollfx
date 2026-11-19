import { CopyButton } from './copy-button';
import { highlight } from '@/lib/highlight';

/** Highlighted code on a card, with a copy button, as the block pages show it. */
export async function CodeBlock({ code, lang = 'tsx', className = '' }: { code: string; lang?: 'tsx' | 'vue' | 'svelte' | 'bash'; className?: string }) {
  const html = await highlight(code, lang);
  return (
    <div className={`relative overflow-hidden rounded-[3px] border bg-card ${className}`}>
      <CopyButton text={code} className="absolute right-2 top-2 bg-background" />
      <div className="max-h-[560px] overflow-auto p-4 pr-12 text-[13px] leading-relaxed [&_pre]:!m-0 [&_pre]:!bg-transparent" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
