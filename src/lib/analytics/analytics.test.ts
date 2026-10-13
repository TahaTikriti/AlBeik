import { afterEach, describe, expect, it, vi } from 'vitest'

import { track } from '.'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('track', () => {
  it('forwards the event name and properties to Umami', () => {
    const calls: unknown[][] = []
    vi.stubGlobal('window', { umami: { track: (...args: unknown[]) => calls.push(args) } })

    track('order_click', {
      item: 'kafta-sandwich',
      platform: 'doordash',
      level: 'item',
      placement: 'menu',
    })

    expect(calls).toEqual([
      [
        'order_click',
        { item: 'kafta-sandwich', platform: 'doordash', level: 'item', placement: 'menu' },
      ],
    ])
  })

  it('does nothing on the server', () => {
    expect(() => track('order_sheet_open', { item: 'store', placement: 'sticky' })).not.toThrow()
  })

  it('does nothing when the tracker has not loaded', () => {
    vi.stubGlobal('window', {})
    expect(() => track('order_sheet_open', { item: 'store', placement: 'sticky' })).not.toThrow()
  })

  it('never lets a tracker error break the click', () => {
    vi.stubGlobal('window', {
      umami: {
        track: () => {
          throw new Error('blocked by an ad blocker')
        },
      },
    })
    expect(() => track('order_sheet_open', { item: 'store', placement: 'sticky' })).not.toThrow()
  })
})
