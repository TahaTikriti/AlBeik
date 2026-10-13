import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getItemSlugs, getMenuItemPageData, getSite } from '@/lib/data'
import { loadOptions } from '@/lib/data/draft'
import { pageMetadata } from '@/lib/seo/metadata'
import { ItemView } from '@/views/ItemView'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getItemSlugs()).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [site, data] = await Promise.all([getSite(), getMenuItemPageData(slug, { draft: false })])
  if (!data) return {}
  return pageMetadata(site, {
    title: data.item.name,
    description: data.item.description,
    path: data.item.href,
    image: data.item.image,
  })
}

export default async function MenuItemPage({ params }: Props) {
  const { slug } = await params
  const data = await getMenuItemPageData(slug, await loadOptions())
  if (!data) notFound()
  return <ItemView {...data} />
}
