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
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/#blocks" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All blocks
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{block.name}</h1>
        <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{block.description}</p>

        <div className="mt-8 flex max-w-2xl items-center gap-2 rounded-lg border bg-muted/40 py-1.5 pl-4 pr-1.5 font-mono text-sm">
          <span className="select-none text-muted-foreground">$</span>
          <span className="truncate">{install}</span>
          <CopyButton text={install} className="ml-auto shrink-0" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Adds the component and installs svg-scroll-draw. Works in any shadcn/ui project with Tailwind.</p>

        <div className="mt-10">
          <BlockTabs
            slug={slug}
            tall={block.tall}
            preview={<iframe src={`/preview/${slug}`} title={`${block.name} preview`} className="size-full" loading="lazy" />}
            code={
              <div className="relative overflow-hidden rounded-xl border bg-muted/30">
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
