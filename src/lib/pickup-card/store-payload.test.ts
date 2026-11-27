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
})

describe('payload checkout store, duplicate keys', () => {
  // A production build minifies Payload's error classes, so the error's
  // name is not "ValidationError" there: only its data says what happened.
  function duplicate(name: string) {
    return Object.assign(new Error('The following field is invalid: key'), {
      name,
      status: 400,
      data: { collection: 'checkout-steps', errors: [{ message: 'Value must be unique', path: 'key' }] },
    })
  }

  it('treats a minified duplicate-key error as already claimed', async () => {
    const payload = {
      create: async () => {
        throw duplicate('a')
      },
    } as unknown as Payload
    await expect(payloadStore(payload).claim('test:x', 'alerted', true)).resolves.toBe(false)
  })

  it('still throws other validation errors', async () => {
    const payload = {
      create: async () => {
        throw Object.assign(duplicate('a'), {
          data: { errors: [{ message: 'This field is required.', path: 'step' }] },
        })
      },
    } as unknown as Payload
    await expect(payloadStore(payload).claim('test:x', 'alerted', true)).rejects.toThrow()
  })
})
