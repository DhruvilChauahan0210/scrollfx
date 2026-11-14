import Link from 'next/link';
import { REPO, LIB } from '@/lib/site';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M3 17C6 6 10 6 12 12S18 18 21 7" /></svg>
          scrollfx
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link href="/#blocks" className="hover:text-foreground">Blocks</Link>
          <a href={`${LIB}/docs`} className="hover:text-foreground">Library docs</a>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a href={REPO} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-accent">
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" /></svg>
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground">
        <p>
          MIT. Every block runs on <a href={LIB} className="font-medium text-foreground underline-offset-4 hover:underline">svg-scroll-draw</a>, a zero-dependency scroll animation library.
        </p>
        <a href={REPO} className="underline-offset-4 hover:underline">Source on GitHub</a>
      </div>
    </footer>
  );
}
