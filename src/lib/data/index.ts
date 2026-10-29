/**
 * Server-side data loaders. Every public page reads content through these
 * functions. They return view models from `./types` with order links already
 * resolved.
 *
 * Two sources:
 * - DEMO (no DATABASE_URL): the scraped content in src/seed/content.ts. Zero
 *   setup; run or deploy anywhere. See ./demo.ts.
 * - CMS (DATABASE_URL set): Payload's Local API (no HTTP).
 *
 * Visibility rules live here and in Payload access control:
 * - `draft: false` (normal renders) applies access control, so visitors only
 *   ever get published documents; `draft: true` (draft mode) shows drafts.
 * - Items with `available: false` are never shown.
 */
import type { Where } from 'payload'
import { cache } from 'react'

import {
  demoAbout,
  demoCatering,
  demoHome,
  demoItem,
  demoItemSlugs,
  demoMenu,
  demoSite,
} from './demo'
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
  CateringPageData,
  HomePageData,
  ItemPageData,
  LocationPageData,
  MenuItemVM,
  MenuPageData,
  SiteVM,
} from './types'

export type LoadOptions = { draft: boolean }

/** True once a database is configured; until then the site runs on demo data. */
export const cmsEnabled = Boolean(process.env.DATABASE_URL)

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
const SERVER_URL = (
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000')
).replace(/\/$/, '')

/** Payload is only loaded when the CMS is on, so demo mode needs no secret or database. */
export async function getPayloadClient() {
  const [{ getPayload }, { default: config }] = await Promise.all([
    import('payload'),
    import('@payload-config'),
  ])
  return getPayload({ config })
}

const getSettings = cache(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1, overrideAccess: false })
})

export const getSite = cache(async (): Promise<SiteVM> =>
  cmsEnabled ? toSite(await getSettings(), SERVER_URL) : demoSite(SERVER_URL),
)

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
  if (!cmsEnabled) return demoMenu()
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
  if (!cmsEnabled) return demoItem(slug)
  const [item] = await findItems({ slug: { equals: slug } }, opts)
  return item ? { item } : null
}

/** Published, available item slugs, for generateStaticParams and the sitemap. */
export async function getItemSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  if (!cmsEnabled) return demoItemSlugs()
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
  if (!cmsEnabled) return demoHome()
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
  if (!cmsEnabled) return demoAbout()
  const payload = await getPayloadClient()
  const about = await payload.findGlobal({ slug: 'about', depth: 1, overrideAccess: false })
  return {
    headline: toRichLine(about.headline),
    body: about.body ?? null,
    images: (about.images ?? []).flatMap((row) => toImage(row.image) ?? []),
  }
}

// TODO(cms): a Catering collection; the client's catering menu is the
// source in both modes today (src/seed/catering.ts).
export async function getCateringPageData(): Promise<CateringPageData> {
  return demoCatering()
}

export async function getLocationPageData(): Promise<LocationPageData> {
  return { locations: (await getSite()).locations }
}
