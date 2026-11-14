import Link from 'next/link';
import { REPO, LIB } from '@/lib/site';
import { ThemeToggle } from './theme-toggle';

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

/** The colophon: what the plates are set in and drawn with. */
export function Footer() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:px-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Colophon</p>
          <p className="mt-6 max-w-2xl text-balance font-serif text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.08] tracking-[-0.02em]">
            Every plate in this folio is drawn by <a href={LIB} className="italic underline decoration-1 underline-offset-[6px] hover:decoration-2">svg-scroll-draw</a>, a scroll animation library with no dependencies.
          </p>
          <div className="mt-8 inline-flex h-11 items-center rounded-full border px-5 font-mono text-[13px] text-muted-foreground">npm i svg-scroll-draw</div>
        </div>
        <div className="flex flex-col justify-end gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:items-end">
          <p>Set in Fraunces and Geist</p>
          <p>Drawings generated from fixed seeds</p>
          <p>
            MIT · <a href={REPO} className="hover:text-foreground">Source on GitHub</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
