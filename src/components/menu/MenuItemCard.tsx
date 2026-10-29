import Link from 'next/link'
import { ViewTransition } from 'react'

import type { Placement } from '@/lib/analytics'
import type { MenuItemVM, MenuTag } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { OrderButton } from '../order/OrderButton'
import { Img } from '../ui/Img'
import { dishPreloadAttrs } from './dishImage'

type Props = {
  item: MenuItemVM
  placement: Placement
  headingLevel?: 'h2' | 'h3'
  /** Preload the photo: set on the first card above the fold (LCP). */
  preloadImage?: boolean
}

/** One tag rides on the photo as a sticker; the item page lists them all. */
const BADGE_ORDER: MenuTag[] = ['signature', 'popular', 'new', 'spicy', 'vegetarian']

/**
 * A menu card: the dish photo (a thumbnail on phones, full-bleed on top from
 * sm up), the name in title case as in the brand guidelines, order button.
 * The description is clamped to two lines and the button row is pinned to
 * the bottom, so every card in a list is the same size (the list sets equal
 * rows). The whole card opens the dish; the order button sits above that link.
 */
export function MenuItemCard({
  item,
  placement,
  headingLevel: Heading = 'h3',
  preloadImage = false,
}: Props) {
  const badge = BADGE_ORDER.find((tag) => item.tags.includes(tag))
  return (
    <article
      {...dishPreloadAttrs(item.image)}
      data-spotlight
      className="group relative isolate grid h-full grid-cols-[clamp(5.25rem,25vw,6.75rem)_1fr] items-center gap-x-3.5 overflow-clip rounded-card bg-charcoal p-3 pe-4 transition-[scale] duration-(--duration-fast) active:scale-[0.985] sm:grid-cols-1 sm:grid-rows-[auto_1fr_auto] sm:items-stretch sm:gap-y-4 sm:p-0 sm:pb-5"
    >
      {/* Photo and name morph into the dish page (see ItemView). */}
      <ViewTransition name={`dish-${item.slug}`} share="dish-photo" default="none">
        <div className="relative overflow-clip rounded-control sm:rounded-none">
          {item.image ? (
            <Img
              image={item.image}
              sizes="(min-width: 1024px) 24rem, (min-width: 640px) 46vw, 25vw"
              preload={preloadImage}
              className="settle aspect-square w-full object-cover transition-transform duration-(--duration-slow) ease-out group-hover:scale-105 sm:aspect-[4/3]"
            />
          ) : (
            // No photo yet: the brand's mustache holds the dish's place.
            <span className="grid aspect-square w-full place-items-center bg-black text-red sm:aspect-[4/3]">
              <Mustache className="h-auto w-1/2" />
            </span>
          )}
          {badge ? (
            <span className="label absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-1 text-[0.6rem] whitespace-nowrap text-black shadow-raised sm:top-3 sm:bottom-auto sm:left-3 sm:translate-x-0">
              ★ {copy.item.tags[badge]}
            </span>
          ) : null}
        </div>
      </ViewTransition>
      {/* Phones: text on top, button pinned below. From sm up the card's own rows take over. */}
      <div className="grid h-full grid-rows-[1fr_auto] gap-3 py-1 sm:contents">
        <div className="grid content-start gap-1.5 sm:px-5">
          {/* Never clamped: a menu must show the whole name. Scales down on narrow phones. */}
          <ViewTransition name={`dish-name-${item.slug}`} share="dish-name" default="none">
            <Heading className="text-[clamp(1.35rem,0.6rem+3.8vw,1.65rem)] leading-[1.05] normal-case sm:text-[1.85rem]">
              <Link
                href={item.href}
                className="after:absolute after:inset-0 after:rounded-card group-hover:text-red-text"
              >
                {item.name}
              </Link>
            </Heading>
          </ViewTransition>
          {item.description ? (
            <p className="line-clamp-2 text-small text-ink-muted">{item.description}</p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-3 sm:justify-start sm:px-5">
          {item.price !== null ? (
            <span className="me-auto font-display text-2xl">{formatPrice(item.price)}</span>
          ) : null}
          <OrderButton
            links={item.orderLinks}
            item={item}
            placement={placement}
            className="btn btn-red relative z-10 min-h-11 px-6 text-[1.15rem] shadow-none"
          />
        </div>
      </div>
    </article>
  )
}
