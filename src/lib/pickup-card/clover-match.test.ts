import { describe, expect, it } from 'vitest'

import { matchDishes, pricesFromClover } from './clover-match'

const items = [
  { id: 'TAWOUK0000001', name: 'Chicken Tawouk Sandwich', price: 1165 },
  { id: 'TAWOUK0000002', name: 'Chicken Tawouk Sandwich Combo', price: 1724 },
  { id: 'BURGER0000001', name: 'Albeik smashed burger', price: 1165 },
  { id: 'HUMMUS0000001', name: 'Hummus', price: 699 },
]

describe('matchDishes', () => {
  it('links a sandwich and its combo as two options', () => {
    const result = matchDishes([{ id: 1, name: 'Chicken Tawouk Sandwich', hasLinks: false }], items)
    expect(result.linked).toEqual([
      {
        dishId: 1,
        options: [
          { label: 'Sandwich', cloverItemId: 'TAWOUK0000001', priceCents: 1165 },
          { label: 'Combo', cloverItemId: 'TAWOUK0000002', priceCents: 1724 },
        ],
      },
    ])
  })

  it('ignores case and punctuation', () => {
    const result = matchDishes([{ id: 2, name: 'AlBeik Smashed Burger!', hasLinks: false }], items)
    expect(result.linked[0]?.options).toEqual([
      { label: 'Regular', cloverItemId: 'BURGER0000001', priceCents: 1165 },
    ])
  })

  it('lists dishes it cannot find', () => {
    const result = matchDishes([{ id: 3, name: 'Fattoush', hasLinks: false }], items)
    expect(result).toEqual({ linked: [], unmatched: ['Fattoush'] })
  })

  it('leaves dishes that are already linked alone', () => {
    const result = matchDishes([{ id: 4, name: 'Hummus', hasLinks: true }], items)
    expect(result).toEqual({ linked: [], unmatched: [] })
  })
})

describe('pricesFromClover', () => {
  const byId = new Map(items.map((item) => [item.id, item]))

  it('sets the price from the first option and the combo price from the Combo option', () => {
    expect(
      pricesFromClover(
        [
          { label: 'Sandwich', cloverItemId: 'TAWOUK0000001' },
          { label: 'Combo', cloverItemId: 'TAWOUK0000002' },
        ],
        byId,
      ),
    ).toEqual({ price: 11.65, comboPrice: 17.24 })
  })

  it('changes nothing for an option Clover no longer has', () => {
    expect(pricesFromClover([{ label: 'Regular', cloverItemId: 'GONE000000001' }], byId)).toEqual({})
  })
})
