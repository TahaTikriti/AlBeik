import Link from 'next/link'

import type { Placement } from '@/lib/analytics'
import type { MenuItemVM, MenuTag } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'

import { OrderButton } from '../order/OrderButton'
import { Img } from '../ui/Img'

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
 * A menu card: round "plate" photo in a red glow, big condensed name,
 * order button. Name and description are clamped to two lines and the
 * button row is pinned to the bottom, so every card in a list is the same
 * size (the list sets equal rows). The whole card opens the dish; the
 * order button sits above that link.
 */
export function MenuItemCard({
  item,
  placement,
  headingLevel: Heading = 'h3',
  preloadImage = false,
}: Props) {
  const badge = BADGE_ORDER.find((tag) => item.tags.includes(tag))
  return (
    <article className="group relative grid h-full grid-cols-[6.75rem_1fr] items-center gap-x-4 rounded-card bg-coal p-3 pe-4 transition-[background-color,scale] duration-(--duration-fast) hover:bg-char active:scale-[0.985] sm:grid-cols-1 sm:grid-rows-[auto_1fr_auto] sm:items-stretch sm:gap-y-4 sm:px-5 sm:pt-0 sm:pb-5 sm:text-center">
      <div className="relative sm:mx-auto sm:-mt-14 sm:w-44">
        <span
          aria-hidden
          className="absolute -inset-3 rounded-full bg-[radial-gradient(closest-side,rgb(216_38_47/0.5),transparent)] opacity-60 blur-md transition-opacity duration-(--duration-slow) group-hover:opacity-100"
        />
        {item.image ? (
          <Img
            image={item.image}
            sizes="(min-width: 640px) 11rem, 6.75rem"
            preload={preloadImage}
            className="plate relative w-full transition-transform duration-(--duration-slow) ease-out group-hover:scale-105 group-hover:-rotate-3"
          />
        ) : (
          <span className="plate relative grid w-full place-items-center bg-char font-display text-4xl">
            {item.name.charAt(0)}
          </span>
        )}
        {badge ? (
          <span className="label absolute -bottom-1.5 left-1/2 -translate-x-1/2 -rotate-6 rounded-full bg-white px-2 py-1 text-[0.6rem] whitespace-nowrap text-black shadow-raised">
            ★ {copy.item.tags[badge]}
          </span>
        ) : null}
      </div>
      {/* Phones: text on top, button pinned below. From sm up the card's own rows take over. */}
      <div className="grid h-full grid-rows-[1fr_auto] gap-3 py-1 sm:contents">
        <div className="grid content-start gap-1 sm:pt-1">
          <Heading className="line-clamp-2 text-[1.6rem] leading-none sm:text-[1.75rem]">
            <Link
              href={item.href}
              className="after:absolute after:inset-0 after:rounded-card group-hover:text-red-text"
            >
              {item.name}
            </Link>
          </Heading>
          {item.description ? (
            <p className="line-clamp-2 text-small text-ink-muted">{item.description}</p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-3 sm:justify-center">
          {item.price !== null ? (
            <span className="me-auto font-display text-2xl sm:me-0">{formatPrice(item.price)}</span>
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
