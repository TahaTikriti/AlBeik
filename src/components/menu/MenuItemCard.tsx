'use client'

import Link from 'next/link'

import type { Placement } from '@/lib/analytics'
import type { MenuItemVM } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'

import { PlusIcon } from '../ui/icons'
import { Img } from '../ui/Img'
import { useItemSheet } from './ItemSheet'

type Props = {
  item: MenuItemVM
  placement: Placement
  /** `row`: menu list. `tile`: home carousel. */
  variant?: 'row' | 'tile'
  headingLevel?: 'h2' | 'h3'
  preloadImage?: boolean
}

/**
 * A dish. The whole card opens the item sheet (details + order buttons);
 * without JS it's a plain link to the item page.
 */
export function MenuItemCard({
  item,
  placement,
  variant = 'row',
  headingLevel: Heading = 'h3',
  preloadImage = false,
}: Props) {
  const openSheet = useItemSheet()
  const canOrder = item.orderLinks.length > 0

  return (
    <Link
      href={item.href}
      onClick={(event) => {
        if (!openSheet || event.metaKey || event.ctrlKey) return
        event.preventDefault()
        openSheet(item, placement)
      }}
      className={
        variant === 'tile'
          ? 'card pressable group relative grid h-full content-start gap-3 p-4 pt-5 text-center'
          : 'card pressable group relative grid h-full grid-cols-[1fr_6.75rem] items-center gap-4 p-4'
      }
    >
      {item.image ? (
        <Img
          image={item.image}
          sizes={variant === 'tile' ? '10rem' : '6.75rem'}
          preload={preloadImage}
          className={
            variant === 'tile'
              ? 'plate mx-auto w-36 transition-transform duration-(--duration-slow) ease-out group-hover:rotate-6'
              : 'plate order-2 w-full transition-transform duration-(--duration-slow) ease-out group-hover:rotate-6'
          }
        />
      ) : null}
      <span className="grid content-start gap-1">
        {item.tags.includes('signature') ? (
          <span className={`label text-red ${variant === 'tile' ? '' : 'justify-self-start'}`}>
            ★ {copy.item.tags.signature}
          </span>
        ) : null}
        <Heading className="text-display-3">{item.name}</Heading>
        {item.description ? (
          <span className="line-clamp-2 text-small text-ink-muted">{item.description}</span>
        ) : null}
        <span
          className={`mt-2 flex items-center gap-3 ${variant === 'tile' ? 'justify-center' : ''}`}
        >
          {item.price !== null ? (
            <span className="font-bold">{formatPrice(item.price)}</span>
          ) : null}
          {canOrder ? (
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-red ps-3 pe-4 text-small font-bold text-white shadow-[var(--shadow-red)]">
              <PlusIcon className="size-4" />
              {copy.order.cta}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  )
}
