import type { Metadata } from 'next'

import { getLocationPageData, getSite } from '@/lib/data'
import { pageMetadata } from '@/lib/seo/metadata'
import { copy } from '@/theme/copy'
import { LocationView } from '@/views/LocationView'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getSite(), { title: copy.location.title, path: '/location' })
}

export default async function LocationPage() {
  return <LocationView {...await getLocationPageData()} />
}
