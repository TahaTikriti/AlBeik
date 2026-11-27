import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CardConfig } from './config'
import {
  abandonCardPayment,
  lookupCardPayment as lookup,
  reconcileStoredPayment,
  reconcileCardPayment as reconcile,
  submitCardPayment as submit,
} from './payment'
import { memoryStore } from './store'

const config: CardConfig = {
  mode: 'clover',
  env: 'sandbox',
  merchantId: 'M1',
  publicKey: 'pk',
  privateKey: 'ek',
  restToken: 'rest',
  orderTypeId: 'PICKUP',
}
const orderCart = {
  orderType: { id: 'PICKUP' },
  lineItems: [{ item: { id: 'WRAP' }, modifications: [{ modifier: { id: 'SAUCE' } }] }],
}
const quote = {
  quoteId: 'quote',
  lines: [{ name: 'Wrap + sauce', quantity: 1, unitCents: 1000 }],
  subtotalCents: 1000,
  taxCents: 80,
  totalCents: 1080,
}
const prepare = async () => ({ quote, orderCart })
const makeInput = () => ({
  source: 'clv_secret',
  pickupName: 'Test',
  fingerprint: 'basket-hash',
  clientIp: '127.0.0.1',
  attemptId: randomUUID(),
})
const order = { id: 'ORDER1', total: 1080, orderType: { id: 'PICKUP' } }
const paid = {
  id: 'ORDER1',
  amount: 1080,
  amount_paid: 1080,
  currency: 'USD',
  charge: 'CHARGE1',
  status: 'paid',
}
const lineItems = {
  elements: [
    { item: { id: 'WRAP' }, modifications: { elements: [{ modifier: { id: 'SAUCE' } }] } },
  ],
}
const printEvent = { id: 'PRINT1', state: 'CREATED', orderRef: { id: 'ORDER1' } }
const json = (value: unknown, status = 200) => Response.json(value, { status })

function mockClover(replace?: (path: string, init: RequestInit) => Response | undefined) {
  const requests: { path: string; method: string; body: string; headers: Headers }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (value: string, init: RequestInit) => {
      const url = new URL(value)
      const path = url.pathname + url.search
      requests.push({
        path,
        method: init.method || 'GET',
        body: String(init.body),
        headers: new Headers(init.headers),
      })
      const replacement = replace?.(path, init)
      if (replacement) return replacement
      if (path.endsWith('/atomic_order/orders')) return json({ id: 'ORDER1' })
      if (path.includes('/line_items?')) return json(lineItems)
      if (path.endsWith('/print_event')) return json(printEvent)
      if (path.endsWith('/pay') || path.startsWith('/v1/orders/')) return json(paid)
      if (path.endsWith('/orders/ORDER1')) return json(order)
      throw new Error('Unexpected Clover request ' + path)
    }),
  )
  return requests
}
let store = memoryStore()
const submitCardPayment = (...args: DropStore<Parameters<typeof submit>>) =>
  submit(args[0], store, args[1], args[2])
const lookupCardPayment = (config: CardConfig, attemptId: string) => lookup(config, store, attemptId)
const reconcileCardPayment = (config: CardConfig, attemptId: string) =>
  reconcile(config, store, attemptId)
