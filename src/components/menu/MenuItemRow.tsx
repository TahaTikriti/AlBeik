import Link from 'next/link'
import { ViewTransition } from 'react'

import type { Placement } from '@/lib/analytics'
import type { MenuItemVM } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'

import { OrderButton } from '../order/OrderButton'

type Props = { item: MenuItemVM; placement: Placement }

/**
 * A dish as a line on a menu board, for categories without photos (drinks,
 * desserts, dishes still waiting for theirs): name and description, the
 * order button at the end of the line. The whole row opens the dish.
 */
export function MenuItemRow({ item, placement }: Props) {
  return (
    <article className="group relative grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-line py-5">
      <div className="grid gap-1.5">
        <ViewTransition name={`dish-name-${item.slug}`} share="dish-name" default="none">
          <h3 className="text-[clamp(1.35rem,0.6rem+3.8vw,1.65rem)] leading-[1.05] normal-case sm:text-[1.85rem]">
            <Link
              href={item.href}
              className="after:absolute after:inset-0 group-hover:text-red-text"
            >
              {item.name}
            </Link>
          </h3>
        </ViewTransition>
        {item.description ? (
          <p className="max-w-[48ch] text-small text-ink-muted">{item.description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {item.price !== null ? (
          <span className="font-display text-2xl">{formatPrice(item.price)}</span>
        ) : null}
        <OrderButton
          links={item.orderLinks}
          item={item}
          placement={placement}
          className="btn btn-ghost relative z-10 min-h-11 px-5 text-[1.1rem]"
        />
      </div>
    </article>
  )
}
