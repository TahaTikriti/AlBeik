import { afterEach, describe, expect, it, vi } from 'vitest'

import type { MenuItemVM } from '@/lib/data/types'
import { loadCardProducts, quoteCardBasket } from './catalog'
import type { CardConfig } from './config'
import type { PickupLink } from './types'

const menu: MenuItemVM[] = [
  {
    id: 1,
    slug: 'chicken-tawouk-sandwich',
    name: 'Tawouk',
    description: 'Site description',
    href: '/menu/tawouk',
    image: null,
    price: 11.65,
    comboPrice: 17.24,
    dealPrice: null,
    sizes: [],
    tags: [],
    category: { name: 'Sandwiches', slug: 'sandwiches' },
    orderLinks: [],
    pickup: null,
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
const links: PickupLink[] = [
  { slug: 'chicken-tawouk-sandwich', options: [{ label: 'Combo', cloverItemId: 'COMBO' }] },
]
const item = {
  id: 'COMBO',
  name: 'Tawouk Combo',
  price: 1700,
  priceType: 'FIXED',
  available: true,
  autoManage: true,
  itemStock: { quantity: 3 },
  modifierGroups: { elements: [{ id: 'SIDES' }, { id: 'SAUCES' }] },
}
const groups = [
  {
    id: 'SIDES',
    name: 'Side',
    minRequired: 1,
    maxAllowed: 1,
    modifiers: {
      elements: [
        { id: 'FRIES', name: 'Fries', price: 0, available: true },
        { id: 'SALAD', name: 'Salad', price: 100, available: true },
      ],
    },
  },
  {
    id: 'SAUCES',
    name: 'Sauces',
    minRequired: 0,
    maxAllowed: 0,
    modifiers: {
      elements: [
        { id: 'GARLIC', name: 'Garlic sauce', price: 50, available: true },
        { id: 'HOT', name: 'Hot sauce', price: 50, available: false },
      ],
    },
  },
  {
    id: 'OTHER',
    name: 'Other item extras',
    minRequired: 0,
    maxAllowed: 0,
    modifiers: { elements: [{ id: 'CHEESE', name: 'Cheese', price: 75, available: true }] },
  },
]
const line = { optionId: 'COMBO', modifierIds: ['FRIES', 'GARLIC'], quantity: 2 }
const totals = { subtotal: 3500, totalTaxAmount: 350, total: 3850 }

function mockClover(itemResponse: object = item, checkout = totals) {
  const request = vi.fn(async (url: string, init: RequestInit) => {
    expect(init.cache).toBe('no-store')
    expect(url.startsWith('https://apisandbox.dev.clover.com/v3/merchants/TEST/')).toBe(true)
    if (url.includes('/items?expand=modifierGroups,itemStock')) {
      expect(new URL(url).searchParams.get('filter')).toBe("id in ('COMBO')")
      return Response.json({ elements: [itemResponse] })
    }
    if (url.includes('/modifier_groups?expand=modifiers')) return Response.json({ elements: groups })
    if (url.endsWith('/atomic_order/checkouts') && init.method === 'POST')
      return Response.json(checkout)
    throw new Error('Unexpected request ' + url)
  })
  vi.stubGlobal('fetch', request)
  return request
}
afterEach(() => vi.unstubAllGlobals())

async function products() {
  return loadCardProducts(config, links, menu)
}

describe('pickup menu from Clover', () => {
  it('offers each linked option with its Clover modifier groups and limits', async () => {
    mockClover()
    const [product] = await products()
    expect(product).toMatchObject({ name: 'Tawouk', description: 'Site description' })
    expect(product!.options).toEqual([
      {
        id: 'COMBO',
        label: 'Combo',
        name: 'Tawouk Combo',
        priceCents: 1700,
        available: true,
        stockLimit: 3,
        groups: [
          {
            id: 'SIDES',
            name: 'Side',
            min: 1,
            max: 1,
            modifiers: [
              { id: 'FRIES', name: 'Fries', priceCents: 0 },
              { id: 'SALAD', name: 'Salad', priceCents: 100 },
            ],
          },
          {
            id: 'SAUCES',
            name: 'Sauces',
            min: 0,
            max: null,
            modifiers: [{ id: 'GARLIC', name: 'Garlic sauce', priceCents: 50 }],
          },
        ],
      },
    ])
  })

  it('keeps an item with a required choice on sale', async () => {
    mockClover()
    expect((await products())[0]!.options[0]!.available).toBe(true)
  })

  it('drops dishes whose Clover item is gone', async () => {
    mockClover({ ...item, deleted: true })
    expect(await products()).toEqual([])
  })
})

describe('pickup quote', () => {
  it('prices item plus modifiers and sends each modifier with its Clover price', async () => {
    const request = mockClover()
    const { quote, orderCart } = await quoteCardBasket(config, await products(), [line])
    expect(quote).toMatchObject({
      subtotalCents: 3500,
      taxCents: 350,
      totalCents: 3850,
      lines: [{ name: 'Tawouk Combo + Fries + Garlic sauce', quantity: 2, unitCents: 1750 }],
    })
    const expectedLine = {
      item: { id: 'COMBO' },
      modifications: [
        { modifier: { id: 'FRIES' }, name: 'Fries', amount: 0 },
        { modifier: { id: 'GARLIC' }, name: 'Garlic sauce', amount: 50 },
      ],
    }
    expect(orderCart).toEqual({ orderType: { id: 'PICKUP' }, lineItems: [expectedLine, expectedLine] })
    expect(JSON.parse(String(request.mock.calls.at(-1)?.[1].body))).toEqual({ orderCart })
  })

  it('asks for a missing required choice', async () => {
    mockClover()
    await expect(
      quoteCardBasket(config, await products(), [{ ...line, modifierIds: ['GARLIC'] }]),
    ).rejects.toMatchObject({ status: 409, message: 'Choose side for Combo.' })
  })

  it('refuses two picks in a pick-one group', async () => {
    mockClover()
    await expect(
      quoteCardBasket(config, await products(), [{ ...line, modifierIds: ['FRIES', 'SALAD'] }]),
    ).rejects.toMatchObject({ status: 409 })
  })

  it("refuses another item's modifier and an unavailable one", async () => {
    mockClover()
    const list = await products()
    for (const extra of ['CHEESE', 'HOT']) {
      await expect(
        quoteCardBasket(config, list, [{ ...line, modifierIds: ['FRIES', extra] }]),
      ).rejects.toMatchObject({ status: 409 })
    }
  })

  it('re-quotes when Clover prices change', async () => {
    mockClover()
    const first = await quoteCardBasket(config, await products(), [line])
    mockClover({ ...item, price: 1820 }, { subtotal: 3740, totalTaxAmount: 374, total: 4114 })
    const next = await quoteCardBasket(config, await products(), [line])
    expect(next.quote.totalCents).toBe(4114)
    expect(next.quote.quoteId).not.toBe(first.quote.quoteId)
  })

  it('refuses sold-out items, stock overruns, unconfirmed totals and forged lines', async () => {
    mockClover({ ...item, available: false })
    await expect(quoteCardBasket(config, await products(), [line])).rejects.toMatchObject({
      status: 409,
    })
    mockClover(item, { ...totals, total: 1 })
    await expect(quoteCardBasket(config, await products(), [line])).rejects.toMatchObject({
      status: 409,
    })
    mockClover()
    const list = await products()
    await expect(
      quoteCardBasket(config, list, [line, { ...line, modifierIds: ['SALAD'] }]),
    ).rejects.toMatchObject({ status: 409 })
    await expect(quoteCardBasket(config, list, [line, line])).rejects.toMatchObject({ status: 400 })
    await expect(
      quoteCardBasket(config, list, [{ ...line, optionId: 'FAKE' }]),
    ).rejects.toMatchObject({ status: 409 })
    await expect(quoteCardBasket(config, list, [{ ...line, quantity: -1 }])).rejects.toMatchObject({
      status: 400,
    })
  })

  it('names every line that is no longer on sale, so the bag can drop just those', async () => {
    mockClover()
    const list = await products()
    await expect(
      quoteCardBasket(config, list, [line, { ...line, optionId: 'GONE' }, { ...line, modifierIds: ['FRIES', 'HOT'] }]),
    ).rejects.toMatchObject({ status: 409, code: 'unavailable', detail: { lines: [1, 2] } })
  })

  it('fails closed when Clover is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(products()).rejects.toMatchObject({ status: 503 })
  })
})

describe('preview menu', () => {
  it('uses site prices and a required side, without any network', async () => {
    const request = vi.fn()
    vi.stubGlobal('fetch', request)
    const preview = { mode: 'preview' } as const
    const previewLinks: PickupLink[] = [
      {
        slug: 'chicken-tawouk-sandwich',
        options: [
          { label: 'Sandwich', cloverItemId: 'DEMOSANDWICH1' },
          { label: 'Combo', cloverItemId: 'DEMOCOMBO0001' },
        ],
      },
    ]
    const [product] = await loadCardProducts(preview, previewLinks, menu)
    expect(product!.options.map((o) => [o.label, o.priceCents])).toEqual([
      ['Sandwich', 1165],
      ['Combo', 1724],
    ])
    await expect(
      quoteCardBasket(preview, [product!], [
        { optionId: 'DEMOCOMBO0001', modifierIds: [], quantity: 1 },
      ]),
    ).rejects.toMatchObject({ status: 409 })
    const { quote } = await quoteCardBasket(preview, [product!], [
      { optionId: 'DEMOCOMBO0001', modifierIds: ['demo-side-fries', 'demo-extra-sauce'], quantity: 1 },
    ])
    expect(quote).toMatchObject({ subtotalCents: 1799, taxCents: 144, totalCents: 1943 })
    expect(request).not.toHaveBeenCalled()
  })
})
