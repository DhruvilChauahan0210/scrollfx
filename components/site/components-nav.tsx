import Link from 'next/link';
import { FAMILIES } from '@/lib/components';

/** The components, by family, down the side of their pages. */
export function ComponentsNav({ current }: { current?: string }) {
  return (
    <nav aria-label="Components" className="sticky top-20 space-y-8 font-mono text-[11px] uppercase tracking-[0.16em]">
      <Link href="/components" className={current ? 'text-muted-foreground hover:text-foreground' : 'text-foreground'}>
        All components
      </Link>
      {FAMILIES.map((f) => (
        <div key={f.name}>
          <p className="text-foreground">{f.name}</p>
          <ul className="mt-3 space-y-2 border-l pl-4">
            {f.components.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/components/${c.slug}`}
                  aria-current={c.slug === current ? 'page' : undefined}
                  className={c.slug === current ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
