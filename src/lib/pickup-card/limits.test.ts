import { describe, expect, it } from 'vitest'

import { hashIp, takeSlot } from './limits'
import { memoryStore } from './store'

const at = (minute: number) => new Date(Date.UTC(2026, 10, 27, 18, minute))

describe('takeSlot', () => {
  it('lets five payment attempts per address through in ten minutes, even all at once', async () => {
    const store = memoryStore()
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, () => takeSlot(store, 'pay', 'ip-a', at(0))),
    )
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(5)
    await expect(takeSlot(store, 'pay', 'ip-a', at(9))).rejects.toMatchObject({ status: 429, code: 'not_submitted' })
    await expect(takeSlot(store, 'pay', 'ip-b', at(9))).resolves.toBeUndefined()
  })

  it('starts a new window after ten minutes', async () => {
    const store = memoryStore()
    for (let i = 0; i < 5; i++) await takeSlot(store, 'pay', 'ip-a', at(0))
    await expect(takeSlot(store, 'pay', 'ip-a', at(10))).resolves.toBeUndefined()
  })

  it('limits price checks separately from payments', async () => {
    const store = memoryStore()
    for (let i = 0; i < 5; i++) await takeSlot(store, 'pay', 'ip-a', at(0))
    for (let i = 0; i < 20; i++) await takeSlot(store, 'quote', 'ip-a', at(0))
    await expect(takeSlot(store, 'quote', 'ip-a', at(0))).rejects.toMatchObject({ status: 429 })
    await expect(takeSlot(store, 'quote', 'ip-a', at(1))).resolves.toBeUndefined()
  })
})

describe('hashIp', () => {
  it('is a stable 32-character hex digest that depends on the secret', () => {
    expect(hashIp('203.0.113.9', 's1')).toMatch(/^[0-9a-f]{32}$/)
    expect(hashIp('203.0.113.9', 's1')).toBe(hashIp('203.0.113.9', 's1'))
    expect(hashIp('203.0.113.9', 's1')).not.toBe(hashIp('203.0.113.9', 's2'))
  })
})
