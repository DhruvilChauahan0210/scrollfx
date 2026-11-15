import type { MetadataRoute } from 'next';
import { BLOCKS } from '@/lib/blocks';
import { SITE_URL } from '@/lib/site';

/**
 * Every page a reader can land on: the folio, and each block's page, read
 * from registry.json, so a new plate is listed the moment it is registered.
 * The previews are iframes inside the block pages and are left out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    ...BLOCKS.map((b) => ({ url: `${SITE_URL}/blocks/${b.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ];
}
