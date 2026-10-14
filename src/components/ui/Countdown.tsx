'use client'

import { useSyncExternalStore } from 'react'

import { copy } from '@/theme/copy'
import { FlipDigits } from '@/theme/motifs'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// The clock, read once a minute. Null on the server so the static page never
// ships a stale count; the client fills it in after hydration.
const subscribe = (tick: () => void) => {
  const id = setInterval(tick, MINUTE)
  return () => clearInterval(id)
}
const minuteNow = () => Math.floor(Date.now() / MINUTE) * MINUTE
const serverNow = () => null

/**
 * Flip-clock countdown to a promo ("02 days to go"), like the brand's teaser
 * posts. Hours on the last day; nothing once the moment has passed.
 */
export function Countdown({ to }: { to: string }) {
  const now = useSyncExternalStore(subscribe, minuteNow, serverNow)
  const left = Date.parse(to) - (now ?? Infinity)
  if (!(left > 0)) return null

  const unit = left >= DAY ? 'day' : 'hour'
  const n = Math.min(99, unit === 'day' ? Math.floor(left / DAY) : Math.ceil(left / HOUR))
  const text = copy.promo.left(n, unit)
  return (
    <span className="inline-flex items-center gap-2">
      <span className="sr-only">{`${n} ${text}`}</span>
      <FlipDigits value={String(n).padStart(2, '0')} className="text-[1.5rem]" />
      <span aria-hidden className="label">
        {text}
      </span>
    </span>
  )
}
