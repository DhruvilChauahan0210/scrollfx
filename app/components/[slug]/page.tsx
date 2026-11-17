import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/site/header';
import { Register } from '@/components/office/register';
import { SheetFor } from '@/components/office/sheet-for';
import { COMPONENTS, getComponent } from '@/lib/components';
import { REV, TOTAL, sheetNo } from '@/lib/office';

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getComponent((await params).slug);
  return c ? { title: c.name, description: c.description } : {};
}

const REGISTER = COMPONENTS.map((c, i) => ({ slug: c.slug, no: sheetNo(i + 1), name: c.name, family: c.family }));

/**
 * One sheet of the set on its own page: the deep link to a component. The
 * pen plots the drawing as the page opens; the register and the sheets either
 * side are a click away.
 */
export default async function ComponentSheet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComponent(slug);
  if (!c) notFound();
  const i = COMPONENTS.findIndex((x) => x.slug === slug);
  const prev = COMPONENTS[i - 1];
  const next = COMPONENTS[i + 1];
  return (
    <>
      <Header />
      <div className="mx-auto grid max-w-[1560px] gap-10 px-4 py-8 sm:px-10 sm:py-10 xl:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-20">
            <Register entries={REGISTER} rev={REV} current={slug} />
          </div>
        </aside>
        <main className="min-w-0">
          <nav aria-label="Sheets" className="mb-8 flex items-baseline gap-3 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <Link href="/components" className="hover:text-foreground">Set<span className="hidden sm:inline"> of drawings</span></Link>
            <span aria-hidden>/</span>
            <span className="text-foreground">Sh. {sheetNo(i + 1)} of {sheetNo(TOTAL)}</span>
            <span className="h-px flex-1 translate-y-[-3px] bg-border" />
            <span className="flex gap-4"><SheetLink to={prev} n={i} dir="prev" compact /><SheetLink to={next} n={i + 2} dir="next" compact /></span>
          </nav>
          <SheetFor slug={slug} heading="h1" initial="view" source="fold" />
          <nav aria-label="Sheets either side" className="mt-8 grid grid-cols-2 gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <div>{prev && <SheetLink to={prev} n={i} dir="prev" />}</div>
            <div className="text-right">{next && <SheetLink to={next} n={i + 2} dir="next" />}</div>
          </nav>
        </main>
      </div>
      <Footer />
    </>
  );
}

function SheetLink({ to, n, dir, compact }: { to?: { slug: string; name: string }; n: number; dir: 'prev' | 'next'; compact?: boolean }) {
  if (!to) return compact ? <span className="opacity-40">{dir === 'prev' ? '← Prev' : 'Next →'}</span> : null;
  return (
    <Link href={`/components/${to.slug}`} rel={dir} className="group inline-flex items-baseline gap-2 whitespace-nowrap transition-colors hover:text-foreground">
      {dir === 'prev' && <span aria-hidden className="inline-block transition-transform group-hover:-translate-x-0.5">←</span>}
      {compact ? (dir === 'prev' ? 'Prev' : 'Next') : <>Sh. {sheetNo(n)} <span className="normal-case tracking-normal text-foreground">{to.name}</span></>}
      {dir === 'next' && <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">→</span>}
    </Link>
  );
}
