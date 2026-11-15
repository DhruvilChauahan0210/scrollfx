import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Everything may be crawled except the bare previews, which the block pages frame. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/preview/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
