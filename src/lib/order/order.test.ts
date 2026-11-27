import { describe, expect, it } from 'vitest'

import { isAllowedOrderUrl, linkForMode, linksForMode, resolveOrderLinks, toOrderAction } from '.'

const DD_ITEM = 'https://www.doordash.com/store/albeik-kansas-city-123/?itemId=456'
const DD_STORE = 'https://www.doordash.com/store/albeik-kansas-city-123/'
const UE_ITEM = 'https://www.ubereats.com/store/albeik/abc?mod=quickView&modctx=item-789'
const UE_STORE = 'https://www.ubereats.com/store/albeik/abc'
const CLOVER = 'https://demo-store.cloveronline.com/'

describe('isAllowedOrderUrl', () => {
  it('accepts https DoorDash URLs on the apex and www hosts', () => {
    expect(isAllowedOrderUrl('doordash', DD_STORE)).toBe(true)
    expect(isAllowedOrderUrl('doordash', 'https://doordash.com/store/x')).toBe(true)
  })

  it('accepts DoorDash share short links', () => {
    expect(isAllowedOrderUrl('doordash', 'https://drd.sh/AbC123')).toBe(true)
  })

  it('accepts https Uber Eats URLs', () => {
    expect(isAllowedOrderUrl('ubereats', UE_STORE)).toBe(true)
  })

  it('rejects plain http', () => {
    expect(isAllowedOrderUrl('doordash', 'http://www.doordash.com/store/x')).toBe(false)
  })

  it('rejects look-alike hosts', () => {
    expect(isAllowedOrderUrl('doordash', 'https://doordash.com.evil.example/store')).toBe(false)
    expect(isAllowedOrderUrl('doordash', 'https://evildoordash.com/store')).toBe(false)
  })

  it("rejects another platform's URL", () => {
    expect(isAllowedOrderUrl('doordash', UE_STORE)).toBe(false)
    expect(isAllowedOrderUrl('ubereats', DD_STORE)).toBe(false)
  })

  it('rejects empty, missing, and malformed values', () => {
    expect(isAllowedOrderUrl('doordash', '')).toBe(false)
    expect(isAllowedOrderUrl('doordash', null)).toBe(false)
    expect(isAllowedOrderUrl('doordash', undefined)).toBe(false)
    expect(isAllowedOrderUrl('doordash', 'doordash.com/store/x')).toBe(false)
  })

  it('tolerates surrounding whitespace pasted into the CMS', () => {
    expect(isAllowedOrderUrl('doordash', `  ${DD_STORE}  `)).toBe(true)
  })
})

describe('resolveOrderLinks', () => {
  const store = { doordashStoreUrl: DD_STORE, uberEatsStoreUrl: UE_STORE }

  it('prefers the item link for each platform', () => {
    const links = resolveOrderLinks({ doordashUrl: DD_ITEM, uberEatsUrl: UE_ITEM }, store)
    expect(links).toEqual([
      { platform: 'doordash', label: 'DoorDash', href: DD_ITEM, level: 'item' },
      { platform: 'ubereats', label: 'Uber Eats', href: UE_ITEM, level: 'item' },
    ])
  })

  it('falls back to the store link when the item link is missing', () => {
    const links = resolveOrderLinks({ doordashUrl: DD_ITEM, uberEatsUrl: null }, store)
    expect(links).toEqual([
      { platform: 'doordash', label: 'DoorDash', href: DD_ITEM, level: 'item' },
      { platform: 'ubereats', label: 'Uber Eats', href: UE_STORE, level: 'store' },
    ])
  })

  it('falls back to the store link when the item link is invalid', () => {
    const links = resolveOrderLinks({ doordashUrl: 'http://doordash.com/x' }, store)
    expect(links[0]).toEqual({
      platform: 'doordash',
      label: 'DoorDash',
      href: DD_STORE,
      level: 'store',
    })
  })

  it('hides a platform that has neither an item nor a store link', () => {
    const links = resolveOrderLinks({ uberEatsUrl: UE_ITEM }, { doordashStoreUrl: '' })
    expect(links).toEqual([
      { platform: 'ubereats', label: 'Uber Eats', href: UE_ITEM, level: 'item' },
    ])
  })

  it('hides a platform whose store link is invalid', () => {
    const links = resolveOrderLinks(null, {
      doordashStoreUrl: 'https://example.com/fake',
      uberEatsStoreUrl: UE_STORE,
    })
    expect(links.map((l) => l.platform)).toEqual(['ubereats'])
  })

  it('returns no links when nothing is configured', () => {
    expect(resolveOrderLinks({}, {})).toEqual([])
    expect(resolveOrderLinks(null, {})).toEqual([])
  })

  it('returns store-level links when there is no item (site-wide CTA)', () => {
    expect(resolveOrderLinks(null, store).map((l) => l.level)).toEqual(['store', 'store'])
  })

  it('returns trimmed hrefs', () => {
    const [link] = resolveOrderLinks(null, { doordashStoreUrl: ` ${DD_STORE}\n` })
    expect(link?.href).toBe(DD_STORE)
  })
})

