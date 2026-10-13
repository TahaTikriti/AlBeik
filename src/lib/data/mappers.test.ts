import { describe, expect, it } from 'vitest'

import type { Category, Homepage, Media, MenuItem, SiteSetting } from '@/payload-types'

import {
  groupMenu,
  orderByIds,
  toHomePage,
  toImage,
  toLocation,
  toMedia,
  toMenuItem,
  toSite,
} from './mappers'

const stamp = { createdAt: '2026-10-13T00:00:00.000Z', updatedAt: '2026-10-13T00:00:00.000Z' }

const photo: Media = {
  id: 1,
  alt: 'Kafta sandwich',
  url: '/api/media/file/kafta.jpg',
  mimeType: 'image/jpeg',
  width: 540,
  height: 540,
  focalX: 30,
  focalY: 70,
  ...stamp,
}

const sandwiches: Category = { id: 10, name: 'Sandwiches', slug: 'sandwiches', ...stamp }
const specials: Category = { id: 11, name: 'Specials', slug: 'specials', ...stamp }
const drinks: Category = { id: 12, name: 'Drinks', slug: 'drinks', ...stamp }

function item(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 100,
    name: 'Kafta Sandwich',
    slug: 'kafta-sandwich',
    shortDescription: 'Beef kafta in pita.',
    category: sandwiches,
    image: photo,
    price: 12.5,
    tags: ['signature'],
    available: true,
    sortOrder: 0,
    ...stamp,
    ...overrides,
  }
}

const DD_STORE = 'https://www.doordash.com/store/albeik-1/'
const ctx = { store: { doordashStoreUrl: DD_STORE }, showPrices: true }

describe('toImage', () => {
  it('maps a populated image', () => {
    expect(toImage(photo)).toEqual({
      kind: 'image',
      url: '/api/media/file/kafta.jpg',
      alt: 'Kafta sandwich',
      width: 540,
      height: 540,
      mimeType: 'image/jpeg',
      focalX: 30,
      focalY: 70,
    })
  })

  it('centres the focal point when none is set', () => {
    expect(toImage({ ...photo, focalX: null, focalY: undefined })).toMatchObject({
      focalX: 50,
      focalY: 50,
    })
  })

  it('returns null for unpopulated, missing, dimensionless or video media', () => {
    expect(toImage(1)).toBeNull()
    expect(toImage(null)).toBeNull()
    expect(toImage({ ...photo, url: null })).toBeNull()
    expect(toImage({ ...photo, width: null })).toBeNull()
    expect(toImage({ ...photo, mimeType: 'video/mp4' })).toBeNull()
  })
})

describe('toMedia', () => {
  it('maps a video', () => {
    expect(
      toMedia({ ...photo, mimeType: 'video/mp4', url: '/api/media/file/reel.mp4', width: null }),
    ).toEqual({
      kind: 'video',
      url: '/api/media/file/reel.mp4',
      alt: 'Kafta sandwich',
      mimeType: 'video/mp4',
    })
  })

  it('maps an image', () => {
    expect(toMedia(photo)?.kind).toBe('image')
  })
})

describe('toMenuItem', () => {
  it('maps an item with its category, image, price and resolved order links', () => {
    expect(toMenuItem(item(), ctx)).toEqual({
      id: 100,
      slug: 'kafta-sandwich',
      name: 'Kafta Sandwich',
      href: '/menu/kafta-sandwich',
      description: 'Beef kafta in pita.',
      image: toImage(photo),
      price: 12.5,
      tags: ['signature'],
      category: { slug: 'sandwiches', name: 'Sandwiches' },
      orderLinks: [{ platform: 'doordash', label: 'DoorDash', href: DD_STORE, level: 'store' }],
    })
  })

  it('hides the price when prices are switched off', () => {
    expect(toMenuItem(item(), { ...ctx, showPrices: false })?.price).toBeNull()
  })

  it('prefers the item order link over the store link', () => {
    const dd = 'https://www.doordash.com/store/albeik-1/?item=9'
    expect(toMenuItem(item({ doordashUrl: dd }), ctx)?.orderLinks[0]?.level).toBe('item')
  })

  it('normalizes missing optional values', () => {
    const vm = toMenuItem(item({ shortDescription: '', image: null, price: null, tags: null }), ctx)
    expect(vm).toMatchObject({ description: null, image: null, price: null, tags: [] })
  })

  it('returns null when the category is not populated', () => {
    expect(toMenuItem(item({ category: 10 }), ctx)).toBeNull()
  })
})

