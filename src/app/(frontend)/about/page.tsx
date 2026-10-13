import type { Metadata } from 'next'

import { getAboutPageData, getSite } from '@/lib/data'
import { pageMetadata } from '@/lib/seo/metadata'
import { copy } from '@/theme/copy'
import { AboutView } from '@/views/AboutView'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getSite(), { title: copy.about.title, path: '/about' })
}

export default async function AboutPage() {
  return <AboutView {...await getAboutPageData()} />
}
