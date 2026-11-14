import registry from '@/registry.json';

/** Every block on the site, read from registry.json: one list for the CLI and the site. */
export interface Block {
  slug: string;
  name: string;
  description: string;
  /** What the reader does to see it move. */
  motion: string;
  /** Taller blocks get a taller preview. */
  tall?: boolean;
}

export const BLOCKS: Block[] = registry.items.filter((i) => i.type === 'registry:block').map((i) => ({
  slug: i.name,
  name: i.title,
  description: i.description,
  motion: i.meta!.motion,
  tall: i.meta!.tall,
}));

export const getBlock = (slug: string) => BLOCKS.find((b) => b.slug === slug);
