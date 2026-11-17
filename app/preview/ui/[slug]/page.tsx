import { notFound } from 'next/navigation';
import { EXAMPLES } from '@/registry/examples';

/*
 * A test harness for the components (registry:ui): every example of one
 * component, stacked, with room to scroll each in and past. scripts/check.mjs
 * loads it for every component. The component docs pages show the same
 * examples; this route can go once they are checked instead.
 */

export function generateStaticParams() {
  return Object.keys(EXAMPLES).map((slug) => ({ slug }));
}

export const metadata = { robots: { index: false } };

export default async function UiPreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const examples = EXAMPLES[slug];
  if (!examples) notFound();
  return (
    <main className="mx-auto max-w-5xl px-6 sm:px-10">
      <div className="flex h-[38vh] items-end pb-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">↓ {slug}: scroll to draw</div>
      {examples.map(({ name, title, description, Component }) => (
        <section key={name} id={name} className="border-t py-[22vh]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
          {description && <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">{description}</p>}
          <div className="mt-12">
            <Component />
          </div>
        </section>
      ))}
      <div className="h-[100vh]" />
    </main>
  );
}
