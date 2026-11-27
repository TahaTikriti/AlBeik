'use client'

import { lazy, Suspense, useState } from 'react'

import { track, type Placement } from '@/lib/analytics'
import { copy } from '@/theme/copy'

import { emberBurst } from '../emberBurst'

// The sheet's code loads on the first tap, not with the menu.
const AddSheet = lazy(() => import('./AddSheet'))

type Props = {
  item: { slug: string; name: string }
  placement: Placement
  className: string
  label?: string
}

/** Adds a dish to the pickup bag: opens the sheet with its options, sides and extras. */
export function AddButton({ item, placement, className, label = copy.bag.add }: Props) {
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState(false)
  return (
    <>
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-label={copy.bag.addFor(item.name)}
        onClick={(event) => {
          emberBurst(event.currentTarget, event.clientX, event.clientY)
          track('order_sheet_open', { item: item.slug, placement, mode: 'pickup' })
          setOpen(true)
        }}
      >
        {added ? copy.bag.added + ' ✓' : label}
      </button>
      {open ? (
        <Suspense fallback={null}>
          <AddSheet
            item={item}
            onClose={(didAdd) => {
              setOpen(false)
              if (!didAdd) return
              setAdded(true)
              setTimeout(() => setAdded(false), 1600)
            }}
          />
        </Suspense>
      ) : null}
    </>
  )
}
