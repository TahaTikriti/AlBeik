import { describe, expect, it } from 'vitest'

import { type BagLine, bagReducer, bagSubtotal, restoreBag } from './bag'

const line = (over: Partial<BagLine> = {}): BagLine => ({
  optionId: 'COMBO',
  modifierIds: ['FRIES'],
  quantity: 1,
  slug: 'chicken-tawouk-sandwich',
  name: 'Chicken Tawouk Sandwich',
  label: 'Combo',
  unitCents: 1724,
  modifierNames: ['Fries'],
  ...over,
})

describe('bagReducer', () => {
  it('merges an identical line into its quantity', () => {
    const state = bagReducer([line()], { type: 'add', line: line({ quantity: 2 }) })
    expect(state).toEqual([line({ quantity: 3 })])
  })

  it('treats the same modifiers in another order as identical', () => {
    const state = bagReducer([line({ modifierIds: ['FRIES', 'GARLIC'] })], {
      type: 'add',
      line: line({ modifierIds: ['GARLIC', 'FRIES'] }),
    })
    expect(state).toHaveLength(1)
  })

  it('keeps the same option with other modifiers as a separate line', () => {
    const state = bagReducer([line()], { type: 'add', line: line({ modifierIds: ['SALAD'] }) })
    expect(state).toHaveLength(2)
  })

  it('caps a line at 20', () => {
    expect(bagReducer([line({ quantity: 19 })], { type: 'add', line: line({ quantity: 5 }) })[0]!.quantity).toBe(20)
    expect(bagReducer([line()], { type: 'quantity', index: 0, quantity: 99 })[0]!.quantity).toBe(20)
  })

  it('removes a line set to zero', () => {
    expect(bagReducer([line()], { type: 'quantity', index: 0, quantity: 0 })).toEqual([])
  })
})

describe('restoreBag', () => {
  it('starts empty from garbage', () => {
    expect(restoreBag('garbage')).toEqual([])
    expect(restoreBag(null)).toEqual([])
    expect(restoreBag('{"a":1}')).toEqual([])
  })

  it('drops malformed lines and keeps good ones', () => {
    const raw = JSON.stringify([line(), { ...line(), modifierIds: [42] }, { ...line(), quantity: 0 }])
    expect(restoreBag(raw)).toEqual([line()])
  })
})

describe('bagSubtotal', () => {
  it('adds unit price times quantity', () => {
    expect(bagSubtotal([line({ quantity: 2 }), line({ unitCents: 500 })])).toBe(3948)
  })
})
