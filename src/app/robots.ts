import type { MetadataRoute } from 'next'

import { getSite } from '@/lib/data'
import { absoluteUrl } from '@/lib/seo'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite()
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] },
    sitemap: absoluteUrl(site.url, '/sitemap.xml'),
  }
}
