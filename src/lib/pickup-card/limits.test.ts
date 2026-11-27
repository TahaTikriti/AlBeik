import { describe, expect, it } from 'vitest'

import { checkPayLimit, hashIp } from './limits'
import { memoryStore } from './store'

const at = (minute: number) => new Date(Date.UTC(2026, 10, 27, 18, minute))

describe('checkPayLimit', () => {
  it('refuses the sixth attempt from one address within ten minutes', async () => {
    let now = at(0)
    const store = memoryStore(() => now)
    for (let i = 0; i < 5; i++) {
      now = at(i)
      await checkPayLimit(store, 'ip-a', now)
      await store.summarize('preview:' + i, { status: 'pending', printStatus: 'not-requested', ipHash: 'ip-a' })
    }
    await expect(checkPayLimit(store, 'ip-a', at(5))).rejects.toMatchObject({ status: 429 })
    await expect(checkPayLimit(store, 'ip-b', at(5))).resolves.toBeUndefined()
  })

  it('forgets attempts older than ten minutes', async () => {
    let now = at(0)
    const store = memoryStore(() => now)
    for (let i = 0; i < 5; i++)
      await store.summarize('preview:' + i, { status: 'pending', printStatus: 'not-requested', ipHash: 'ip-a' })
    now = at(11)
    await expect(checkPayLimit(store, 'ip-a', now)).resolves.toBeUndefined()
  })
})

describe('hashIp', () => {
  it('is a stable 32-character hex digest that depends on the secret', () => {
    expect(hashIp('203.0.113.9', 's1')).toMatch(/^[0-9a-f]{32}$/)
    expect(hashIp('203.0.113.9', 's1')).toBe(hashIp('203.0.113.9', 's1'))
    expect(hashIp('203.0.113.9', 's1')).not.toBe(hashIp('203.0.113.9', 's2'))
  })
})
