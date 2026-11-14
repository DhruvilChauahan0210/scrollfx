import { notFound } from 'next/navigation';
import { BLOCKS, getBlock } from '@/lib/blocks';
import { PREVIEWS } from '@/registry/previews';

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ slug: b.slug }));
}

/**
 * One block alone on a page, as it would sit on a site: room above and below
 * so a scroll-driven block has somewhere to scroll from and to. The blocks
 * page shows this in an iframe; the hero has nothing above it, as a hero would.
 */
export default async function Preview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const block = getBlock(slug);
  const Component = PREVIEWS[slug];
  if (!block || !Component) notFound();
  return (
    <main>
      {!slug.startsWith('hero-') && <div className="flex h-[60vh] items-end justify-center pb-10 text-sm text-muted-foreground">{block.motion}</div>}
      <Component />
      {/* Room to scroll every block fully past, as the rest of a real page would. */}
      <div className="h-[120vh]" />
    </main>
  );
}
