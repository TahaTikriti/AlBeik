import Link from 'next/link'
import { ViewTransition } from 'react'

import { DISH_PAGE_IMAGE_SIZES } from '@/components/menu/dishImage'
import { Price } from '@/components/menu/MenuPrice'
import { ScrollTopOnArrival } from '@/components/menu/ScrollTopOnArrival'
import { OrderButton } from '@/components/order/OrderButton'
import { StickyOrderBar } from '@/components/shell/StickyOrderBar'
import { Img } from '@/components/ui/Img'
import { ui } from '@/components/ui/classes'
import type { ItemPageData } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'
import { Leaf, Smoke, Steam } from '@/theme/motifs'

/**
 * Like the brand's dish posts: the name, then the dish lit in the dark.
 * Desktop puts the dish beside the name and details.
 */
export function ItemView({ item }: ItemPageData) {
  // Without a photo the page is one column: no empty half beside the name.
  const two = item.image ? 'md:col-start-2' : ''
  return (
    <>
      <ScrollTopOnArrival />
      <article className="grain relative overflow-hidden">
        <Smoke />
        <div
          className={`${ui.container} grid gap-6 pt-4 pb-section md:gap-x-14 md:pt-10 ${item.image ? 'md:grid-cols-2 md:grid-rows-[auto_auto_1fr]' : ''}`}
        >
          <p className={item.image ? 'md:col-span-2' : ''}>
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
            <h1
              className={`text-display-1 normal-case md:self-end md:text-[clamp(3rem,1.5rem+3.4vw,5.5rem)] ${two}`}
            >
              {item.name}
            </h1>
          </ViewTransition>

          {item.image ? (
            <div className="relative w-full md:col-start-1 md:row-span-2 md:row-start-2 md:self-center">
              <ViewTransition name={`dish-${item.slug}`} share="dish-photo" default="none">
                <Img
                  image={item.image}
                  sizes={DISH_PAGE_IMAGE_SIZES}
                  preload
                  className="aspect-square w-full rounded-card object-cover shadow-raised"
                />
              </ViewTransition>
              <Steam />
            </div>
          ) : null}

          <div className={`grid content-start gap-5 ${two}`}>
            {item.description ? (
              <p className="max-w-[40ch] text-xl leading-snug">{item.description}</p>
            ) : null}
            {item.tags.length ? (
              <ul className="flex flex-wrap gap-2">
                {item.tags.map((tag) => {
                  // Vegan and Vegetarian are green with a leaf, as on the menu boards.
                  const plant = tag === 'vegan' || tag === 'vegetarian'
                  return (
                    <li
                      key={tag}
                      className={`${ui.tag} ${plant ? 'gap-1.5 text-green' : 'text-red-text'}`}
                    >
                      {plant ? <Leaf className="size-[1.3em]" /> : null}
                      {copy.item.tags[tag]}
                    </li>
                  )
                })}
              </ul>
            ) : null}
            {item.price !== null && (item.comboPrice !== null || item.sizes.length) ? (
              <div className="grid gap-2">
                <dl className="flex flex-wrap gap-x-8 gap-y-2">
                  <div className="grid">
                    <dt className="label text-ink-muted">
                      {item.comboPrice !== null ? copy.menu.sandwich : copy.menu.regular}
                    </dt>
                    <dd className="font-display text-display-2">
                      <Price price={item.price} dealPrice={item.dealPrice} />
                    </dd>
                  </div>
                  {item.comboPrice !== null ? (
                    <div className="grid">
                      <dt className="label text-ink-muted">{copy.menu.combo}</dt>
                      <dd className="font-display text-display-2">
                        {formatPrice(item.comboPrice)}
                      </dd>
                    </div>
                  ) : null}
                  {item.sizes.map((size) => (
                    <div key={size.label} className="grid">
                      <dt className="label text-ink-muted">{size.label}</dt>
                      <dd className="font-display text-display-2">{formatPrice(size.price)}</dd>
                    </div>
                  ))}
                </dl>
                {item.comboPrice !== null ? (
                  <p className="text-small text-ink-muted">{copy.menu.comboNote}</p>
                ) : null}
              </div>
            ) : item.price !== null ? (
              <p className="font-display text-display-2">
                <Price price={item.price} dealPrice={item.dealPrice} />
              </p>
            ) : null}
            <OrderButton
              links={item.orderLinks}
              item={item}
              placement="item"
              label={copy.order.now}
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
