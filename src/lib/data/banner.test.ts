import { describe, expect, it } from 'vitest'

import { toBanner } from './mappers'

const now = Date.parse('2026-11-20T12:00:00Z')
const base = { enabled: true, text: '*Eid* Mubarak', linkUrl: '/menu' }

describe('toBanner', () => {
  it('is null when switched off or empty', () => {
    expect(toBanner(null, now)).toBeNull()
    expect(toBanner({ ...base, enabled: false }, now)).toBeNull()
    expect(toBanner({ ...base, text: '  ' }, now)).toBeNull()
  })

  it('is null once it has ended, so the page ships without it', () => {
    expect(toBanner({ ...base, endsAt: '2026-11-20T11:59:00Z' }, now)).toBeNull()
  })

  it('keeps an upcoming banner with its dates, for the browser to reveal on time', () => {
    const banner = toBanner(
      { ...base, startsAt: '2026-11-25T00:00:00Z', endsAt: '2026-11-27T06:00:00Z' },
      now,
    )
    expect(banner).toMatchObject({
      linkUrl: '/menu',
      linkLabel: null,
      startsAt: '2026-11-25T00:00:00Z',
      endsAt: '2026-11-27T06:00:00Z',
    })
    expect(banner?.text.segments).toEqual([
      { text: 'Eid', emphasis: true },
      { text: ' Mubarak', emphasis: false },
    ])
  })
})
