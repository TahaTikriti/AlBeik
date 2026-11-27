import { afterEach, describe, expect, it, vi } from 'vitest'

import { attempts, postCheckout, withTimeout } from './checkoutClient'

function fakeSession() {
  const data = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('attempts.begin', () => {
  it('refuses a second attempt while one is in flight in this tab', () => {
    fakeSession()
    const first = attempts.begin()
    expect(first).toMatch(/^[0-9a-f-]{36}$/)
    expect(attempts.begin()).toBeNull()
    expect(attempts.last()).toBe(first)
    attempts.settle()
    expect(attempts.begin()).not.toBe(first)
  })
})

describe('withTimeout', () => {
  it('aborts with the caller, without AbortSignal.any (older Safari)', () => {
    vi.stubGlobal('AbortSignal', Object.assign(Object.create(AbortSignal), { any: undefined, timeout: AbortSignal.timeout }))
    const caller = new AbortController()
    const signal = withTimeout(caller.signal, 35_000)
    expect(signal.aborted).toBe(false)
    caller.abort()
    expect(signal.aborted).toBe(true)
  })

  it('aborts after the timeout', () => {
    vi.useFakeTimers()
    vi.stubGlobal('AbortSignal', Object.assign(Object.create(AbortSignal), { any: undefined, timeout: undefined }))
    const signal = withTimeout(new AbortController().signal, 1000)
    vi.advanceTimersByTime(1001)
    expect(signal.aborted).toBe(true)
  })
})

describe('postCheckout', () => {
  it('passes the status and any detail on with the error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: 'Gone', code: 'unavailable', lines: [1] }, { status: 409 })),
    )
    await expect(postCheckout('/quote', {})).rejects.toMatchObject({
      message: 'Gone',
      code: 'unavailable',
      status: 409,
      detail: { lines: [1] },
    })
  })
})
