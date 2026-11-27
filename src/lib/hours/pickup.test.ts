import { describe, expect, it } from 'vitest'

import { type OpeningHours, pickupWindow } from './index'

const TZ = 'America/Chicago' // CST in late November: UTC−6
const hours: OpeningHours[] = [
  { days: ['mon', 'tue', 'wed', 'thu'], opens: '11:00', closes: '21:00' },
  { days: ['fri', 'sat', 'sun'], opens: '11:00', closes: '02:00' },
]
// Monday 23 Nov 2026, Chicago wall time → UTC
const chicago = (day: number, hh: number, mm: number) =>
  new Date(Date.UTC(2026, 10, day, hh + 6, mm))

describe('pickupWindow', () => {
  it('takes orders until closing minus prep time', () => {
    expect(pickupWindow(hours, TZ, 20, chicago(23, 20, 39))).toEqual({
      open: true,
      lastOrderAt: chicago(23, 20, 40),
    })
  })

  it('stops taking orders inside the prep window and says when it opens next', () => {
    expect(pickupWindow(hours, TZ, 20, chicago(23, 20, 41))).toEqual({
      open: false,
      opensAt: chicago(24, 11, 0),
    })
  })

  it('opens later the same day before opening time', () => {
    expect(pickupWindow(hours, TZ, 20, chicago(23, 10, 59))).toEqual({
      open: false,
      opensAt: chicago(23, 11, 0),
    })
  })

  it('counts after-midnight hours to the day before', () => {
    // Saturday 28 Nov, 1:00 AM: still Friday's 11 AM – 2 AM.
    expect(pickupWindow(hours, TZ, 20, chicago(28, 1, 0))).toEqual({
      open: true,
      lastOrderAt: chicago(28, 1, 40),
    })
  })

  it('is closed with no known opening when there are no hours', () => {
    expect(pickupWindow([], TZ, 20, chicago(23, 12, 0))).toEqual({ open: false, opensAt: null })
  })
})
