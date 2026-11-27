import { describe, expect, it } from 'vitest'

import type { CardModifierGroup, CardOption } from '@/lib/pickup-card/types'

import { chosenModifiers, firstMissing, startingPicks, togglePick, unitPrice } from './choices'

const side: CardModifierGroup = {
  id: 'side',
  name: 'Side',
  min: 1,
  max: 1,
  modifiers: [
    { id: 'fries', name: 'Fries', priceCents: 0 },
    { id: 'salad', name: 'Salad', priceCents: 100 },
  ],
}
const extras: CardModifierGroup = {
  id: 'extras',
  name: 'Extras',
  min: 0,
  max: 2,
  modifiers: [
    { id: 'sauce', name: 'Extra sauce', priceCents: 75 },
    { id: 'cheese', name: 'Cheese', priceCents: 50 },
    { id: 'pickles', name: 'Pickles', priceCents: 25 },
  ],
}
const bread: CardModifierGroup = {
  id: 'bread',
  name: 'Bread',
  min: 1,
  max: 1,
  modifiers: [{ id: 'saj', name: 'Saj', priceCents: 0 }],
}
const option = (groups: CardModifierGroup[]): CardOption => ({
  id: 'A',
  label: 'Combo',
  name: 'Tawouk Combo',
  priceCents: 1724,
  available: true,
  groups,
})

describe('the Add sheet choices', () => {
  it('pre-picks a required choice that has only one answer, nothing else', () => {
    expect(startingPicks(option([side, extras, bread]))).toEqual({ bread: ['saj'] })
  })

  it('swaps a single choice, and toggles extras up to their limit', () => {
    let picks = togglePick({}, side, 'fries')
    picks = togglePick(picks, side, 'salad')
    expect(picks.side).toEqual(['salad'])
    picks = togglePick(picks, extras, 'sauce')
    picks = togglePick(picks, extras, 'cheese')
    picks = togglePick(picks, extras, 'pickles')
    expect(picks.extras).toEqual(['sauce', 'cheese'])
    expect(togglePick(picks, extras, 'sauce').extras).toEqual(['cheese'])
  })

  it('keeps a required single choice picked when tapped again', () => {
    expect(togglePick({ side: ['fries'] }, side, 'fries').side).toEqual(['fries'])
  })

  it('names the first required group still missing', () => {
    expect(firstMissing(option([extras, side]), {})?.id).toBe('side')
    expect(firstMissing(option([extras, side]), { side: ['fries'] })).toBeNull()
  })

  it('prices one unit with its extras', () => {
    const o = option([side, extras])
    const picks = { side: ['salad'], extras: ['sauce'] }
    expect(chosenModifiers(o, picks).map((m) => m.id)).toEqual(['salad', 'sauce'])
    expect(unitPrice(o, picks)).toBe(1724 + 100 + 75)
  })
})
