import type { MetadataRoute } from 'next'

import { getSite } from '@/lib/data'
import { absoluteUrl } from '@/lib/seo'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite()
  return {
    rules: {
      userAgent: '*',
      // CMS images live under /api; share previews and JSON-LD need them.
      allow: ['/', '/api/media/file/'],
      disallow: ['/admin', '/api/', '/next/'],
    },
    sitemap: absoluteUrl(site.url, '/sitemap.xml'),
  }
}
