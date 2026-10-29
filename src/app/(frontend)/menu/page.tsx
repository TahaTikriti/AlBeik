import type { Metadata } from 'next'

import { getMenuPageData, getSite } from '@/lib/data'
import { loadOptions } from '@/lib/data/draft'
import { menuJsonLd } from '@/lib/seo'
import { JsonLd } from '@/lib/seo/JsonLd'
import { pageMetadata } from '@/lib/seo/metadata'
import { copy } from '@/theme/copy'
import { MenuView } from '@/views/MenuView'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return pageMetadata(site, {
    absoluteTitle: copy.seo.menuTitle(site.name),
    description: copy.seo.menuDescription(site.name),
    path: '/menu',
  })
}

export default async function MenuPage() {
  const opts = await loadOptions()
  const [site, data] = await Promise.all([getSite(), getMenuPageData(opts)])
  return (
    <>
      <MenuView {...data} location={site.locations[0] ?? null} />
      <JsonLd data={menuJsonLd(site, data.categories)} />
    </>
  )
}
