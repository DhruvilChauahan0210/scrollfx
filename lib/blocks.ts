/** Every block on the site and in the registry, in display order. */
export interface Block {
  slug: string;
  name: string;
  description: string;
  /** What the reader does to see it move. */
  motion: string;
  /** Full-viewport blocks (pins, sticky stages) preview taller. */
  tall?: boolean;
}

export const BLOCKS: Block[] = [
  {
    slug: 'hero-tilt',
    name: 'Hero, tilted screenshot',
    description: 'A hero whose key phrase underlines itself, over a product screenshot that tilts back and straightens as you scroll.',
    motion: 'Scroll down: the screenshot straightens.',
  },
  {
    slug: 'changelog-timeline',
    name: 'Changelog timeline',
    description: 'Releases on a vertical rail. The rail draws down as you read, and each release lights up when the line reaches it.',
    motion: 'Scroll through: the line follows you down.',
    tall: true,
  },
  {
    slug: 'pricing-count',
    name: 'Pricing, counted in',
    description: 'Three plans. Prices count up as the section arrives and every checkmark draws itself in, row after row.',
    motion: 'Scroll to it: prices count, checks draw.',
  },
];

export const getBlock = (slug: string) => BLOCKS.find((b) => b.slug === slug);
