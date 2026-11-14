import Link from 'next/link';
import { Header, Footer } from '@/components/site/header';
import { BLOCKS } from '@/lib/blocks';
import { installCommand } from '@/lib/site';
import { PREVIEWS } from '@/registry/previews';
import { HeroFlowField } from '@/registry/blocks/hero-flow-field';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/**
 * The home page is a folio: the sections themselves, live and full width, one
 * plate after another as they would sit on a site. A plate line before each
 * names it and links to its code.
 */
export default function Home() {
  const rest = BLOCKS.filter((b) => b.slug !== 'hero-flow-field');
  return (
    <>
      <Header />
      <main>
        <HeroFlowField
          eyebrow="scrollfx · a folio of sections for React"
          heading="Pages, *plotted* as you read."
          description="Generative sections for React and Tailwind whose drawings ink themselves in, stroke by stroke, as the reader scrolls. Add one with the shadcn CLI; it takes on your theme."
          primary={{ label: 'Browse the plates', href: '#plates' }}
          aside={installCommand('hero-flow-field')}
        />
        <PlateLine n={0} slug="hero-flow-field" name="The hero above" />

        <div id="plates" className="scroll-mt-16">
          {rest.map((b, i) => {
            const Section = PREVIEWS[b.slug];
            return (
              <div key={b.slug} className="pt-16">
                <PlateLine n={i + 1} slug={b.slug} name={b.name} />
                <Section />
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}

function PlateLine({ n, slug, name }: { n: number; slug: string; name: string }) {
  return (
    <div className="mx-auto flex max-w-7xl items-baseline gap-4 px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:px-10">
      <span className="text-foreground">Pl. {ROMAN[n]}</span>
      <span className="hidden sm:inline">{name}</span>
      <span className="h-px flex-1 translate-y-[-3px] bg-border" />
      <Link href={`/blocks/${slug}`} className="group whitespace-nowrap transition-colors hover:text-foreground">
        Code &amp; install <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </div>
  );
}
