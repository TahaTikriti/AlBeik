import Link from 'next/link'

import { OrderButton } from '@/components/order/OrderButton'
import { Img } from '@/components/ui/Img'
import { ui } from '@/components/ui/classes'
import type { ItemPageData } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'
import { HalalSticker, Smoke, Steam } from '@/theme/motifs'

export function ItemView({ item }: ItemPageData) {
  return (
    <article className="grain relative overflow-hidden">
      <Smoke />
      <div
        className={`${ui.container} grid gap-8 pt-6 pb-section md:grid-cols-2 md:items-center md:gap-14 md:pt-10`}
      >
        <p className="md:col-span-2">
          <Link
            href={`/menu#${item.category.slug}`}
            className="label inline-flex min-h-tap items-center gap-2 text-ink-muted hover:text-white"
          >
            ← {copy.item.backToMenu}
          </Link>
        </p>

        <div className="relative mx-auto w-full max-w-[26rem]">
          <div
            className="absolute inset-[8%] rounded-full bg-red blur-3xl opacity-40"
            aria-hidden
          />
          {item.image ? (
            <Img
              image={item.image}
              sizes="(min-width: 768px) 26rem, 90vw"
              preload
              className="plate relative w-full"
            />
          ) : null}
          <Steam />
          <HalalSticker className="absolute -right-1 -bottom-2 text-[0.8rem]" />
        </div>

        <div className="grid content-start gap-5">
          <p className="label text-red-text">{item.category.name}</p>
          <h1 className="text-display-1">{item.name}</h1>
          {item.tags.length ? (
            <ul className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <li key={tag} className={`${ui.tag} text-red-text`}>
                  {copy.item.tags[tag]}
                </li>
              ))}
            </ul>
          ) : null}
          {item.description ? (
            <p className="max-w-[40ch] text-xl leading-snug">{item.description}</p>
          ) : null}
          {item.price !== null ? (
            <p className="font-display text-display-2">{formatPrice(item.price)}</p>
          ) : null}
          <OrderButton
            links={item.orderLinks}
            item={item}
            placement="item"
            label={copy.order.ctaFor(item.name)}
            className="btn btn-red min-h-16 w-full text-[1.6rem] md:w-auto md:px-10"
          />
        </div>
      </div>
    </article>
  )
}
