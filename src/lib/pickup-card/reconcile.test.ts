import { describe, expect, it } from 'vitest'

import { staleAttempts } from './reconcile'

describe('staleAttempts', () => {
  const now = new Date('2026-11-27T17:00:00Z')
  const row = (attemptId: string, status: string, secondsAgo: number) => ({
    attemptId,
    status,
    createdAt: new Date(now.getTime() - secondsAgo * 1000).toISOString(),
  })

  it('picks pending orders older than 30 seconds, oldest first, five at most', () => {
    const rows = [
      row('fresh', 'pending', 10),
      row('paid', 'paid', 600),
      ...Array.from({ length: 7 }, (_, i) => row('old-' + i, 'pending', 60 + i)),
    ]
    expect(staleAttempts(rows, now)).toEqual(['old-6', 'old-5', 'old-4', 'old-3', 'old-2'])
  })

  it('ignores rows without a usable date', () => {
    expect(staleAttempts([{ attemptId: 'x', status: 'pending', createdAt: 'nope' }], now)).toEqual([])
  })
})
