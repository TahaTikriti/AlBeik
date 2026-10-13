import Link from 'next/link'

import { OrderButton } from '@/components/order/OrderButton'
import { Img } from '@/components/ui/Img'
import { ui } from '@/components/ui/classes'
import type { ItemPageData } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'

export function ItemView({ item }: ItemPageData) {
  return (
    <article
      className={`${ui.container} ${ui.section} grid gap-stack md:grid-cols-2 md:items-start`}
    >
      <p className="md:col-span-2">
        <Link
          href={`/menu#${item.category.slug}`}
          className={`${ui.link} inline-flex min-h-tap items-center`}
        >
          {copy.item.backToMenu}
        </Link>
      </p>
      {item.image ? (
        <Img
          image={item.image}
          sizes="(min-width: 768px) 50vw, 100vw"
          preload
          className="aspect-square w-full rounded-card object-cover"
        />
      ) : null}
      <div className="grid gap-stack">
        <p className="text-label text-ink-muted">{item.category.name}</p>
        <h1 className="text-display-1">{item.name}</h1>
        {item.description ? <p>{item.description}</p> : null}
        {item.tags.length ? (
          <ul className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <li key={tag} className={ui.tag}>
                {copy.item.tags[tag]}
              </li>
            ))}
          </ul>
        ) : null}
        {item.price !== null ? <p className="text-display-3">{formatPrice(item.price)}</p> : null}
        <OrderButton links={item.orderLinks} item={item} placement="item" />
      </div>
    </article>
  )
}
