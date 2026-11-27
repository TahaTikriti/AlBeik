import { describe, expect, it } from 'vitest'

import type { MenuItem, SiteSetting } from '@/payload-types'

import { toMenuItem, toSite } from './mappers'

const doc = {
  id: 7,
  name: 'Chicken Tawouk Sandwich',
  slug: 'chicken-tawouk-sandwich',
  category: { id: 1, name: 'Sandwiches', slug: 'sandwiches' },
  price: 11.65,
  comboPrice: 17.24,
  dealPrice: 9.99,
  pickupOptions: [
    { label: 'Sandwich', cloverItemId: 'ABCDEFGHJKMN1' },
    { label: 'Combo', cloverItemId: 'ABCDEFGHJKMN2' },
  ],
} as unknown as MenuItem
const store = {}

describe('dish view model with online pickup', () => {
  it('has no pickup options while online pickup is off', () => {
    expect(toMenuItem(doc, { store, showPrices: true, pickup: false })?.pickup).toBeNull()
  })

  it('carries the Clover options when online pickup is on', () => {
    expect(toMenuItem(doc, { store, showPrices: true, pickup: true })?.pickup).toEqual({
      options: [
        { label: 'Sandwich', cloverItemId: 'ABCDEFGHJKMN1' },
        { label: 'Combo', cloverItemId: 'ABCDEFGHJKMN2' },
      ],
    })
  })

  it('shows the real price on linked dishes even with prices off, and no deal', () => {
    const item = toMenuItem(doc, { store, showPrices: false, pickup: true })
    expect(item).toMatchObject({ price: 11.65, comboPrice: 17.24, dealPrice: null })
  })

  it('leaves unlinked dishes as before', () => {
    const unlinked = { ...doc, pickupOptions: [] } as unknown as MenuItem
    expect(toMenuItem(unlinked, { store, showPrices: false, pickup: true })).toMatchObject({
      price: null,
      dealPrice: null,
      pickup: null,
    })
    expect(toMenuItem(unlinked, { store, showPrices: true, pickup: true })?.dealPrice).toBe(9.99)
  })
})

describe('site view model with online pickup', () => {
  const settings = {
    siteName: 'AlBeik',
    onlinePickup: true,
    prepMinutes: 25,
  } as unknown as SiteSetting

  it('is enabled only when switched on in the admin and configured on the server', () => {
    expect(toSite(settings, 'https://x.test', true).pickup).toEqual({ enabled: true, prepMinutes: 25 })
    expect(toSite(settings, 'https://x.test', false).pickup.enabled).toBe(false)
    expect(
      toSite({ ...settings, onlinePickup: false }, 'https://x.test', true).pickup.enabled,
    ).toBe(false)
  })

  it('defaults prep time to 20 minutes', () => {
    expect(
      toSite({ ...settings, prepMinutes: null } as SiteSetting, 'https://x.test', true).pickup
        .prepMinutes,
    ).toBe(20)
  })
})
