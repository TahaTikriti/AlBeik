import { describe, expect, it } from 'vitest'

import { formatPrice, parseEmphasis, plainText, slugify } from '.'

describe('parseEmphasis', () => {
  it('splits a highlighted word out of a headline', () => {
    expect(parseEmphasis('The recipe is *Lebanese*.')).toEqual([
      { text: 'The recipe is ', emphasis: false },
      { text: 'Lebanese', emphasis: true },
      { text: '.', emphasis: false },
    ])
  })

  it('returns one plain segment when there is no markup', () => {
    expect(parseEmphasis('Juicier. Meatier. Tastier.')).toEqual([
      { text: 'Juicier. Meatier. Tastier.', emphasis: false },
    ])
  })

  it('handles several highlighted runs, including at the edges', () => {
    expect(parseEmphasis('*100%* Halal, *fresh*')).toEqual([
      { text: '100%', emphasis: true },
      { text: ' Halal, ', emphasis: false },
      { text: 'fresh', emphasis: true },
    ])
  })

  it('keeps an unmatched asterisk as literal text', () => {
    expect(parseEmphasis('Spice *bomb is waiting')).toEqual([
      { text: 'Spice *bomb is waiting', emphasis: false },
    ])
  })

  it('keeps an empty pair as literal text', () => {
    expect(parseEmphasis('a ** b')).toEqual([{ text: 'a ** b', emphasis: false }])
  })

  it('returns nothing for empty input', () => {
    expect(parseEmphasis('')).toEqual([])
    expect(parseEmphasis(null)).toEqual([])
    expect(parseEmphasis(undefined)).toEqual([])
  })
})

describe('plainText', () => {
  it('strips the emphasis markers', () => {
    expect(plainText('100% *Halal*, Fresh & Delicious')).toBe('100% Halal, Fresh & Delicious')
  })

  it('keeps unmatched asterisks', () => {
    expect(plainText('5 * 3')).toBe('5 * 3')
  })

  it('returns an empty string for empty input', () => {
    expect(plainText(null)).toBe('')
  })
})

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('AlBeik Smashed Burger')).toBe('albeik-smashed-burger')
  })

  it('keeps existing hyphens without doubling them', () => {
    expect(slugify('Charbroiled Rib-eye  Sandwich')).toBe('charbroiled-rib-eye-sandwich')
  })

  it('strips accents', () => {
    expect(slugify('Café Crème')).toBe('cafe-creme')
  })

  it('spells out ampersands and drops other punctuation', () => {
    expect(slugify('Hummus & Pita (Large)!')).toBe('hummus-and-pita-large')
  })

  it('trims leading and trailing separators', () => {
    expect(slugify('  --Fattoush--  ')).toBe('fattoush')
  })
})

describe('formatPrice', () => {
  it('formats US dollars with cents', () => {
    expect(formatPrice(12.5)).toBe('$12.50')
    expect(formatPrice(9)).toBe('$9.00')
  })
})
