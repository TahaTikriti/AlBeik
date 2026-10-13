import { describe, expect, it } from 'vitest'

import { createRevalidateHooks, shouldRevalidate } from './revalidateSite'

describe('shouldRevalidate', () => {
  it('always revalidates collections without drafts', () => {
    expect(shouldRevalidate({ doc: { id: 1 }, previousDoc: { id: 1 } })).toBe(true)
  })

  it('revalidates when a document is published', () => {
    expect(
      shouldRevalidate({ doc: { _status: 'published' }, previousDoc: { _status: 'draft' } }),
    ).toBe(true)
  })

  it('revalidates when a published document is unpublished', () => {
    expect(
      shouldRevalidate({ doc: { _status: 'draft' }, previousDoc: { _status: 'published' } }),
    ).toBe(true)
  })

  it('skips saves that only touch drafts', () => {
    expect(shouldRevalidate({ doc: { _status: 'draft' }, previousDoc: { _status: 'draft' } })).toBe(
      false,
    )
    expect(shouldRevalidate({ doc: { _status: 'draft' } })).toBe(false)
  })

  it('skips when the caller opts out (seed script)', () => {
    expect(
      shouldRevalidate({ doc: { _status: 'published' }, context: { disableRevalidate: true } }),
    ).toBe(false)
  })
})

describe('createRevalidateHooks', () => {
  const logs: string[] = []
  const req = {
    payload: { logger: { info: () => logs.push('info'), warn: () => logs.push('warn') } },
  }

  function setup(revalidate: () => void = () => {}) {
    let calls = 0
    const hooks = createRevalidateHooks(() => {
      calls++
      revalidate()
    })
    return { hooks, calls: () => calls }
  }

  it('revalidates after a published change and returns the doc', () => {
    const { hooks, calls } = setup()
    const doc = { _status: 'published' }
    const result = hooks.afterChange({ doc, previousDoc: {}, context: {}, req } as never)
    expect(result).toBe(doc)
    expect(calls()).toBe(1)
  })

  it('does not revalidate a draft-only save', () => {
    const { hooks, calls } = setup()
    hooks.afterChange({ doc: { _status: 'draft' }, previousDoc: {}, context: {}, req } as never)
    expect(calls()).toBe(0)
  })

  it('revalidates after a delete', () => {
    const { hooks, calls } = setup()
    hooks.afterDelete({ doc: { id: 1 }, context: {}, req } as never)
    expect(calls()).toBe(1)
  })

  it('revalidates after a global is published', () => {
    const { hooks, calls } = setup()
    hooks.globalAfterChange({
      doc: { _status: 'published' },
      previousDoc: {},
      context: {},
      req,
    } as never)
    expect(calls()).toBe(1)
  })

  it('never fails the save when revalidation throws outside a Next.js request', () => {
    const { hooks } = setup(() => {
      throw new Error('Invariant: static generation store missing')
    })
    const doc = { id: 1 }
    expect(hooks.afterChange({ doc, previousDoc: {}, context: {}, req } as never)).toBe(doc)
    expect(logs).toContain('warn')
  })
})
