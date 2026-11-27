import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CardConfig } from './config'
import { lookupCardPayment, reconcileCardPayment, submitCardPayment } from './payment'
import { paymentDirectory } from './payment-store'

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
let store: string
beforeEach(async () => {
  store = await mkdtemp(join(tmpdir(), 'albeik-payment-test-'))
  vi.stubEnv('PICKUP_CARD_SPIKE_STORE', store)
})
afterEach(async () => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  await rm(store, { recursive: true, force: true })
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
    const dir = paymentDirectory(config, input.attemptId)
    for (const name of await readdir(dir))
      expect(await readFile(join(dir, name), 'utf8')).not.toContain(input.source)
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
})