type DropStore<T> = T extends [infer A, unknown, ...infer R] ? [A, ...R] : never
beforeEach(() => {
  store = memoryStore()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('pickup card payment', () => {
  it('concurrent submissions create one itemized order, pay the same id, and request one ticket', async () => {
    const requests = mockClover()
    const input = makeInput()
    await Promise.all(Array.from({ length: 5 }, () => submitCardPayment(config, input, prepare)))
    expect(
      await submitCardPayment(config, input, async () => {
        throw new Error('Already paid')
      }),
    ).toEqual({
      orderId: 'ORDER1',
      status: 'paid',
      totalCents: 1080,
      printStatus: 'requested',
    })
    const posts = requests.filter((r) => r.method === 'POST')
    expect(posts.map((r) => r.path)).toEqual([
      '/v3/merchants/M1/atomic_order/orders',
      '/v1/orders/ORDER1/pay',
      '/v3/merchants/M1/print_event',
    ])
    expect(JSON.parse(posts[0]!.body).orderCart).toMatchObject({
      ...orderCart,
      title: 'Pickup · Test',
    })
    expect(JSON.parse(posts[1]!.body)).toMatchObject({ source: input.source, amount: 1080 })
    expect(posts[1]!.headers.get('x-forwarded-for')).toBe('127.0.0.1')
    expect(JSON.parse(posts[2]!.body)).toEqual({ orderRef: { id: 'ORDER1' } })
    for (const value of store.steps.values()) expect(value).not.toContain(input.source)
    expect(JSON.stringify([...store.summaries.values()])).not.toContain(input.source)
    expect(store.summaries.get('M1:' + input.attemptId)).toMatchObject({
      status: 'paid',
      printStatus: 'requested',
      cloverOrderId: 'ORDER1',
      totalCents: 1080,
      pickupName: 'Test',
    })
    await expect(
      submitCardPayment(config, { ...input, fingerprint: 'other' }, prepare),
    ).rejects.toMatchObject({ status: 409 })
  })
  it('rejects stale prices and wrong POS modifiers without charging', async () => {
    for (const changed of ['price', 'modifier']) {
      const requests = mockClover((path) => {
        if (changed === 'price' && path.startsWith('/v3/') && path.endsWith('/ORDER1'))
          return json({ ...order, total: 1090 })
        if (changed === 'modifier' && path.includes('/line_items?'))
          return json({ elements: [{ item: { id: 'WRAP' } }] })
      })
      await expect(submitCardPayment(config, makeInput(), prepare)).rejects.toMatchObject({
        status: 409,
      })
      expect(requests.some((r) => r.path.endsWith('/pay'))).toBe(false)
      expect(requests.filter((r) => r.method === 'DELETE').map((r) => r.path)).toEqual(['/v3/merchants/M1/orders/ORDER1'])
    }
  })
  it('recovers a lost response by reading the same paid order and never charging again', async () => {
    let visible = false
    const requests = mockClover((path) => {
      if (path.endsWith('/pay')) throw new Error('Response lost')
      if (path.startsWith('/v1/orders/') && !visible)
        return json({ ...paid, status: 'created', amount_paid: 0 })
    })
    const input = makeInput()
    expect((await submitCardPayment(config, input, prepare)).status).toBe('pending')
    visible = true
    const readsBefore = requests.length
    expect((await lookupCardPayment(config, input.attemptId))?.status).toBe('paid')
    expect(requests.slice(readsBefore).every((r) => r.method === 'GET')).toBe(true)
    expect((await reconcileCardPayment(config, input.attemptId))?.printStatus).toBe('requested')
    expect((await reconcileCardPayment(config, input.attemptId))?.printStatus).toBe('requested')
    expect(requests.filter((r) => r.path.endsWith('/print_event'))).toHaveLength(1)
    expect(requests.filter((r) => r.path.endsWith('/pay'))).toHaveLength(1)
  })
  it('reports an ambiguous print separately and never enqueues it twice', async () => {
    const requests = mockClover((path) =>
      path.endsWith('/print_event') ? json({ state: 'FAILED' }) : undefined,
    )
    const input = makeInput()
    expect(await submitCardPayment(config, input, prepare)).toMatchObject({
      status: 'paid',
      printStatus: 'unconfirmed',
    })
    expect(await submitCardPayment(config, input, prepare)).toMatchObject({
      status: 'paid',
      printStatus: 'unconfirmed',
    })
    expect(requests.filter((r) => r.path.endsWith('/print_event'))).toHaveLength(1)
  })
  it('reconciles a rate-limited payment without submitting it a second time', async () => {
    let paidOrderVisible = false
    const requests = mockClover((path) => {
      if (path.endsWith('/pay')) return json({ error: { code: 'rate_limit' } }, 429)
      if (path.startsWith('/v1/orders/') && !paidOrderVisible) return json({}, 429)
    })
    const input = makeInput()
    expect(await submitCardPayment(config, input, prepare)).toMatchObject({
      status: 'pending',
      printStatus: 'not-requested',
    })
    expect(await reconcileCardPayment(config, input.attemptId)).toMatchObject({
      status: 'pending',
    })
    paidOrderVisible = true
    expect(await reconcileCardPayment(config, input.attemptId)).toMatchObject({
      orderId: 'ORDER1',
      status: 'paid',
      printStatus: 'requested',
    })
    expect(requests.filter((r) => r.path.endsWith('/pay'))).toHaveLength(1)
    expect(requests.filter((r) => r.path.endsWith('/print_event'))).toHaveLength(1)
  })
  it('preserves a paid order when Clover rate-limits the print request', async () => {
    const requests = mockClover((path) =>
      path.endsWith('/print_event') ? json({}, 429) : undefined,
    )
    const input = makeInput()
    const receipt = await submitCardPayment(config, input, prepare)
    expect(receipt).toMatchObject({ status: 'paid', printStatus: 'unconfirmed' })
    expect(await reconcileCardPayment(config, input.attemptId)).toEqual(receipt)
    expect(requests.filter((r) => r.path.endsWith('/pay'))).toHaveLength(1)
    expect(requests.filter((r) => r.path.endsWith('/print_event'))).toHaveLength(1)
  })
  it('does not recreate an order if the first create response was lost', async () => {
    const requests = mockClover((path) => {
      if (path.endsWith('/atomic_order/orders')) throw new Error('Timeout')
      return undefined
    })
    const input = makeInput()
    expect(await submitCardPayment(config, input, prepare)).toMatchObject({
      status: 'review',
      orderId: input.attemptId.slice(0, 8).toUpperCase(),
    })
    expect((await submitCardPayment(config, input, prepare)).status).toBe('review')
    expect(requests).toHaveLength(1)
  })
  it('does not print declined, underpaid, or unrelated orders', async () => {
    for (const [value, status] of [
      [json({ ...paid, amount_paid: 100 }), 'pending'],
      [json({ ...paid, id: 'OTHER' }), 'pending'],
    ] as const) {
      const requests = mockClover((path) =>
        path.startsWith('/v1/orders/') ? value.clone() : undefined,
      )
      expect((await submitCardPayment(config, makeInput(), prepare)).status).toBe(status)
      expect(requests.some((r) => r.path.endsWith('/print_event'))).toBe(false)
    }
  })
  it('requires an explicit Clover decline code and keeps an already paid order confirmed', async () => {
    for (const [code, status] of [
      ['card_declined', 'declined'],
      ['processing_error', 'pending'],
      ['order_already_paid', 'paid'],
    ] as const) {
      const requests = mockClover((path) => {
        if (path.endsWith('/pay'))
          return json({ error: { code } }, code === 'card_declined' ? 400 : 402)
        if (path.startsWith('/v1/orders/') && status !== 'paid') {
          return json({ ...paid, status: 'created', amount_paid: 0 })
        }
      })
      expect((await submitCardPayment(config, makeInput(), prepare)).status).toBe(status)
      expect(requests.filter((r) => r.path.endsWith('/print_event'))).toHaveLength(
        status === 'paid' ? 1 : 0,
      )
    }
  })
  it('holds an existing unpaid order for review if the POS lookup failed', async () => {
    const requests = mockClover((path) => {
      if (path.includes('/line_items?')) return json({}, 503)
      return undefined
    })
    const input = makeInput()
    expect(await submitCardPayment(config, input, prepare)).toMatchObject({
      status: 'review',
      orderId: 'ORDER1',
    })
    expect(await reconcileCardPayment(config, input.attemptId)).toMatchObject({ status: 'review' })
    expect(requests.filter((r) => r.method === 'POST').map((r) => r.path)).toEqual([
      '/v3/merchants/M1/atomic_order/orders',
    ])
  })
  it('uses an isolated simulated payment and ticket in preview', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const input = { ...makeInput(), source: 'preview' }
    expect(await submitCardPayment({ mode: 'preview' }, input, prepare)).toMatchObject({
      status: 'paid',
      printStatus: 'simulated',
    })
    expect(await lookupCardPayment(config, input.attemptId)).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('puts the phone and ready time on the Clover order and sends an email only when given', async () => {
    const requests = mockClover()
    const note = 'Pickup for Test · (816) 216-1703 · ready ~6:40 PM'
    const readyAt = '2026-11-28T00:40:00.000Z'
    const input = { ...makeInput(), note, details: { phone: '+18162161703', email: 'rami@example.com', readyAt } }
    expect(await submitCardPayment(config, input, prepare)).toMatchObject({ status: 'paid', readyAt })
    const posts = requests.filter((r) => r.method === 'POST')
    expect(JSON.parse(posts[0]!.body).orderCart.note).toBe(note)
    expect(JSON.parse(posts[1]!.body).email).toBe('rami@example.com')

    const again = mockClover()
    await submitCardPayment(config, { ...makeInput(), note }, prepare)
    expect(JSON.parse(again.find((r) => r.path.endsWith('/pay'))!.body)).not.toHaveProperty('email')
  })

  it('declines the preview decline fixture without charging or printing', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const input = { ...makeInput(), source: 'preview-decline' }
    expect(await submitCardPayment({ mode: 'preview' }, input, prepare)).toMatchObject({
      status: 'declined',
      printStatus: 'not-requested',
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('announces a paid order once, however many times it is finished', async () => {
    mockClover()
    const notify = vi.fn()
    const input = { ...makeInput(), details: { phone: '+18162161703', readyAt: '2026-11-28T00:40:00.000Z' } }
    await submit(config, store, input, prepare, notify)
    await reconcile(config, store, input.attemptId, notify)
    await reconcile(config, store, input.attemptId, notify)
    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify.mock.calls[0]![0]).toMatchObject({ status: 'paid', pickupName: 'Test', totalCents: 1080, phone: '+18162161703' })
  })

  it('announces a paid preview order', async () => {
    const notify = vi.fn()
    await submit({ mode: 'preview' }, store, { ...makeInput(), source: 'preview' }, prepare, notify)
    expect(notify).toHaveBeenCalledTimes(1)
  })

  it('does not announce a declined order', async () => {
    const notify = vi.fn()
    await submit({ mode: 'preview' }, store, { ...makeInput(), source: 'preview-decline' }, prepare, notify)
    expect(notify).not.toHaveBeenCalled()
  })

  it('stops an attempt Clover refuses outright, without charging, and cancels its order', async () => {
    const requests = mockClover((path) => {
      if (path.endsWith('/pay')) return json({ error: { code: 'email_invalid' } }, 400)
      if (path.startsWith('/v1/orders/')) return json({ ...paid, status: 'created', amount_paid: 0 })
    })
    const input = makeInput()
    await expect(submitCardPayment(config, input, prepare)).rejects.toMatchObject({ code: 'not_submitted' })
    await expect(reconcileCardPayment(config, input.attemptId)).rejects.toMatchObject({ code: 'not_submitted' })
    expect(requests.filter((r) => r.method === 'DELETE').map((r) => r.path)).toEqual(['/v3/merchants/M1/orders/ORDER1'])
  })
  it('cancels the unpaid Clover order after a decline', async () => {
    const requests = mockClover((path) => {
      if (path.endsWith('/pay')) return json({ error: { code: 'card_declined' } }, 400)
      if (path.startsWith('/v1/orders/')) return json({ ...paid, status: 'created', amount_paid: 0 })
    })
    expect((await submitCardPayment(config, makeInput(), prepare)).status).toBe('declined')
    expect(requests.filter((r) => r.method === 'DELETE').map((r) => r.path)).toEqual(['/v3/merchants/M1/orders/ORDER1'])
  })
  it('still declines when cancelling the unpaid order fails', async () => {
    mockClover((path, init) => {
      if (init.method === 'DELETE') return json({}, 500)
      if (path.endsWith('/pay')) return json({ error: { code: 'card_declined' } }, 400)
      if (path.startsWith('/v1/orders/')) return json({ ...paid, status: 'created', amount_paid: 0 })
    })
    expect((await submitCardPayment(config, makeInput(), prepare)).status).toBe('declined')
  })

  describe('an attempt that never settles', () => {
    afterEach(() => vi.useRealTimers())

    it('goes to review once the charge has stayed unknown for five minutes', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-27T17:00:00Z'))
      mockClover((path) => {
        if (path.endsWith('/pay')) return json({ error: { code: 'rate_limit' } }, 429)
        if (path.startsWith('/v1/orders/')) return json({}, 429)
      })
      const input = makeInput()
      expect((await submitCardPayment(config, input, prepare)).status).toBe('pending')
      vi.setSystemTime(new Date('2026-11-27T17:04:00Z'))
      expect((await reconcileCardPayment(config, input.attemptId))?.status).toBe('pending')
      vi.setSystemTime(new Date('2026-11-27T17:06:00Z'))
      expect((await reconcileCardPayment(config, input.attemptId))?.status).toBe('review')
    })

    it('stops when the server died before asking Clover to charge', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-27T17:00:00Z'))
      const fetch = vi.fn()
      vi.stubGlobal('fetch', fetch)
      const attemptId = randomUUID()
      await store.claim('M1:' + attemptId, 'attempt', {
        fingerprint: 'basket-hash',
        totalCents: 1080,
        startedAt: new Date().toISOString(),
      })
      expect((await reconcileCardPayment(config, attemptId))?.status).toBe('pending')
      vi.setSystemTime(new Date('2026-11-27T17:06:00Z'))
      await expect(reconcileCardPayment(config, attemptId)).rejects.toMatchObject({ code: 'not_submitted' })
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  it('abandons an attempt whose payment never arrived, so a late one is refused', async () => {
    const requests = mockClover()
    const input = makeInput()
    expect(await abandonCardPayment(config, store, input.attemptId)).toBe(true)
    await expect(reconcileCardPayment(config, input.attemptId)).rejects.toMatchObject({ code: 'not_submitted' })
    await expect(submitCardPayment(config, input, prepare)).rejects.toBeTruthy()
    expect(requests).toHaveLength(0)
  })
  it('does not abandon an attempt that arrived', async () => {
    mockClover()
    const input = makeInput()
    await submitCardPayment(config, input, prepare)
    expect(await abandonCardPayment(config, store, input.attemptId)).toBe(false)
    expect((await reconcileCardPayment(config, input.attemptId))?.status).toBe('paid')
  })

  it('reconciles a stored attempt for the admin list, only within this merchant', async () => {
    let paidOrderVisible = false
    mockClover((path) => {
      if (path.endsWith('/pay')) return json({ error: { code: 'rate_limit' } }, 429)
      if (path.startsWith('/v1/orders/') && !paidOrderVisible) return json({}, 429)
    })
    const input = makeInput()
    await submitCardPayment(config, input, prepare)
    paidOrderVisible = true
    const notify = vi.fn()
    expect(await reconcileStoredPayment(config, store, 'OTHER:' + input.attemptId, notify)).toBeNull()
    expect(await reconcileStoredPayment(config, store, 'M1:' + input.attemptId, notify)).toMatchObject({ status: 'paid' })
    expect(notify).toHaveBeenCalledTimes(1)
  })
})
