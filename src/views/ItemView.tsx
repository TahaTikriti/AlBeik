import Link from 'next/link'

import { PlatformButtons } from '@/components/order/PlatformButtons'
import { BackIcon } from '@/components/ui/icons'
import { Img } from '@/components/ui/Img'
import { ui } from '@/components/ui/classes'
import type { ItemPageData } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'

/** Full item page (deep links); on the menu the same details open in a sheet. */
export function ItemView({ item }: ItemPageData) {
  return (
    <article
      className={`${ui.container} grid gap-6 pt-4 pb-section md:grid-cols-2 md:items-center md:gap-12 md:pt-10`}
    >
      <div className="flex items-center justify-between md:col-span-2">
        <Link
          href={`/menu#${item.category.slug}`}
          className="inline-flex min-h-tap items-center gap-2 rounded-full bg-surface-raised pe-5 ps-3 font-semibold shadow-[var(--shadow-raised)]"
        >
          <BackIcon className="size-5" />
          {copy.item.backToMenu}
        </Link>
        <span className="label text-ink-muted">{item.category.name}</span>
      </div>

      <div className="relative mx-auto w-[min(22rem,80vw)]">
        <div className="absolute inset-[-7%] rounded-full bg-surface-sunken" aria-hidden />
        {item.image ? (
          <Img
            image={item.image}
            sizes="(min-width: 768px) 22rem, 80vw"
            preload
            className="plate float relative w-full"
          />
        ) : null}
      </div>

      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-display-1">{item.name}</h1>
          {item.price !== null ? (
            <span className="shrink-0 rounded-full border-2 border-red px-4 py-1.5 font-bold text-red">
              {formatPrice(item.price)}
            </span>
          ) : null}
        </div>
        {item.tags.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <li key={tag} className={ui.tag}>
                {copy.item.tags[tag]}
              </li>
            ))}
          </ul>
        ) : null}
        {item.description ? (
          <p className="text-lg leading-relaxed text-ink-muted">{item.description}</p>
        ) : null}
        {item.orderLinks.length ? (
          <div className="grid gap-3 pt-2">
            <p className="label text-ink-muted">{copy.item.orderTitle}</p>
            <PlatformButtons links={item.orderLinks} item={item} placement="item" />
          </div>
        ) : null}
      </div>
    </article>
  )
}
