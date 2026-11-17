import Link from 'next/link'
import { ViewTransition } from 'react'

import type { Placement } from '@/lib/analytics'
import type { MenuItemVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Leaf } from '@/theme/motifs'

import { OrderButton } from '../order/OrderButton'
import { MenuPrice } from './MenuPrice'

type Props = { item: MenuItemVM; placement: Placement }

/**
 * A dish as a line on a menu board, for categories without photos (drinks,
 * desserts, dishes still waiting for theirs): name and description, the
 * order button at the end of the line (the description clamped to two lines
 * on phones, like the cards). The whole row opens the dish.
 */
export function MenuItemRow({ item, placement }: Props) {
  // Vegan or Vegetarian beside the name, green with a leaf, as on the menu boards.
  const plant = item.tags.includes('vegan')
    ? 'vegan'
    : item.tags.includes('vegetarian')
      ? 'vegetarian'
      : null
  return (
    <article className="group relative grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-line py-4 sm:py-5">
      <div className="grid gap-1 sm:gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <ViewTransition name={`dish-name-${item.slug}`} share="dish-name" default="none">
            <h3 className="text-[1.2rem] leading-[1.1] normal-case sm:text-[1.65rem] sm:leading-[1.05]">
              <Link
                href={item.href}
                className="after:absolute after:inset-0 group-hover:text-red-text"
              >
                {item.name}
              </Link>
            </h3>
          </ViewTransition>
          {plant ? (
            <span className="label inline-flex items-center gap-1 text-[0.7rem] text-green">
              <Leaf className="size-[1.3em]" />
              {copy.item.tags[plant]}
            </span>
          ) : null}
        </div>
        {item.description ? (
          <p className="line-clamp-2 max-w-[48ch] text-[0.875rem] leading-[1.4] text-ink-muted sm:line-clamp-none sm:text-small">
            {item.description}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <MenuPrice item={item} className="justify-items-end text-end" />
        <OrderButton
          links={item.orderLinks}
          item={item}
          placement={placement}
          className="btn btn-ghost relative z-10 min-h-11 px-4 text-[1rem] sm:px-5 sm:text-[1.1rem]"
        />
      </div>
    </article>
  )
}
