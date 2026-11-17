import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '@/components/site/header';
import { FAMILIES, COMPONENTS } from '@/lib/components';
import { EXAMPLES } from '@/registry/examples';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Plotted components for React and Tailwind: line, area, bar, pie, radar and scatter charts, sparklines and more, each inked in by a pen as the reader scrolls. Installed one at a time with the shadcn CLI.',
};

/**
 * Every component, by family, each with its first example running live as a
 * small preview, and a link to its page.
 */
export default function ComponentsIndex() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{COMPONENTS.length} components</p>
        <h1 className="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-none tracking-[-0.03em]">
          Components, <em className="italic">plotted</em>.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
          Smaller pieces than the plates: charts and marks to set inside your own pages. Each takes its data as props, keeps its
          labels in the server HTML, and is inked in by a pen as the reader scrolls, finishing as it reaches the middle of the
          screen. Here they are shown finished; open one to watch it draw. Add one with the shadcn CLI.
        </p>

        {FAMILIES.map((f) => (
          <section key={f.name} className="mt-20" aria-labelledby={`family-${f.name}`}>
            <div className="flex items-baseline gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <h2 id={`family-${f.name}`} className="text-foreground">{f.name}</h2>
              <span className="h-px flex-1 translate-y-[-3px] bg-border" />
              <span>{f.components.length}</span>
            </div>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {f.components.map((c) => {
                const Preview = EXAMPLES[c.slug]?.[0]?.Component;
                return (
                  <li key={c.slug}>
                    <Link href={`/components/${c.slug}`} className="group flex h-full flex-col justify-between rounded-[3px] bg-background shadow-[0_0_0_1px_var(--border)] transition-shadow hover:shadow-[0_0_0_1px_var(--ring),0_18px_40px_-20px_rgba(40,30,10,.28)]">
                      <div className="pointer-events-none flex min-h-[300px] items-center justify-center overflow-hidden px-6 py-8" inert>
                        {Preview ? <div className="still w-full"><Preview /></div> : <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">No preview</span>}
                      </div>
                      <div className="border-t px-6 py-5">
                        <p className="flex items-center justify-between font-serif text-xl tracking-[-0.01em]">
                          {c.name}
                          <span aria-hidden className="font-mono text-[11px] text-muted-foreground transition-transform group-hover:translate-x-0.5">→</span>
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
