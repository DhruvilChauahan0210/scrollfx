import type { MetadataRoute } from 'next';
import { BLOCKS } from '@/lib/blocks';
import { COMPONENTS } from '@/lib/components';
import { SITE_URL } from '@/lib/site';

/**
 * Every page a reader can land on: the folio, each block's page, and the
 * components with each component's page, read from registry.json, so a new
 * plate or component is listed the moment it is registered.
 * The previews are iframes inside the block pages and are left out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    ...BLOCKS.map((b) => ({ url: `${SITE_URL}/blocks/${b.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${SITE_URL}/components`, changeFrequency: 'weekly', priority: 0.9 },
    ...COMPONENTS.map((c) => ({ url: `${SITE_URL}/components/${c.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
