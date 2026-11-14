import Link from 'next/link';
import { REPO, LIB } from '@/lib/site';
import { ThemeToggle } from './theme-toggle';
import { FooterPlotted } from '@/registry/blocks/footer-plotted';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6 font-mono text-[12px] sm:px-10">
        <Link href="/" className="flex items-center gap-2 tracking-tight">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M3 17C6 6 10 6 12 12S18 18 21 7" />
          </svg>
          scrollfx
        </Link>
        <nav className="hidden items-center gap-7 uppercase tracking-[0.16em] text-muted-foreground sm:flex">
          <Link href="/#plates" className="hover:text-foreground">Plates</Link>
          <a href={`${LIB}/docs`} className="hover:text-foreground">Library</a>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a href={REPO} className="inline-flex h-9 items-center rounded-full px-3 uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/**
 * The site's footer is the footer-plotted block itself, carrying the colophon:
 * what the plates are drawn with, and where everything lives.
 */
export function Footer() {
  return (
    <FooterPlotted
      className="mt-24"
      brand="scrollfx"
      note={
        <>
          Every plate in this folio is drawn by <a href={LIB} className="text-foreground underline underline-offset-4">svg-scroll-draw</a>, a
          scroll animation library with no dependencies: <code className="whitespace-nowrap font-mono text-[13px]">npm i svg-scroll-draw</code>
        </>
      }
      columns={[
        { title: 'Folio', links: [{ label: 'Plates', href: '/#plates' }, { label: 'Registry', href: '/r/registry.json' }, { label: 'Source', href: REPO }] },
        { title: 'Library', links: [{ label: 'svg-scroll-draw', href: LIB }, { label: 'Docs', href: `${LIB}/docs` }, { label: 'npm', href: 'https://www.npmjs.com/package/svg-scroll-draw' }] },
        { title: 'Colophon', links: [{ label: 'Set in Fraunces', href: 'https://fonts.google.com/specimen/Fraunces' }, { label: 'and Geist', href: 'https://vercel.com/font' }, { label: 'MIT licence', href: `${REPO}/blob/main/LICENSE` }] },
      ]}
      legal="MIT · Drawings generated from fixed seeds"
    />
  );
}
