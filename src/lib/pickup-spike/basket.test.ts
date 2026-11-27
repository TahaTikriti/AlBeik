import { describe, expect, it } from 'vitest'

import { quoteBasket, type PickupProduct } from './basket'

const products: PickupProduct[] = [
  {
    slug: 'tawouk',
    name: 'Tawouk sandwich',
    description: null,
    image: null,
    options: [
      { id: 'tawouk', name: 'Tawouk sandwich', priceCents: 1165 },
      { id: 'tawouk:combo', name: 'Tawouk combo', priceCents: 1724 },
    ],
  },
]

describe('pickup checkout quote', () => {
  it('uses server prices even when the browser supplies item prices', () => {
    const quote = quoteBasket(products, [
      { id: 'tawouk:combo', quantity: 2, priceCents: 1 },
      { id: 'tawouk', quantity: 1 },
    ])

    expect(quote?.subtotalCents).toBe(4613)
    expect(quote?.lines[0]).toMatchObject({ priceCents: 1724, quantity: 2 })
  })

  it('rejects unavailable variants, duplicate lines and invalid quantities', () => {
    expect(quoteBasket(products, [{ id: 'tawouk:large', quantity: 1 }])).toBeNull()
    expect(quoteBasket(products, [{ id: 'tawouk', quantity: 1.5 }])).toBeNull()
    expect(
      quoteBasket(products, [
        { id: 'tawouk', quantity: 1 },
        { id: 'tawouk', quantity: 8 },
      ]),
    ).toBeNull()
  })
})
