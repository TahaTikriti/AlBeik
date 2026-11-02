'use client'

import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'

import type { OrderLink, OrderMode } from '@/lib/data/types'
import { toOrderAction } from '@/lib/order'
import { copy } from '@/theme/copy'

import { OrderButton, useOrderSheet } from './OrderButton'

const BUTTON = 'btn min-h-11 px-4 text-[1.1rem] shadow-none'

const OPTIONS: { mode: OrderMode; className: string }[] = [
  { mode: 'delivery', className: 'btn-red' },
  { mode: 'pickup', className: 'btn-charcoal' },
]

/**
 * The header's order control: "Order now" unfolds the two journeys under it,
 * each opening the platform sheet. Tapping it again, tapping elsewhere, moving
 * focus away or Esc folds them back. With one platform there's nothing to
 * choose between, so it's that platform's direct link.
 */
export function OrderMenu({ links }: { links: OrderLink[] }) {
  const root = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const action = toOrderAction(links)
  const sheet = useOrderSheet({
    links: action.kind === 'choose' ? action.links : [],
    placement: 'header',
  })

  useEffect(() => {
    if (!open) return
    const onAway = (event: Event) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      toggle.current?.focus()
    }
    document.addEventListener('pointerdown', onAway)
    document.addEventListener('focusin', onAway)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onAway)
      document.removeEventListener('focusin', onAway)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (action.kind !== 'choose') {
    return (
      <OrderButton
        links={links}
        placement="header"
        label={copy.order.now}
        className={`${BUTTON} btn-red`}
      />
    )
  }

  const choose = (mode: OrderMode, event: MouseEvent<HTMLElement>) => {
    // The sheet hands focus back to what had it: not this option, it's folded away by then.
    toggle.current?.focus()
    sheet.open(mode, event)
    setOpen(false)
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={`${BUTTON} btn-red group`}
      >
        {copy.order.now}
        <svg
          aria-hidden
          viewBox="0 0 12 8"
          className="h-2 w-3 transition-transform duration-(--duration-base) ease-out group-aria-expanded:rotate-180"
        >
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        </svg>
      </button>
      <div
        id={panelId}
        data-open={open || undefined}
        className="order-menu absolute end-0 top-[calc(100%+0.75rem)] w-44 gap-2 rounded-card border border-line bg-surface p-2 shadow-raised"
      >
        {OPTIONS.map(({ mode, className }) => (
          <button
            key={mode}
            type="button"
            aria-haspopup="dialog"
            aria-label={copy.order.modes[mode].cta}
            onClick={(event) => choose(mode, event)}
            className={`${BUTTON} ${className}`}
          >
            {copy.order.modes[mode].short}
          </button>
        ))}
      </div>
      {sheet.sheet}
    </div>
  )
}
