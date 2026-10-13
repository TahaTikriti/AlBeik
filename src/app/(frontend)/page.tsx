import type { Metadata } from 'next'

import { getHomePageData, getSite } from '@/lib/data'
import { loadOptions } from '@/lib/data/draft'
import { pageMetadata } from '@/lib/seo/metadata'
import { HomeView } from '@/views/HomeView'

export async function generateMetadata(): Promise<Metadata> {
  const [site, home] = await Promise.all([getSite(), getHomePageData({ draft: false })])
  return pageMetadata(site, {
    absoluteTitle: home.hero.headline.text
      ? `${site.name} · ${home.hero.headline.text}`
      : site.name,
    description: home.hero.subline,
    path: '/',
    image: home.hero.media?.kind === 'image' ? home.hero.media : null,
  })
}

export default async function HomePage() {
  const opts = await loadOptions()
  const [site, data] = await Promise.all([getSite(), getHomePageData(opts)])
  return <HomeView {...data} site={site} />
}
