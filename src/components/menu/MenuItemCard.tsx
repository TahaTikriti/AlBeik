import Link from 'next/link'

import type { Placement } from '@/lib/analytics'
import type { MenuItemVM } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'

import { OrderButton } from '../order/OrderButton'
import { Img } from '../ui/Img'
import { ui } from '../ui/classes'

type Props = { item: MenuItemVM; placement: Placement; headingLevel?: 'h2' | 'h3' }

export function MenuItemCard({ item, placement, headingLevel: Heading = 'h3' }: Props) {
  return (
    <article className="grid gap-3 rounded-card border border-line p-4">
      {item.image ? (
        <Img
          image={item.image}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
          className="aspect-square w-full rounded-control object-cover"
        />
      ) : null}
      <div className="grid gap-1">
        <Heading className="text-display-3">
          <Link href={item.href} className="hover:underline">
            {item.name}
          </Link>
        </Heading>
        {item.description ? <p className="text-small text-ink-muted">{item.description}</p> : null}
      </div>
      {item.tags.length || item.price !== null ? (
        <div className="flex flex-wrap items-center gap-2">
          {item.tags.map((tag) => (
            <span key={tag} className={ui.tag}>
              {copy.item.tags[tag]}
            </span>
          ))}
          {item.price !== null ? (
            <span className="ms-auto font-semibold">{formatPrice(item.price)}</span>
          ) : null}
        </div>
      ) : null}
      <OrderButton links={item.orderLinks} item={item} placement={placement} />
    </article>
  )
}
