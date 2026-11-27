import { afterEach, describe, expect, it, vi } from 'vitest'

import type { MenuItemVM } from '@/lib/data/types'
import { loadCardProducts, quoteCardBasket } from './catalog'
import type { CardConfig } from './config'

const menu: MenuItemVM[] = [
  {
    id: 1,
    slug: 'chicken-tawouk-sandwich',
    name: 'Tawouk',
    description: 'Site description',
    href: '/menu/tawouk',
    image: null,
    price: 1,
    comboPrice: null,
    dealPrice: null,
    sizes: [],
    tags: [],
    category: { name: 'Sandwiches', slug: 'sandwiches' },
    orderLinks: [],
  },
]
const config: CardConfig = {
  mode: 'clover',
  env: 'sandbox',
  merchantId: 'TEST',
  publicKey: 'public',
  privateKey: 'private',
  restToken: 'rest',
  orderTypeId: 'PICKUP',
}
const mapping = JSON.stringify([
  {
    slug: 'chicken-tawouk-sandwich',
    itemId: 'COMBO',
    extras: [{ groupId: 'SAUCES', modifierId: 'GARLIC' }],
  },
])
const line = { optionId: 'COMBO', extraIds: ['GARLIC'], quantity: 2 }
const item = {
  id: 'COMBO',
  name: 'Tawouk Combo',
  price: 1700,
  priceType: 'FIXED',
  available: true,
  autoManage: true,
  itemStock: { quantity: 3 },
  modifierGroups: { elements: [{ id: 'SAUCES' }] },
}
const modifier = { id: 'GARLIC', available: true, price: 50, name: 'Garlic sauce' }
const totals = { subtotal: 3500, totalTaxAmount: 350, total: 3850 }

function mockClover(itemResponse = item, modifierResponse = modifier, checkout = totals) {
  const request = vi.fn(async (url: string, init: RequestInit) => {
    expect(init.cache).toBe('no-store')
    expect(url.startsWith('https://apisandbox.dev.clover.com/v3/merchants/TEST/')).toBe(true)
    if (url.includes('/items?expand=modifierGroups,itemStock')) {
      expect(new URL(url).searchParams.get('filter')).toBe("id in ('COMBO')")
      return Response.json({ elements: [itemResponse] })
    }
    if (url.endsWith('/modifier_groups/SAUCES/modifiers/GARLIC'))
      return Response.json(modifierResponse)
    if (url.endsWith('/atomic_order/checkouts') && init.method === 'POST')
      return Response.json(checkout)
    throw new Error('Unexpected request')
  })
  vi.stubGlobal('fetch', request)
  return request
}
afterEach(() => vi.unstubAllGlobals())

describe('pickup menu sync and pricing', () => {
  it('keeps site descriptions and sends exact Clover inventory and modifier IDs for every unit', async () => {
    const request = mockClover()
    const products = await loadCardProducts(config, menu, mapping)
    expect(products[0]).toMatchObject({
      name: 'Tawouk',
      description: 'Site description',
      options: [
        {
          id: 'COMBO',
          priceCents: 1700,
          stockLimit: 3,
          available: true,
          extras: [{ id: 'GARLIC', priceCents: 50 }],
        },
      ],
    })
    const { quote, orderCart } = await quoteCardBasket(config, products, [
      { ...line, priceCents: 1 },
    ])
    expect(quote).toMatchObject({
      subtotalCents: 3500,
      taxCents: 350,
      totalCents: 3850,
      lines: [{ name: 'Tawouk Combo + Garlic sauce', quantity: 2, unitCents: 1750 }],
    })
    const expectedLine = {
      item: { id: 'COMBO' },
      modifications: [{ modifier: { id: 'GARLIC' }, name: 'Garlic sauce', amount: 50 }],
    }
    expect(orderCart).toEqual({
      orderType: { id: 'PICKUP' },
      lineItems: [expectedLine, expectedLine],
    })
    expect(JSON.parse(String(request.mock.calls.at(-1)?.[1].body))).toEqual({ orderCart })
  })

  it('reloads current prices and taxes and changes the reviewed quote when Clover changes', async () => {
    mockClover()
    const first = await quoteCardBasket(config, await loadCardProducts(config, menu, mapping), [line])
    mockClover({ ...item, price: 1820 }, modifier, {
      subtotal: 3740,
      totalTaxAmount: 374,
      total: 4114,
    })
    const next = await quoteCardBasket(config, await loadCardProducts(config, menu, mapping), [line])
    expect(next.quote.totalCents).toBe(4114)
    expect(next.quote.quoteId).not.toBe(first.quote.quoteId)
  })

  it('refuses unconfirmed totals, sold-out inventory, and unavailable or unassociated extras', async () => {
    mockClover(item, modifier, { ...totals, total: 1 })
    await expect(
      quoteCardBasket(config, await loadCardProducts(config, menu, mapping), [line]),
    ).rejects.toMatchObject({ status: 409 })
    mockClover({ ...item, available: false })
    await expect(
      quoteCardBasket(config, await loadCardProducts(config, menu, mapping), [line]),
    ).rejects.toMatchObject({ status: 409 })
    mockClover(item, { ...modifier, available: false })
    await expect(
      quoteCardBasket(config, await loadCardProducts(config, menu, mapping), [line]),
    ).rejects.toMatchObject({ status: 409 })
    const request = mockClover({ ...item, modifierGroups: { elements: [] } })
    await expect(
      quoteCardBasket(config, await loadCardProducts(config, menu, mapping), [line]),
    ).rejects.toMatchObject({ status: 409 })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('checks stock across differently customized units and rejects duplicate or forged lines', async () => {
    mockClover()
    const products = await loadCardProducts(config, menu, mapping)
    await expect(
      quoteCardBasket(config, products, [line, { ...line, extraIds: [] }]),
    ).rejects.toMatchObject({ status: 409 })
    await expect(quoteCardBasket(config, products, [line, line])).rejects.toMatchObject({
      status: 400,
    })
    await expect(
      quoteCardBasket(config, products, [{ ...line, optionId: 'FAKE' }]),
    ).rejects.toMatchObject({ status: 409 })
    await expect(
      quoteCardBasket(config, products, [{ ...line, quantity: -1 }]),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('supports preview without network and fails closed on a Clover outage or an invalid mapping', async () => {
    const request = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', request)
    const products = await loadCardProducts({ mode: 'preview' }, menu)
    const { quote } = await quoteCardBasket({ mode: 'preview' }, products, [
      {
        optionId: 'demo-chicken-tawouk-sandwich-combo',
        extraIds: ['demo-extra-sauce'],
        quantity: 1,
      },
    ])
    expect(quote).toMatchObject({ subtotalCents: 1799, taxCents: 144, totalCents: 1943 })
    expect(request).not.toHaveBeenCalled()
    await expect(loadCardProducts(config, menu, mapping)).rejects.toMatchObject({ status: 503 })
    await expect(loadCardProducts(config, menu, 'invalid')).rejects.toMatchObject({
      status: 503,
    })
  })
})
