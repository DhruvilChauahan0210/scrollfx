import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Header, Footer } from '@/components/site/header';
import { BLOCKS } from '@/lib/blocks';
import { LIB } from '@/lib/site';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
          <p className="text-sm font-medium text-muted-foreground">For React, Tailwind and shadcn/ui</p>
          <h1 className="mt-3 max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl">Sections that move with the reader.</h1>
          <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
            Production-ready, scroll-driven sections: heroes, timelines, pricing, product tours. Add one with the shadcn CLI and it takes on your theme.
            The motion runs on the browser&apos;s own scroll timeline where it can, through <a href={LIB} className="font-medium text-foreground underline underline-offset-4">svg-scroll-draw</a>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#blocks" className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90">Browse blocks</a>
            <a href={`${LIB}/docs`} className="inline-flex h-10 items-center rounded-md border px-5 text-sm font-medium hover:bg-accent">Library docs</a>
          </div>
        </section>

        <section id="blocks" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-24">
          <div className="grid gap-10">
            {BLOCKS.map((b) => (
              <article key={b.slug} className="group">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{b.name}</h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{b.description}</p>
                  </div>
                  <Link href={`/blocks/${b.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline">
                    Code and install <ArrowRight className="size-4" />
                  </Link>
                </div>
                <div className="h-[560px] overflow-hidden rounded-xl border bg-background">
                  <iframe src={`/preview/${b.slug}`} title={`${b.name} preview`} className="size-full" loading="lazy" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{b.motion} Scroll inside the preview.</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
