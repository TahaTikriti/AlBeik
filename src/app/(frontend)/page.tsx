import type { Metadata } from 'next'

import { getHomePageData, getMenuPageData, getSite } from '@/lib/data'
import { loadOptions } from '@/lib/data/draft'
import { pageMetadata } from '@/lib/seo/metadata'
import { copy } from '@/theme/copy'
import { HomeView } from '@/views/HomeView'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  // The description falls back to the site's (Site settings → SEO).
  // No page image: a shared home link shows the brand card, not a dish.
  return pageMetadata(site, { absoluteTitle: copy.seo.homeTitle(site.name), path: '/' })
}

export default async function HomePage() {
  const opts = await loadOptions()
  const [site, data, menu] = await Promise.all([
    getSite(),
    getHomePageData(opts),
    getMenuPageData(opts),
  ])
  const categories = menu.categories.map(({ slug, name, items }) => ({
    slug,
    name,
    count: items.length,
  }))
  return <HomeView {...data} site={site} categories={categories} />
}
