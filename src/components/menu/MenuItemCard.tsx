import Link from 'next/link'

import type { Placement } from '@/lib/analytics'
import type { MenuItemVM } from '@/lib/data/types'
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

/**
 * A menu row: round "plate" photo that hangs off the card, big condensed
 * name, order button. From two columns up, the button row is pinned to the
 * bottom so buttons line up across a row whatever the name's length.
 */
export function MenuItemCard({
  item,
  placement,
  headingLevel: Heading = 'h3',
  preloadImage = false,
}: Props) {
  return (
    <article className="group reveal relative grid h-full grid-cols-[6.5rem_1fr] gap-x-4 gap-y-3 rounded-card bg-coal p-4 ps-3 sm:grid-cols-1 sm:grid-rows-[auto_1fr_auto] sm:gap-y-5 sm:px-5 sm:pt-0 sm:pb-5 sm:text-center">
      <Link
        href={item.href}
        tabIndex={-1}
        aria-hidden
        className="relative -my-1 sm:mx-auto sm:-mt-14 sm:w-44"
      >
        {item.image ? (
          <Img
            image={item.image}
            sizes="(min-width: 640px) 11rem, 6.5rem"
            preload={preloadImage}
            className="plate w-full transition-transform duration-(--duration-slow) ease-out group-hover:scale-105 group-hover:-rotate-3"
          />
        ) : (
          <span className="plate grid w-full place-items-center bg-char font-display text-4xl">
            {item.name.charAt(0)}
          </span>
        )}
      </Link>
      <div className="grid content-start gap-1.5">
        {item.tags.length ? (
          <ul className="flex flex-wrap gap-1.5 sm:justify-center">
            {item.tags.map((tag) => (
              <li key={tag} className="label text-[0.65rem] text-red-text">
                ★ {copy.item.tags[tag]}
              </li>
            ))}
          </ul>
        ) : null}
        <Heading className="text-[1.75rem] leading-[0.95]">
          <Link href={item.href} className="inline-block py-1 hover:text-red-text">
            {item.name}
          </Link>
        </Heading>
        {item.description ? (
          <p className="line-clamp-3 text-small text-ink-muted sm:line-clamp-2">
            {item.description}
          </p>
        ) : null}
      </div>
      <div className="col-span-2 flex items-center justify-end gap-3 sm:col-span-1 sm:justify-center">
        {item.price !== null ? (
          <span className="me-auto font-display text-2xl sm:me-0">{formatPrice(item.price)}</span>
        ) : null}
        <OrderButton
          links={item.orderLinks}
          item={item}
          placement={placement}
          className="btn btn-red min-h-11 px-6 text-[1.15rem] shadow-none"
        />
      </div>
    </article>
  )
}
