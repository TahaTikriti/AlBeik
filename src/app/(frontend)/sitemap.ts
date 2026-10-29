import type { MetadataRoute } from 'next'

import { getItemSlugs, getSite } from '@/lib/data'
import { absoluteUrl } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, items] = await Promise.all([getSite(), getItemSlugs()])
  const url = (path: string) => absoluteUrl(site.url, path)
  return [
    { url: url('/') },
    { url: url('/menu') },
    { url: url('/our-story') },
    { url: url('/visit') },
    { url: url('/catering') },
    ...items.map((item) => ({ url: url(`/menu/${item.slug}`), lastModified: item.updatedAt })),
  ]
}
