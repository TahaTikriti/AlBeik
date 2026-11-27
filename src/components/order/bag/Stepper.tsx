'use client'

import { copy } from '@/theme/copy'

/** − n + : a quantity, between `min` and `max`. */
export function Stepper({
  value,
  max,
  min = 1,
  size = 'md',
  onChange,
}: {
  value: number
  max: number
  min?: number
  size?: 'sm' | 'md'
  onChange: (value: number) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-black p-1">
      <button
        type="button"
        aria-label={copy.bag.fewer}
        className={`grid ${size === 'sm' ? 'size-10 text-lg' : 'size-10 text-xl'} place-items-center rounded-full disabled:opacity-40`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span aria-live="polite" className="min-w-8 text-center font-display text-xl tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label={copy.bag.more}
        className={`grid ${size === 'sm' ? 'size-10 text-lg' : 'size-10 text-xl'} place-items-center rounded-full disabled:opacity-40`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}
