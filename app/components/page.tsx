import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '@/components/site/header';
import { Cover } from '@/components/office/cover';
import { Register } from '@/components/office/register';
import { SheetFor } from '@/components/office/sheet-for';
import { COMPONENTS } from '@/lib/components';
import { REV, sheetNo } from '@/lib/office';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Plotted components for React and Tailwind: line, area, bar, pie, radar and scatter charts, sparklines and more, each inked in by a pen as the reader scrolls. Installed one at a time with the shadcn CLI.',
};

const REGISTER = COMPONENTS.map((c, i) => ({ slug: c.slug, no: sheetNo(i + 1), name: c.name, family: c.family }));

/**
 * The drawing office: every component as a sheet of one set of drawings, in
 * one scroll after a cover, with the drawing register down the side. Each
 * sheet's drawing is plotted as it reaches the middle of the screen.
 */
export default function ComponentsSet() {
  return (
    <>
      <Header />
      <div className="mx-auto grid max-w-[1560px] gap-10 px-4 py-10 sm:px-10 sm:py-14 xl:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-20">
            <Register entries={REGISTER} rev={REV} inSet />
          </div>
        </aside>
        <main className="min-w-0 space-y-14 sm:space-y-20">
          <Cover />
          {COMPONENTS.map((c, i) => (
            <div key={c.slug}>
              <SheetLine no={sheetNo(i + 1)} slug={c.slug} name={c.name} />
              <SheetFor slug={c.slug} heading="h2" initial="scroll" source="link" />
            </div>
          ))}
        </main>
      </div>
      <Footer />
    </>
  );
}

/** The line over each sheet in the set: its number and name, and its own page. */
function SheetLine({ no, slug, name }: { no: string; slug: string; name: string }) {
  return (
    <div className="mb-8 flex items-baseline gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
      <span className="text-foreground">Sh. {no}</span>
      <span className="hidden sm:inline">{name}</span>
      <span className="h-px flex-1 translate-y-[-3px] bg-border" />
      <Link href={`/components/${slug}`} className="group whitespace-nowrap transition-colors hover:text-foreground">
        Open sheet <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </div>
  );
}
