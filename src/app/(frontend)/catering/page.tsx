import type { Metadata } from 'next'

import { getCateringPageData, getSite } from '@/lib/data'
import { pageMetadata } from '@/lib/seo/metadata'
import { copy } from '@/theme/copy'
import { CateringView } from '@/views/CateringView'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return pageMetadata(site, {
    absoluteTitle: copy.seo.cateringTitle(site.name),
    description: copy.seo.cateringDescription(site.name),
    path: '/catering',
  })
}

export default async function CateringPage() {
  const [site, data] = await Promise.all([getSite(), getCateringPageData()])
  return <CateringView {...data} location={site.locations[0] ?? null} />
}
