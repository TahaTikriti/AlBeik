'use client'

import { lazy, Suspense, useEffect, useState } from 'react'

import { track, type Placement } from '@/lib/analytics'
import { copy } from '@/theme/copy'

import { emberBurst } from '../emberBurst'
import type { AddItem } from './AddSheet'
import { loadProducts, prefetchProducts } from './products'

// The sheet's code loads once the page is idle (or on the first touch), not with the menu.
const importSheet = () => import('./AddSheet')
const AddSheet = lazy(importSheet)

type Props = {
  item: AddItem
  placement: Placement
  className: string
  label?: string
}

/** Adds a dish to the pickup bag: opens the sheet with its options, sides and extras. */
export function AddButton({ item, placement, className, label = copy.bag.add }: Props) {
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState(false)
  // Prices and choices load in the background, so the sheet opens complete.
  useEffect(() => {
    prefetchProducts(importSheet)
  }, [])
  const warm = () => {
    void loadProducts()
    void importSheet()
  }
  return (
    <>
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-label={copy.bag.addFor(item.name)}
        onPointerDown={warm}
        onFocus={warm}
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
