import config from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { getAboutPageData, getHomePageData, getMenuPageData, getSite } from '@/lib/data'
import { resetDatabase } from '@/test/resetDatabase'

import { seed } from './seed'

let payload: Payload
const admin = { email: 'seed-test@albeik.local', password: 'seed-test-password' }

const count = async (
  collection: 'menu-items' | 'categories' | 'testimonials' | 'media' | 'users',
) => (await payload.count({ collection })).totalDocs

beforeAll(async () => {
  payload = await getPayload({ config })
  await resetDatabase(payload)
  // A file left on disk by an earlier database (e.g. after `pnpm db:reset`).
  const mediaDir = process.env.PAYLOAD_MEDIA_DIR!
  fs.mkdirSync(mediaDir, { recursive: true })
  fs.copyFileSync(path.resolve('src/seed/images/banner.webp'), path.join(mediaDir, 'banner.webp'))
  await seed(payload, { admin })
  // Running it again must not duplicate anything.
  await seed(payload, { admin })
})

describe('seed', () => {
  it('creates the scraped content exactly once', async () => {
    expect(await count('categories')).toBe(7)
    expect(await count('menu-items')).toBe(18)
    expect(await count('testimonials')).toBe(4)
    expect(await count('media')).toBe(21)
    expect(await count('users')).toBe(1)
  })

  it('keeps the original filenames even when a stale upload is on disk', async () => {
    const { docs } = await payload.find({ collection: 'media', pagination: false, depth: 0 })
    expect(docs.map((d) => d.filename).filter((f) => /-\d+\.\w+$/.test(f ?? ''))).toEqual([])
  })

  it('publishes the menu, hiding the empty categories', async () => {
    const { categories } = await getMenuPageData({ draft: false })
    expect(categories.map((c) => [c.name, c.items.length])).toEqual([
      ['Specials', 2],
      ['Appetizers', 6],
      ['Sandwiches', 10],
    ])
    expect(categories[2]?.items.map((i) => i.name)).toContain('Charbroiled Rib-eye Sandwich')
    expect(categories[0]?.items[0]?.image?.alt).toBe('AlBeik Smashed Burger')
  })

  it('leaves ordering hidden until store links are entered', async () => {
    const { categories } = await getMenuPageData({ draft: false })
    expect(categories.flatMap((c) => c.items.flatMap((i) => i.orderLinks))).toEqual([])
    expect((await getSite()).storeOrderLinks).toEqual([])
  })

  it('publishes the home page with the featured specials and testimonials', async () => {
    const home = await getHomePageData({ draft: false })
    expect(home.hero.headline.text).toBe('The recipe is Lebanese. The extra attitude is ours.')
    expect(home.hero.media?.alt).toMatch(/Mixed grill/)
    expect(home.featured.map((i) => i.name)).toEqual([
      'AlBeik Smashed Burger',
      'AlBeik Chicken Sandwich',
    ])
    expect(home.testimonials).toHaveLength(4)
    expect(home.promo).toBeNull()
  })

  it('converts the about copy to rich text', async () => {
    const about = await getAboutPageData()
    expect(about.headline.text).toBe('Rooted in Flavor, Driven by Purpose')
    expect(JSON.stringify(about.body)).toContain('A taste of home, miles away from Beirut')
    expect(about.images).toHaveLength(1)
  })

  it('records only the facts we have about the location', async () => {
    const site = await getSite()
    expect(site.locations).toEqual([
      expect.objectContaining({ name: 'Kansas City', city: 'Kansas City', phone: null, hours: [] }),
    ])
    expect(site.seo.description).toBe('A taste of home, miles away from Beirut')
  })
})
