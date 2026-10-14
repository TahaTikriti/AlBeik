import type { OrderLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { OrderButton } from '../order/OrderButton'

type Props = {
  links: OrderLink[]
  /** On an item page: the dish. Its bar replaces the site-wide one (see brand.css). */
  item?: { slug: string; name: string } | null
}

/** Thumb-reachable order CTA on phones (desktop has it in the header). Clears the home indicator. */
export function StickyOrderBar({ links, item = null }: Props) {
  return (
    <div
      data-order-bar={item ? 'item' : 'site'}
      className="fixed inset-x-0 bottom-0 z-(--z-sticky) px-3 pb-[calc(0.6rem+var(--safe-bottom))] md:hidden"
    >
      <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-black/85 p-2 ps-4 shadow-raised backdrop-blur-md">
        <Mustache className="h-3 w-auto shrink-0 text-red" />
        {item ? (
          <span className="grid min-w-0 flex-1">
            <span className="label text-[0.62rem] tracking-[0.1em] text-ink-muted">
              {copy.order.stickyKicker}
            </span>
            <span className="truncate font-display text-lg leading-tight uppercase">
              {item.name}
            </span>
          </span>
        ) : (
          <span className="label min-w-0 flex-1 text-[0.66rem] leading-tight tracking-[0.1em] text-ink-muted max-[359px]:hidden">
            {copy.order.stickyKicker}
          </span>
        )}
        <OrderButton
          links={links}
          item={item}
          placement="sticky"
          label={item ? copy.order.cta : copy.order.stickyLabel}
          className="btn btn-red ms-auto min-h-12 shrink-0 px-6"
        />
      </div>
    </div>
  )
}

/** Reserves room at the end of the page so the bar never covers content. */
export function StickyOrderBarSpacer() {
  return <div aria-hidden className="h-[calc(4.5rem+var(--safe-bottom))] md:hidden" />
}
