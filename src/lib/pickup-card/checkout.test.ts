import { describe, expect, it } from 'vitest'

import type { SiteVM } from '@/lib/data/types'
import { assertOrderingOpen, pickupPlan, readPayment, readPickupTime } from './checkout'
import { CardError } from './types'

const preview = { mode: 'preview' } as const
const request = () => new Request('http://localhost/order/pickup/pay')
const body = (over: Record<string, unknown> = {}) => ({
  attemptId: '2f1c4b6e-8a3d-4f2a-9b1c-0d2e3f4a5b6c',
  pickupName: 'Rami',
  phone: '(816) 216-1703',
  source: 'preview',
  quoteId: 'q1',
  lines: [{ optionId: 'A', modifierIds: [], quantity: 1 }],
  ...over,
})
const failure = (fn: () => unknown) => {
  try {
    fn()
  } catch (error) {
    return error as CardError
  }
  throw new Error('expected a CardError')
}

describe('readPayment', () => {
  it('normalizes a US phone number to E.164', () => {
    expect(readPayment(body(), preview, request()).phone).toBe('+18162161703')
  })

  it('refuses a phone number that is too short', () => {
    expect(failure(() => readPayment(body({ phone: '12345' }), preview, request())).status).toBe(400)
  })

  it('treats an empty email as none', () => {
    expect(readPayment(body({ email: '  ' }), preview, request()).email).toBeNull()
  })

  it('refuses a malformed email', () => {
    expect(failure(() => readPayment(body({ email: 'rami@' }), preview, request())).status).toBe(400)
  })

  it('refuses a name over 80 characters', () => {
    expect(failure(() => readPayment(body({ pickupName: 'x'.repeat(81) }), preview, request())).status).toBe(400)
  })

  it('changes the fingerprint when the phone changes', () => {
    const a = readPayment(body(), preview, request()).fingerprint
    const b = readPayment(body({ phone: '816-216-1704' }), preview, request()).fingerprint
    expect(a).not.toBe(b)
  })

  it('changes the fingerprint when the pickup time changes', () => {
    const a = readPayment(body(), preview, request()).fingerprint
    const b = readPayment(body({ pickupAt: '2026-11-24T00:30:00.000Z' }), preview, request()).fingerprint
    expect(a).not.toBe(b)
  })

  it('accepts the preview decline fixture', () => {
    expect(readPayment(body({ source: 'preview-decline' }), preview, request()).source).toBe('preview-decline')
  })
})

// Monday 23 Nov 2026, Chicago wall time (UTC−6) → UTC
const chicago = (day: number, hh: number, mm: number) => new Date(Date.UTC(2026, 10, day, hh + 6, mm))
const site = (enabled = true) =>
  ({
    timezone: 'America/Chicago',
    pickup: { enabled, prepMinutes: 20 },
    locations: [
      { openingHours: [{ days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], opens: '11:00', closes: '21:00' }] },
    ],
  }) as unknown as SiteVM

describe('assertOrderingOpen', () => {
  it('lets an order through inside the window', () => {
    expect(() => assertOrderingOpen(site(), chicago(23, 12, 0))).not.toThrow()
  })

  it('refuses before opening and says when it opens', () => {
    const error = failure(() => assertOrderingOpen(site(), chicago(23, 9, 0)))
    expect(error.code).toBe('closed')
    expect(error.message).toBe('Online ordering opens at 11:00 AM.')
  })

  it('names the day when it opens tomorrow', () => {
    const error = failure(() => assertOrderingOpen(site(), chicago(23, 20, 50)))
    expect(error.code).toBe('closed')
    expect(error.message).toBe('Online ordering opens Tuesday at 11:00 AM.')
  })

  it('refuses when online pickup is switched off', () => {
    expect(failure(() => assertOrderingOpen(site(false), chicago(23, 12, 0))).code).toBe('closed')
  })
})

describe('pickup time', () => {
  const now = chicago(23, 18, 2)

  it('offers ASAP and the later quarter hours today', () => {
    const plan = pickupPlan(site(), now)
    expect(plan.readyAt).toEqual(chicago(23, 18, 22))
    expect(plan.slots[0]).toEqual(chicago(23, 18, 45))
    expect(plan.slots.at(-1)).toEqual(chicago(23, 20, 45))
  })

  it('is ASAP when none is chosen', () => {
    expect(readPickupTime(undefined, site(), now)).toEqual({ readyAt: chicago(23, 18, 22), scheduled: false })
  })

  it('takes a later quarter hour today', () => {
    expect(readPickupTime(chicago(23, 19, 30).toISOString(), site(), now)).toEqual({
      readyAt: chicago(23, 19, 30),
      scheduled: true,
    })
  })

  it('refuses a chosen time that is now too soon, so the customer picks again', () => {
    const error = failure(() => readPickupTime(chicago(23, 18, 15).toISOString(), site(), now))
    expect(error.status).toBe(409)
    expect(error.message).toMatch(/choose another/i)
  })

  it('refuses a time off the quarter hour, after closing, or not a time', () => {
    for (const value of [chicago(23, 19, 10).toISOString(), chicago(23, 21, 0).toISOString(), 'soon', 42])
      expect(failure(() => readPickupTime(value, site(), now)).status).toBe(409)
  })
})
