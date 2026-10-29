import type { Metadata } from 'next'

import { getLocationPageData, getSite } from '@/lib/data'
import { pageMetadata } from '@/lib/seo/metadata'
import { copy } from '@/theme/copy'
import { LocationView } from '@/views/LocationView'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  const location = site.locations[0]
  const address = [location?.streetAddress, location?.city].filter(Boolean).join(', ')
  return pageMetadata(site, {
    absoluteTitle: address ? copy.seo.visitTitle(site.name, address) : undefined,
    title: copy.location.title,
    description: copy.seo.visitDescription(site.name),
    path: '/visit',
  })
}

export default async function LocationPage() {
  const [site, data] = await Promise.all([getSite(), getLocationPageData()])
  return <LocationView {...data} orderLinks={site.storeOrderLinks} />
}
