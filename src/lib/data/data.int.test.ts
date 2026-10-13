import config from '@payload-config'
import { getPayload, type Payload, type RequiredDataFromCollectionSlug } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { resetDatabase } from '@/test/resetDatabase'

import {
  getAboutPageData,
  getHomePageData,
  getItemSlugs,
  getMenuItemPageData,
  getMenuPageData,
  getSite,
} from '.'

const DD_STORE = 'https://www.doordash.com/store/albeik-test-1/'
const ctx = { disableRevalidate: true }

// `slug` is required in the generated types but filled in by the slug field's
// hook; leaving it out here also exercises that hook against the database.
const withoutSlug = <S extends 'categories' | 'menu-items'>(data: object) =>
  data as RequiredDataFromCollectionSlug<S>

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
  await resetDatabase(payload)

  const specials = await payload.create({
    collection: 'categories',
    data: withoutSlug<'categories'>({ name: 'Specials', sortOrder: 0 }),
    context: ctx,
  })
  const sandwiches = await payload.create({
    collection: 'categories',
    data: withoutSlug<'categories'>({ name: 'Sandwiches', sortOrder: 1 }),
    context: ctx,
  })
  await payload.create({
    collection: 'categories',
    data: withoutSlug<'categories'>({ name: 'Drinks', sortOrder: 2 }),
    context: ctx,
  })

  const published = (name: string, category: number, extra: object = {}) =>
    payload.create({
      collection: 'menu-items',
      data: withoutSlug<'menu-items'>({ name, category, _status: 'published', ...extra }),
      context: ctx,
    })

  const burger = await published('Smashed Burger', specials.id)
  const kafta = await published('Kafta Sandwich', sandwiches.id, { sortOrder: 1 })
  await published('Tawouk Sandwich', sandwiches.id, { sortOrder: 0 })
  const retired = await published('Retired Wrap', sandwiches.id, { available: false })
  const secret = await payload.create({
    collection: 'menu-items',
    data: { name: 'Secret Draft', category: sandwiches.id, _status: 'draft' },
    draft: true,
    context: ctx,
  })

  // A pending edit on a published item must not leak.
  await payload.update({
    collection: 'menu-items',
    id: kafta.id,
    data: { name: 'Kafta DRAFT EDIT' },
    draft: true,
    context: ctx,
  })

  await payload.updateGlobal({
    slug: 'site-settings',
    data: { siteName: 'AlBeik', doordashStoreUrl: DD_STORE, locations: [{ name: 'Kansas City' }] },
    context: ctx,
  })

  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      hero: { headline: 'The recipe is *Lebanese*.' },
      featuredItems: [kafta.id, secret.id, retired.id, burger.id],
      _status: 'published',
    },
    context: ctx,
  })
  await payload.updateGlobal({
    slug: 'homepage',
    data: { hero: { headline: 'DRAFT headline' } },
    draft: true,
    context: ctx,
  })

  await payload.create({
    collection: 'testimonials',
    data: { name: 'Clara B.', quote: ' Best in KC. ', featured: true },
    context: ctx,
  })
  await payload.create({
    collection: 'testimonials',
    data: { name: 'Not Featured', quote: 'Hidden.', featured: false },
    context: ctx,
  })
  await payload.updateGlobal({
    slug: 'about',
    data: { headline: 'Rooted in *Flavor*' },
    context: ctx,
  })
})

describe('getMenuPageData', () => {
  it('lists published, available items under non-empty categories in menu order', async () => {
    const { categories } = await getMenuPageData({ draft: false })
    expect(categories.map((c) => [c.name, c.items.map((i) => i.name)])).toEqual([
      ['Specials', ['Smashed Burger']],
      ['Sandwiches', ['Tawouk Sandwich', 'Kafta Sandwich']],
    ])
  })

  it('shows pending edits only in draft mode', async () => {
    const { categories } = await getMenuPageData({ draft: true })
    const names = categories.flatMap((c) => c.items.map((i) => i.name))
    expect(names).toContain('Kafta DRAFT EDIT')
    expect(names).not.toContain('Retired Wrap')
  })

  it('falls back to the store order link', async () => {
    const { categories } = await getMenuPageData({ draft: false })
    expect(categories[0]?.items[0]?.orderLinks).toEqual([
      { platform: 'doordash', label: 'DoorDash', href: DD_STORE, level: 'store' },
    ])
  })
})

describe('getMenuItemPageData', () => {
  it('returns a published item', async () => {
    const data = await getMenuItemPageData('kafta-sandwich', { draft: false })
    expect(data?.item.name).toBe('Kafta Sandwich')
  })

  it('returns null for drafts, unavailable items and unknown slugs', async () => {
    expect(await getMenuItemPageData('secret-draft', { draft: false })).toBeNull()
    expect(await getMenuItemPageData('retired-wrap', { draft: false })).toBeNull()
    expect(await getMenuItemPageData('nope', { draft: false })).toBeNull()
  })
})

describe('getItemSlugs', () => {
  it('lists only the slugs the public can see', async () => {
    const slugs = (await getItemSlugs()).map((s) => s.slug).sort()
    expect(slugs).toEqual(['kafta-sandwich', 'smashed-burger', 'tawouk-sandwich'])
  })
})

describe('getHomePageData', () => {
  it('serves the published version, featured items in editor order without hidden ones', async () => {
    const home = await getHomePageData({ draft: false })
    expect(home.hero.headline.text).toBe('The recipe is Lebanese.')
    expect(home.featured.map((i) => i.name)).toEqual(['Kafta Sandwich', 'Smashed Burger'])
    expect(home.testimonials.map((t) => [t.name, t.quote])).toEqual([['Clara B.', 'Best in KC.']])
  })

  it('serves the draft in draft mode', async () => {
    const home = await getHomePageData({ draft: true })
    expect(home.hero.headline.text).toBe('DRAFT headline')
  })
})

describe('getSite and getAboutPageData', () => {
  it('maps site settings', async () => {
    const site = await getSite()
    expect(site.storeOrderLinks).toHaveLength(1)
    expect(site.locations.map((l) => l.name)).toEqual(['Kansas City'])
  })

  it('maps the about page', async () => {
    const about = await getAboutPageData()
    expect(about.headline.text).toBe('Rooted in Flavor')
  })
})