describe('toOrderAction', () => {
  const dd = { platform: 'doordash', label: 'DoorDash', href: DD_STORE, level: 'store' } as const
  const ue = { platform: 'ubereats', label: 'Uber Eats', href: UE_STORE, level: 'store' } as const

  it('is none when there are no links', () => {
    expect(toOrderAction([])).toEqual({ kind: 'none' })
  })

  it('links directly when exactly one platform is available', () => {
    expect(toOrderAction([ue])).toEqual({ kind: 'direct', link: ue })
  })

  it('offers a choice when several platforms are available', () => {
    expect(toOrderAction([dd, ue])).toEqual({ kind: 'choose', links: [dd, ue] })
  })
})

describe('Clover pickup', () => {
  it('sends pickup to the full Clover menu and keeps marketplace item links for delivery', () => {
    const links = resolveOrderLinks(
      { uberEatsUrl: UE_ITEM },
      { cloverPickupUrl: CLOVER, doordashStoreUrl: DD_STORE },
    )

    expect(linksForMode(links, 'pickup')).toEqual([
      {
        platform: 'clover',
        label: 'Clover',
        href: CLOVER,
        level: 'store',
        mode: 'pickup',
        preset: true,
      },
    ])
    expect(linksForMode(links, 'delivery').map((link) => link.href)).toEqual([
      DD_STORE,
      `${UE_ITEM}&diningMode=DELIVERY`,
    ])
  })

  it.each([
    undefined,
    '',
    'https://clover.com.example.com/online-ordering/demo',
    'https://demo-store.cloveronline.com.example.com/',
    'https://www.clover.com/dashboard',
  ])(
    'keeps marketplace pickup when the Clover URL is missing or invalid (%s)',
    (cloverPickupUrl) => {
      const links = resolveOrderLinks(null, { cloverPickupUrl, uberEatsStoreUrl: UE_STORE })

      expect(linksForMode(links, 'pickup')).toEqual([
        expect.objectContaining({ platform: 'ubereats', href: `${UE_STORE}?diningMode=PICKUP` }),
      ])
    },
  )

  it.each([
    'https://www.clover.com/online-ordering/demo-store',
    'https://customers.clover.com/online-ordering/?cloverMerchantId=DEMO123',
  ])('supports a Clover-only store without exposing a delivery link (%s)', (url) => {
    const links = resolveOrderLinks(null, { cloverPickupUrl: ` ${url} ` })

    expect(linksForMode(links, 'pickup')).toEqual([expect.objectContaining({ href: url })])
    expect(linksForMode(links, 'delivery')).toEqual([])
  })
})

describe('linkForMode', () => {
  const dd = { platform: 'doordash', label: 'DoorDash', href: DD_STORE, level: 'store' } as const
  const ue = {
    platform: 'ubereats',
    label: 'Uber Eats',
    href: 'https://www.ubereats.com/store/albeik/abc?diningMode=DELIVERY',
    level: 'store',
  } as const

  it('switches Uber Eats to pickup through its diningMode parameter', () => {
    const link = linkForMode(ue, 'pickup')
    expect(new URL(link.href).searchParams.get('diningMode')).toBe('PICKUP')
    expect(link).toMatchObject({ mode: 'pickup', preset: true, platform: 'ubereats' })
  })

  it('sets delivery on Uber Eats links that carry no mode yet', () => {
    const link = linkForMode({ ...ue, href: UE_STORE }, 'delivery')
    expect(new URL(link.href).searchParams.get('diningMode')).toBe('DELIVERY')
  })

  it('keeps the rest of an Uber Eats item link intact', () => {
    const link = linkForMode({ ...ue, href: UE_ITEM, level: 'item' }, 'pickup')
    const url = new URL(link.href)
    expect(url.searchParams.get('mod')).toBe('quickView')
    expect(url.searchParams.get('modctx')).toBe('item-789')
    expect(url.searchParams.get('diningMode')).toBe('PICKUP')
  })

  it('leaves DoorDash links alone: it has no known pickup link', () => {
    expect(linkForMode(dd, 'pickup')).toEqual({ ...dd, mode: 'pickup', preset: false })
  })

  it('counts DoorDash delivery as preset: its store page opens on delivery', () => {
    expect(linkForMode(dd, 'delivery')).toEqual({ ...dd, mode: 'delivery', preset: true })
  })
})

describe('linksForMode with online pickup', () => {
  const links = resolveOrderLinks(null, {
    doordashStoreUrl: DD_STORE,
    uberEatsStoreUrl: UE_STORE,
    cloverPickupUrl: CLOVER,
  })

  it('sends pickup to the website instead of an app', () => {
    expect(linksForMode(links, 'pickup', { online: true })).toEqual([])
  })

  it('keeps the apps for pickup when online pickup is off', () => {
    expect(linksForMode(links, 'pickup', { online: false })).toEqual(linksForMode(links, 'pickup'))
    expect(linksForMode(links, 'pickup')).toHaveLength(1)
  })

  it('leaves delivery alone either way', () => {
    expect(linksForMode(links, 'delivery', { online: true })).toEqual(linksForMode(links, 'delivery'))
  })
})
