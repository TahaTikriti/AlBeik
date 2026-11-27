import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

import { fileStore } from './payment-store'
import { type CheckoutStore, memoryStore } from './store'

const dirs: string[] = []
afterAll(async () => {
  await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })))
})

const stores: [string, () => Promise<CheckoutStore>][] = [
  ['memory', async () => memoryStore()],
  [
    'file',
    async () => {
      const dir = await mkdtemp(join(tmpdir(), 'albeik-store-test-'))
      dirs.push(dir)
      return fileStore(dir)
    },
  ],
]

const ATTEMPT = 'preview:3b241101-e2bb-4255-8caf-4136c566a962'

describe.each(stores)('%s checkout store', (_name, make) => {
  it('claims a step once', async () => {
    const store = await make()
    expect(await store.claim(ATTEMPT, 'order', 'A')).toBe(true)
    expect(await store.claim(ATTEMPT, 'order', 'B')).toBe(false)
  })

  it('claims a rate-limit slot once', async () => {
    const store = await make()
    const window = 'limit:quote:' + 'a1'.repeat(16) + ':29912345'
    expect(await store.claim(window, '0', true)).toBe(true)
    expect(await store.claim(window, '0', true)).toBe(false)
  })

  it('keeps the first value after a losing claim', async () => {
    const store = await make()
    await store.claim(ATTEMPT, 'order', 'A')
    await store.claim(ATTEMPT, 'order', 'B')
    expect(await store.read<string>(ATTEMPT, 'order')).toBe('A')
    expect(await store.read(ATTEMPT, 'paid')).toBeNull()
  })

  it('lets exactly one of twenty concurrent claims win', async () => {
    const store = await make()
    const wins = await Promise.all(
      Array.from({ length: 20 }, (_, i) => store.claim(ATTEMPT, 'pay-started', i)),
    )
    expect(wins.filter(Boolean)).toHaveLength(1)
  })
})
