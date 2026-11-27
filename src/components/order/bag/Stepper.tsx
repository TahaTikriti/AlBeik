'use client'

import { copy } from '@/theme/copy'

/** − n + : a quantity, between `min` and `max`. */
export function Stepper({
  value,
  max,
  min = 1,
  size = 'md',
  removeLabel,
  onChange,
}: {
  value: number
  max: number
  min?: number
  size?: 'sm' | 'md'
  /** With `min` 0: at one, − becomes a bin that removes the line. */
  removeLabel?: string
  onChange: (value: number) => void
}) {
  const removes = Boolean(removeLabel) && value === 1 && min === 0
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-black p-1">
      <button
        type="button"
        aria-label={removes ? removeLabel : copy.bag.fewer}
        className={`grid ${size === 'sm' ? 'size-10 text-lg' : 'size-10 text-xl'} place-items-center rounded-full disabled:opacity-40`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        {removes ? (
          <svg aria-hidden viewBox="0 0 16 16" className="size-4">
            <path
              d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          '−'
        )}
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
