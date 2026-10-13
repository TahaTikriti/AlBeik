/**
 * Server-side data loaders. Every public page reads content through these
 * functions (Payload Local API, no HTTP). They return view models from
 * `./types` with order links already resolved.
 *
 * Visibility rules live here and in Payload access control:
 * - `draft: false` (normal renders) applies access control, so visitors only
 *   ever get published documents; `draft: true` (draft mode) shows drafts.
 * - Items with `available: false` are never shown.
 */
import config from '@payload-config'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import {
  groupMenu,
  orderByIds,
  toHomePage,
  toImage,
  toMenuItem,
  toRichLine,
  toSite,
  toTestimonial,
} from './mappers'
import type {
  AboutPageData,
  HomePageData,
  ItemPageData,
  LocationPageData,
  MenuItemVM,
  MenuPageData,
  SiteVM,
} from './types'

export type LoadOptions = { draft: boolean }

const SERVER_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)

export const getPayloadClient = () => getPayload({ config })

const getSettings = cache(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1, overrideAccess: false })
})

export const getSite = cache(async (): Promise<SiteVM> => toSite(await getSettings(), SERVER_URL))

async function findItems(where: Where | null, { draft }: LoadOptions): Promise<MenuItemVM[]> {
  const [payload, settings] = await Promise.all([getPayloadClient(), getSettings()])
  const { docs } = await payload.find({
    collection: 'menu-items',
    where: { and: [{ available: { equals: true } }, ...(where ? [where] : [])] },
    sort: ['sortOrder', 'name'],
    depth: 1,
    pagination: false,
    draft,
    overrideAccess: draft,
  })
  const ctx = { store: settings, showPrices: settings.showPrices ?? false }
  return docs.flatMap((doc) => toMenuItem(doc, ctx) ?? [])
}

export async function getMenuPageData(opts: LoadOptions): Promise<MenuPageData> {
  const payload = await getPayloadClient()
  const [{ docs: categories }, items] = await Promise.all([
    payload.find({
      collection: 'categories',
      sort: ['sortOrder', 'name'],
      depth: 1,
      pagination: false,
      joins: false,
      overrideAccess: false,
    }),
    findItems(null, opts),
  ])
  return { categories: groupMenu(categories, items) }
}

export async function getMenuItemPageData(
  slug: string,
  opts: LoadOptions,
): Promise<ItemPageData | null> {
  const [item] = await findItems({ slug: { equals: slug } }, opts)
  return item ? { item } : null
}

/** Published, available item slugs, for generateStaticParams and the sitemap. */
export async function getItemSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'menu-items',
    where: { available: { equals: true } },
    select: { slug: true, updatedAt: true },
    pagination: false,
    overrideAccess: false,
  })
  return docs.map((d) => ({ slug: d.slug, updatedAt: d.updatedAt }))
}

export async function getHomePageData(opts: LoadOptions): Promise<HomePageData> {
  const payload = await getPayloadClient()
  const [home, { docs: testimonials }] = await Promise.all([
    payload.findGlobal({
      slug: 'homepage',
      depth: 1,
      draft: opts.draft,
      overrideAccess: opts.draft,
    }),
    payload.find({
      collection: 'testimonials',
      where: { featured: { equals: true } },
      sort: ['sortOrder', 'createdAt'],
      depth: 1,
      pagination: false,
      overrideAccess: false,
    }),
  ])

  // Re-query featured items so the usual visibility rules apply to them too.
  const ids = (home.featuredItems ?? []).map((ref) => (typeof ref === 'number' ? ref : ref.id))
  const featured = ids.length ? await findItems({ id: { in: ids } }, opts) : []

  return toHomePage(home, orderByIds(featured, ids), testimonials.map(toTestimonial))
}

export async function getAboutPageData(): Promise<AboutPageData> {
  const payload = await getPayloadClient()
  const about = await payload.findGlobal({ slug: 'about', depth: 1, overrideAccess: false })
  return {
    headline: toRichLine(about.headline),
    body: about.body ?? null,
    images: (about.images ?? []).flatMap((row) => toImage(row.image) ?? []),
  }
}

export async function getLocationPageData(): Promise<LocationPageData> {
  return { locations: (await getSite()).locations }
}
