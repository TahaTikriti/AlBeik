import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { CheckoutStore } from './store'
import { payloadStore } from './store-payload'

// Runs only against a real database: DATABASE_URL=… PAYLOAD_SECRET=… pnpm vitest run …
const enabled = Boolean(process.env.DATABASE_URL && process.env.PAYLOAD_SECRET)

describe.skipIf(!enabled)('payload checkout store', () => {
  let payload: Payload
  let store: CheckoutStore
  const attempt = () => 'test:' + randomUUID()

  beforeAll(async () => {
    const [{ getPayload }, { default: config }] = await Promise.all([
      import('payload'),
      import('../../payload.config'),
    ])
    payload = await getPayload({ config })
    store = payloadStore(payload)
  }, 60_000)

  afterAll(async () => {
    await payload?.delete({
      collection: 'checkout-steps',
      overrideAccess: true,
      where: { attemptId: { like: 'test:' } },
    })
    await payload?.delete({
      collection: 'web-orders',
      overrideAccess: true,
      where: { attemptId: { like: 'test:' } },
    })
    await payload?.destroy()
  })

  it('claims a step once', async () => {
    const id = attempt()
    expect(await store.claim(id, 'order', 'A')).toBe(true)
    expect(await store.claim(id, 'order', 'B')).toBe(false)
  })

  it('keeps the first value after a losing claim', async () => {
    const id = attempt()
    await store.claim(id, 'order', 'A')
    await store.claim(id, 'order', 'B')
    expect(await store.read<string>(id, 'order')).toBe('A')
    expect(await store.read(id, 'paid')).toBeNull()
  })

  it('lets exactly one of twenty concurrent claims win', async () => {
    const id = attempt()
    const wins = await Promise.all(
      Array.from({ length: 20 }, (_, i) => store.claim(id, 'pay-started', i)),
    )
    expect(wins.filter(Boolean)).toHaveLength(1)
  })

  it('keeps one web order per attempt and merges summaries', async () => {
    const id = attempt()
    await Promise.all([
      store.summarize(id, { status: 'pending', printStatus: 'not-requested', pickupName: 'Sam' }),
      store.summarize(id, { status: 'pending', printStatus: 'not-requested', totalCents: 1258 }),
    ])
    await store.summarize(id, { status: 'paid', printStatus: 'requested', cloverOrderId: 'ORDER1' })
    const { docs } = await payload.find({
      collection: 'web-orders',
      overrideAccess: true,
      where: { attemptId: { equals: id } },
    })
    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({ status: 'paid', printStatus: 'requested', cloverOrderId: 'ORDER1' })
  })

  it('counts recent attempts per hashed address', async () => {
    const ip = 'test-ip-' + randomUUID().slice(0, 8)
    const before = new Date(Date.now() - 1000)
    await store.summarize(attempt(), { status: 'pending', printStatus: 'not-requested', ipHash: ip })
    await store.summarize(attempt(), { status: 'pending', printStatus: 'not-requested', ipHash: ip })
    await store.summarize(attempt(), { status: 'pending', printStatus: 'not-requested', ipHash: 'other' })
    expect(await store.countRecent(ip, before)).toBe(2)
    expect(await store.countRecent(ip, new Date(Date.now() + 60_000))).toBe(0)
  })
})
