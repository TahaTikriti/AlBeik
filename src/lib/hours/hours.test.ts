import { describe, expect, it } from 'vitest'

import { formatDays, formatHours, formatTime, isValidTime, toSchemaOpeningHours } from '.'

describe('isValidTime', () => {
  it('accepts 24-hour HH:MM', () => {
    expect(isValidTime('00:00')).toBe(true)
    expect(isValidTime('11:30')).toBe(true)
    expect(isValidTime('23:59')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isValidTime('24:00')).toBe(false)
    expect(isValidTime('9:00')).toBe(false)
    expect(isValidTime('11:60')).toBe(false)
    expect(isValidTime('11am')).toBe(false)
    expect(isValidTime('')).toBe(false)
  })
})

describe('formatTime', () => {
  it('formats to a 12-hour clock', () => {
    expect(formatTime('13:30')).toBe('1:30 PM')
    expect(formatTime('09:05')).toBe('9:05 AM')
  })

  it('handles midnight and noon', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
    expect(formatTime('12:00')).toBe('12:00 PM')
  })
})

describe('formatDays', () => {
  it('collapses a run of three or more days into a range', () => {
    expect(formatDays(['mon', 'tue', 'wed', 'thu'])).toBe('Mon–Thu')
  })

  it('lists two consecutive days separately', () => {
    expect(formatDays(['fri', 'sat'])).toBe('Fri, Sat')
  })

  it('orders days Monday-first regardless of input order', () => {
    expect(formatDays(['sun', 'wed', 'mon', 'tue'])).toBe('Mon–Wed, Sun')
  })

  it('names every day as such', () => {
    expect(formatDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).toBe('Every day')
  })

  it('ignores duplicates', () => {
    expect(formatDays(['mon', 'mon'])).toBe('Mon')
  })
})

describe('formatHours', () => {
  it('turns rows into display lines and drops incomplete rows', () => {
    expect(
      formatHours([
        { days: ['mon', 'tue', 'wed', 'thu'], opens: '11:00', closes: '22:00' },
        { days: ['fri', 'sat'], opens: '11:00', closes: '23:30' },
        { days: [], opens: '11:00', closes: '22:00' },
        { days: ['sun'], opens: '', closes: '20:00' },
      ]),
    ).toEqual([
      { days: 'Mon–Thu', time: '11:00 AM – 10:00 PM' },
      { days: 'Fri, Sat', time: '11:00 AM – 11:30 PM' },
    ])
  })

  it('returns nothing for missing hours', () => {
    expect(formatHours(null)).toEqual([])
  })
})

describe('toSchemaOpeningHours', () => {
  it('maps rows to schema.org OpeningHoursSpecification', () => {
    expect(
      toSchemaOpeningHours([
        { days: ['sat', 'fri'], opens: '11:00', closes: '23:30' },
        { days: ['sun'], opens: 'bad', closes: '20:00' },
      ]),
    ).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['https://schema.org/Friday', 'https://schema.org/Saturday'],
        opens: '11:00',
        closes: '23:30',
      },
    ])
  })
})
