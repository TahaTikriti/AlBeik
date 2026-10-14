'use client'

import Link from 'next/link'

import type { OrderLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { OrderButton } from '../order/OrderButton'
import { BagIcon } from '../ui/icons'
import { NAV, useIsCurrent } from './NavLinks'

/** Phone navigation: four tabs with a raised red order button in the middle. */
export function TabBar({ storeLinks }: { storeLinks: OrderLink[] }) {
  const isCurrent = useIsCurrent()
  const tab = (item: (typeof NAV)[number]) => (
    <li key={item.href} className="flex-1">
      <Link
        href={item.href}
        aria-current={isCurrent(item.href) ? 'page' : undefined}
        className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold text-ink-muted transition-colors aria-[current=page]:text-red"
      >
        <item.Icon className="size-[1.35rem]" />
        {item.label}
      </Link>
    </li>
  )

  return (
    <nav
      aria-label={copy.nav.label}
      className="fixed inset-x-0 bottom-0 z-(--z-sticky) px-3 pb-[calc(0.5rem+var(--safe-bottom))] md:hidden"
    >
      <ul className="flex items-center rounded-[1.6rem] bg-surface-raised px-1 shadow-[0_-2px_30px_rgb(27_22_18/0.14)]">
        {NAV.slice(0, 2).map(tab)}
        {storeLinks.length ? (
          <li className="-mt-7 px-1">
            <OrderButton
              links={storeLinks}
              placement="sticky"
              label={copy.order.stickyLabel}
              className="grid size-16 place-items-center rounded-full bg-red text-white shadow-[var(--shadow-red)] ring-4 ring-surface transition-transform duration-(--duration-fast) active:scale-95"
            >
              <span className="grid justify-items-center gap-0.5 text-[0.65rem] font-bold">
                <BagIcon className="size-6" />
                {copy.order.stickyLabel}
              </span>
            </OrderButton>
          </li>
        ) : null}
        {NAV.slice(2).map(tab)}
      </ul>
    </nav>
  )
}

/** Reserves room so the tab bar never covers the end of the page. */
export function TabBarSpacer() {
  return <div aria-hidden className="h-[calc(var(--tabbar-h)+var(--safe-bottom))] md:hidden" />
}
