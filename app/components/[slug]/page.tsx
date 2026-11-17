import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Header, Footer } from '@/components/site/header';
import { CopyButton } from '@/components/site/copy-button';
import { CodeBlock } from '@/components/site/code-block';
import { ComponentsNav } from '@/components/site/components-nav';
import { ExampleTabs } from '@/components/site/example-tabs';
import { COMPONENTS, getComponent } from '@/lib/components';
import { installCommand } from '@/lib/site';
import { componentApi, componentSource, exampleSources } from '@/lib/source';
import { EXAMPLES } from '@/registry/examples';

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getComponent((await params).slug);
  return c ? { title: c.name, description: c.description } : {};
}

const SHEET = 'rounded-[3px] bg-background shadow-[0_0_0_1px_var(--border),0_18px_40px_-20px_rgba(40,30,10,.28)]';

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComponent(slug);
  if (!c) notFound();
  const examples = EXAMPLES[slug] ?? [];
  const sources = exampleSources(slug);
  const { exportName, props } = componentApi(slug);
  const install = installCommand(slug);
  const usage = exportName ? `import { ${exportName} } from '@/components/scrollfx/${slug}';\n\n<${exportName} />` : null;

  return (
    <>
      <Header />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-12 sm:px-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <ComponentsNav current={slug} />
        </aside>
        <main className="min-w-0">
          <Link href="/components" className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> {c.family}
          </Link>
          <h1 className="mt-8 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-none tracking-[-0.03em]">{c.name}</h1>
          <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">{c.description}</p>

          <div className="mt-10 flex max-w-2xl items-center gap-3 rounded-full border bg-card py-1.5 pl-5 pr-1.5 font-mono text-[13px]">
            <span className="select-none text-muted-foreground">$</span>
            <span className="truncate">{install}</span>
            <CopyButton text={install} className="ml-auto shrink-0" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Adds <code className="font-mono">components/scrollfx/{slug}.tsx</code>
            {c.libs.length ? <> with {c.libs.map((l, i) => <span key={l}>{i ? ' and ' : ''}<code className="font-mono">lib/{l}.ts</code></span>)}</> : null}, and installs svg-scroll-draw.
          </p>

          {examples.map((ex, i) => {
            const code = sources[ex.name];
            return (
              <section key={ex.name} id={ex.name} className="mt-16 scroll-mt-20">
                <h2 className="font-serif text-2xl tracking-[-0.01em]">{ex.title}</h2>
                {ex.description && <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">{ex.description}</p>}
                <div className="mt-5">
                  <ExampleTabs
                    preview={
                      <div data-example={ex.name} className={`flex min-h-[360px] items-center justify-center px-5 py-12 sm:px-12 ${SHEET}`}>
                        <div className="w-full max-w-3xl"><ex.Component /></div>
                      </div>
                    }
                    code={code ? <CodeBlock code={code} /> : <p className="text-sm text-muted-foreground">Example {i + 1}: see registry/examples/{slug}.tsx.</p>}
                  />
                </div>
              </section>
            );
          })}

          {usage && (
            <section id="usage" className="mt-16 scroll-mt-20">
              <h2 className="font-serif text-2xl tracking-[-0.01em]">Usage</h2>
              <CodeBlock code={usage} className="mt-5" />
            </section>
          )}

          {props.length > 0 && (
            <section id="props" className="mt-16 scroll-mt-20">
              <h2 className="font-serif text-2xl tracking-[-0.01em]">Props</h2>
              <div className="mt-5 overflow-x-auto rounded-[3px] border">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-card font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-normal">Prop</th>
                      <th scope="col" className="px-4 py-3 font-normal">Type</th>
                      <th scope="col" className="px-4 py-3 font-normal">Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {props.map((p) => (
                      <tr key={p.name} className="align-top">
                        <td className="px-4 py-3">
                          <code className="font-mono text-[13px]">{p.name}{p.optional ? '' : '*'}</code>
                          {p.description && <p className="mt-1 max-w-xs text-pretty text-[13px] leading-relaxed text-muted-foreground">{p.description}</p>}
                        </td>
                        <td className="px-4 py-3"><code className="font-mono text-[12px] text-muted-foreground">{p.type}</code></td>
                        <td className="px-4 py-3"><code className="font-mono text-[12px] text-muted-foreground">{p.default ?? '—'}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section id="source" className="mt-16 scroll-mt-20">
            <h2 className="font-serif text-2xl tracking-[-0.01em]">Source</h2>
            <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">What the CLI adds to your project, to change as you like.</p>
            <CodeBlock code={componentSource(slug)} className="mt-5" />
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
