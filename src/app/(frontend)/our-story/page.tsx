import type { Metadata } from 'next'

import { getAboutPageData, getSite } from '@/lib/data'
import { pageMetadata } from '@/lib/seo/metadata'
import { copy } from '@/theme/copy'
import { AboutView } from '@/views/AboutView'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return pageMetadata(site, {
    title: copy.seo.storyTitle,
    description: copy.seo.storyDescription(site.name),
    path: '/our-story',
  })
}

export default async function AboutPage() {
  return <AboutView {...await getAboutPageData()} />
}