describe('groupMenu', () => {
  it('puts items under their categories in category order and drops empty categories', () => {
    const a = toMenuItem(item({ id: 1, slug: 'a', category: sandwiches }), ctx)!
    const b = toMenuItem(item({ id: 2, slug: 'b', category: specials }), ctx)!
    const c = toMenuItem(item({ id: 3, slug: 'c', category: sandwiches }), ctx)!

    const menu = groupMenu([specials, sandwiches, drinks], [a, b, c])

    expect(menu.map((cat) => [cat.slug, cat.items.map((i) => i.slug)])).toEqual([
      ['specials', ['b']],
      ['sandwiches', ['a', 'c']],
    ])
  })
})

describe('orderByIds', () => {
  it('keeps the editor’s order and skips missing ids', () => {
    const a = toMenuItem(item({ id: 1, slug: 'a' }), ctx)!
    const b = toMenuItem(item({ id: 2, slug: 'b' }), ctx)!
    expect(orderByIds([a, b], [2, 99, 1]).map((i) => i.slug)).toEqual(['b', 'a'])
  })
})

describe('toLocation', () => {
  it('builds address lines and a tel: link', () => {
    expect(
      toLocation({
        name: 'State Line',
        streetAddress: '123 State Line Rd',
        city: 'Kansas City',
        region: 'MO',
        postalCode: '64114',
        phone: '(816) 555-0100',
        mapUrl: 'https://maps.google.com/?q=albeik',
        hours: [{ days: ['mon'], opens: '11:00', closes: '22:00' }],
      }),
    ).toEqual({
      name: 'State Line',
      addressLines: ['123 State Line Rd', 'Kansas City, MO 64114'],
      streetAddress: '123 State Line Rd',
      city: 'Kansas City',
      region: 'MO',
      postalCode: '64114',
      phone: '(816) 555-0100',
      phoneHref: 'tel:+18165550100',
      mapUrl: 'https://maps.google.com/?q=albeik',
      hours: [{ days: 'Mon', time: '11:00 AM – 10:00 PM' }],
      hoursNote: null,
    })
  })

  it('leaves unknown details out instead of inventing them', () => {
    expect(toLocation({ name: 'Kansas City', city: 'Kansas City' })).toMatchObject({
      addressLines: ['Kansas City'],
      phone: null,
      phoneHref: null,
      mapUrl: null,
      hours: [],
    })
  })
})

describe('toSite', () => {
  const settings: SiteSetting = {
    id: 1,
    siteName: 'AlBeik',
    showPrices: false,
    doordashStoreUrl: DD_STORE,
    uberEatsStoreUrl: 'not a url',
    locations: [{ name: 'Kansas City' }],
    socials: [{ platform: 'instagram', url: 'https://instagram.com/albeik.us' }],
    seo: { defaultDescription: 'Lebanese street food.' },
  }

  it('maps settings, keeping only valid store links', () => {
    const site = toSite(settings, 'https://albeik.us')
    expect(site.storeOrderLinks.map((l) => l.platform)).toEqual(['doordash'])
    expect(site).toMatchObject({
      name: 'AlBeik',
      url: 'https://albeik.us',
      showPrices: false,
      timezone: 'America/Chicago',
      socials: [
        { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/albeik.us' },
      ],
      seo: { description: 'Lebanese street food.', ogImage: null },
    })
    expect(site.locations).toHaveLength(1)
  })
})

describe('toHomePage', () => {
  const home: Homepage = {
    id: 1,
    hero: { headline: 'The recipe is *Lebanese*.', subline: 'A taste of home', media: photo },
    promise: { headline: '', body: '', media: null },
    promo: { enabled: false, text: 'Clock is ticking' },
  }

  it('parses emphasis and drops empty sections', () => {
    const page = toHomePage(home, [], [])
    expect(page.hero.headline).toEqual({
      segments: [
        { text: 'The recipe is ', emphasis: false },
        { text: 'Lebanese', emphasis: true },
        { text: '.', emphasis: false },
      ],
      text: 'The recipe is Lebanese.',
    })
    expect(page.hero.media?.kind).toBe('image')
    expect(page.promise).toBeNull()
    expect(page.promo).toBeNull()
  })

  it('includes the promo only when enabled with text', () => {
    const page = toHomePage(
      { ...home, promo: { enabled: true, text: '*Clock is ticking.*', linkUrl: '/menu' } },
      [],
      [],
    )
    expect(page.promo).toEqual({
      text: {
        segments: [{ text: 'Clock is ticking.', emphasis: true }],
        text: 'Clock is ticking.',
      },
      linkLabel: null,
      linkUrl: '/menu',
      countdownTo: null,
    })
  })
})
