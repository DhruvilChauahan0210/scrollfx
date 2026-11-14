import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Header, Footer } from '@/components/site/header';
import { CopyButton } from '@/components/site/copy-button';
import { BlockTabs } from '@/components/site/block-tabs';
import { BLOCKS, getBlock } from '@/lib/blocks';
import { highlight } from '@/lib/highlight';
import { installCommand } from '@/lib/site';

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const block = getBlock((await params).slug);
  return block ? { title: block.name, description: block.description } : {};
}

export default async function BlockPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const block = getBlock(slug);
  if (!block) notFound();
  const source = readFileSync(join(process.cwd(), 'registry/blocks', `${slug}.tsx`), 'utf8');
  const install = installCommand(slug);
  const html = await highlight(source);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-10">
        <Link href="/#plates" className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All plates
        </Link>
        <h1 className="mt-8 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-none tracking-[-0.03em]">{block.name}</h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">{block.description}</p>

        <div className="mt-10 flex max-w-2xl items-center gap-3 rounded-full border bg-card py-1.5 pl-5 pr-1.5 font-mono text-[13px]">
          <span className="select-none text-muted-foreground">$</span>
          <span className="truncate">{install}</span>
          <CopyButton text={install} className="ml-auto shrink-0" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Adds the component and lib/plotter, and installs svg-scroll-draw. Works in any shadcn/ui project with Tailwind.</p>

        <div className="mt-10">
          <BlockTabs
            slug={slug}
            tall={block.tall}
            preview={<iframe src={`/preview/${slug}`} title={`${block.name} preview`} className="size-full" loading="lazy" />}
            code={
              <div className="relative overflow-hidden rounded-[3px] border bg-card">
                <CopyButton text={source} className="absolute right-2 top-2 bg-background" />
                <div className="max-h-[640px] overflow-auto p-4 text-[13px] leading-relaxed [&_pre]:!m-0" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            }
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
