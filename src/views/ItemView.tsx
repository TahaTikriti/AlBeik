import Link from 'next/link'
import { ViewTransition } from 'react'

import { DISH_PAGE_IMAGE_SIZES } from '@/components/menu/dishImage'
import { ScrollTopOnArrival } from '@/components/menu/ScrollTopOnArrival'
import { OrderButton } from '@/components/order/OrderButton'
import { StickyOrderBar } from '@/components/shell/StickyOrderBar'
import { Img } from '@/components/ui/Img'
import { ui } from '@/components/ui/classes'
import type { ItemPageData } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'
import { Smoke, Steam } from '@/theme/motifs'

/**
 * Like the brand's dish posts: the name, then the dish lit in the dark.
 * Desktop puts the dish beside the name and details.
 */
export function ItemView({ item }: ItemPageData) {
  return (
    <>
      <ScrollTopOnArrival />
      <article className="grain relative overflow-hidden">
        <Smoke />
        <div
          className={`${ui.container} grid gap-6 pt-4 pb-section md:grid-cols-2 md:grid-rows-[auto_auto_1fr] md:gap-x-14 md:pt-10`}
        >
          <p className="md:col-span-2">
            <Link
              href={`/menu#${item.category.slug}`}
              aria-label={copy.item.backTo(item.category.name)}
              className="label inline-flex min-h-tap items-center gap-2 text-ink-muted hover:text-white"
            >
              ← {item.category.name}
            </Link>
          </p>

          {/* The menu card's photo and name morph into these (see MenuItemCard). */}
          <ViewTransition name={`dish-name-${item.slug}`} share="dish-name" default="none">
            <h1 className="text-display-1 normal-case md:col-start-2 md:self-end md:text-[clamp(3rem,1.5rem+3.4vw,5.5rem)]">
              {item.name}
            </h1>
          </ViewTransition>

          <div className="relative w-full md:col-start-1 md:row-span-2 md:row-start-2 md:self-center">
            {item.image ? (
              <ViewTransition name={`dish-${item.slug}`} share="dish-photo" default="none">
                <Img
                  image={item.image}
                  sizes={DISH_PAGE_IMAGE_SIZES}
                  preload
                  className="aspect-square w-full rounded-card object-cover shadow-raised"
                />
              </ViewTransition>
            ) : null}
            <Steam />
          </div>

          <div className="grid content-start gap-5 md:col-start-2">
            {item.description ? (
              <p className="max-w-[40ch] text-xl leading-snug">{item.description}</p>
            ) : null}
            {item.tags.length ? (
              <ul className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <li key={tag} className={`${ui.tag} text-red-text`}>
                    {copy.item.tags[tag]}
                  </li>
                ))}
              </ul>
            ) : null}
            {item.price !== null ? (
              <p className="font-display text-display-2">{formatPrice(item.price)}</p>
            ) : null}
            <OrderButton
              links={item.orderLinks}
              item={item}
              placement="item"
              label={copy.order.stickyLabel}
              className="btn btn-red min-h-16 w-full text-[1.6rem] md:w-auto md:justify-self-start md:px-10"
            />
          </div>
        </div>
      </article>
      {/* Outside the article: .grain isolates stacking, which would let the footer paint over it. */}
      {item.orderLinks.length ? <StickyOrderBar links={item.orderLinks} item={item} /> : null}
    </>
  )
}
