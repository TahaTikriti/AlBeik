'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { useBag } from './BagProvider'

export const BAG_PATH = '/order/pickup'

/**
 * Phones: once the bag has something in it, "View bag (2) · $24.30" takes
 * the place of the Delivery / Pickup bar. On the bag page itself the bar
 * steps aside.
 */
export function BagBarSwitch({ children }: { children: ReactNode }) {
  const { count, subtotalCents, online } = useBag()
  const pathname = usePathname()
  // The checkout and its confirmation have their own Pay / call buttons.
  if (online && pathname.startsWith(BAG_PATH)) return null
  if (!count) return children
  if (pathname === BAG_PATH) return null
  return (
    <div
      data-order-bar="bag"
      style={{ viewTransitionName: 'order-bar' }}
      className="fixed inset-x-0 bottom-0 z-(--z-sticky) px-3 pb-[calc(0.6rem+var(--safe-bottom))] md:hidden"
    >
      <div className="flex items-center gap-3 rounded-card border border-white/10 bg-black/92 p-2 ps-4 shadow-raised">
        <Mustache className="h-3 w-auto shrink-0 text-red" />
        <Link href={BAG_PATH} className="btn btn-red ms-auto min-h-12 flex-1 px-4">
          {copy.bag.view(count, formatPrice(subtotalCents / 100))}
        </Link>
      </div>
    </div>
  )
}

/** Header (tablet and up): the bag with its count, once it has something in it. */
export function BagLink() {
  const { count } = useBag()
  const pathname = usePathname()
  if (!count || pathname === BAG_PATH) return null
  return (
    <Link href={BAG_PATH} className="btn btn-ink min-h-11 px-4 text-[1rem]">
      {copy.bag.viewShort(count)}
    </Link>
  )
}
