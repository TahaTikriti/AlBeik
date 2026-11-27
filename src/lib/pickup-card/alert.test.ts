import { afterEach, describe, expect, it, vi } from 'vitest'

import { sendOrderAlert } from './alert'
import type { WebOrderSummary } from './store'

const order: WebOrderSummary = {
  status: 'paid',
  printStatus: 'requested',
  cloverOrderId: 'ORDER1234',
  totalCents: 3886,
  pickupName: 'Rami',
  phone: '+18162161703',
  readyAt: '2026-11-28T00:40:00.000Z',
  lines: [{ name: 'Chicken Tawouk Combo + Fries', quantity: 2 }],
}

afterEach(() => vi.unstubAllEnvs())

describe('sendOrderAlert', () => {
  it('is off without an API key or an address', async () => {
    const fetchImpl = vi.fn()
    vi.stubEnv('RESEND_API_KEY', '')
    expect(await sendOrderAlert(order, 'owner@example.com', fetchImpl)).toBe('off')
    vi.stubEnv('RESEND_API_KEY', 're_test')
    expect(await sendOrderAlert(order, null, fetchImpl)).toBe('off')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('posts one email to Resend with the order', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }))
    expect(await sendOrderAlert(order, 'owner@example.com', fetchImpl)).toBe('sent')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer re_test')
    const body = JSON.parse(String(init.body))
    expect(body.to).toEqual(['owner@example.com'])
    expect(body.subject).toBe('New pickup order · Rami · $38.86')
    expect(body.text).toContain('2 × Chicken Tawouk Combo + Fries')
    expect(body.text).toContain('6:40 PM')
    expect(body.text).toContain('(816) 216-1703')
  })

  it('reports a failed send without throwing', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    expect(await sendOrderAlert(order, 'owner@example.com', async () => new Response('no', { status: 500 }))).toBe('failed')
    expect(
      await sendOrderAlert(order, 'owner@example.com', async () => {
        throw new Error('offline')
      }),
    ).toBe('failed')
  })
})
