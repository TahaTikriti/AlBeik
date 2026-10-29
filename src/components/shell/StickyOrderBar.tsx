import type { OrderLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { OrderButton } from '../order/OrderButton'

type Props = {
  links: OrderLink[]
  /** On an item page: the dish. Its bar replaces the site-wide one (see brand.css). */
  item?: { slug: string; name: string } | null
}

/**
 * Thumb-reachable order CTAs on phones (desktop has them in the header):
 * delivery and pickup site-wide, the dish's own button on a dish page.
 * Clears the home indicator.
 */
export function StickyOrderBar({ links, item = null }: Props) {
  return (
    <div
      data-order-bar={item ? 'item' : 'site'}
      // Stays above the page during page changes, and morphs between the
      // site-wide and the dish bar (brand.css). Only one is ever rendered.
      style={{ viewTransitionName: 'order-bar' }}
      className="fixed inset-x-0 bottom-0 z-(--z-sticky) px-3 pb-[calc(0.6rem+var(--safe-bottom))] md:hidden"
    >
      <div className="flex items-center gap-3 rounded-card border border-white/10 bg-black/92 p-2 ps-4 shadow-raised">
        <Mustache className={`h-3 w-auto shrink-0 text-red ${item ? '' : 'max-[359px]:hidden'}`} />
        {item ? (
          <>
            <span className="grid min-w-0 flex-1">
              <span className="label text-[0.62rem] tracking-[0.1em] text-ink-muted">
                {copy.order.stickyKicker}
              </span>
              <span className="truncate font-display text-lg leading-tight">{item.name}</span>
            </span>
            <OrderButton
              links={links}
              item={item}
              placement="sticky"
              label={copy.order.cta}
              className="btn btn-red ms-auto min-h-12 shrink-0 px-6"
            />
          </>
        ) : (
          <div className="grid flex-1 grid-cols-2 gap-2">
            <OrderButton
              links={links}
              placement="sticky"
              mode="delivery"
              label={copy.order.modes.delivery.short}
              ariaLabel={copy.order.modes.delivery.cta}
              className="btn btn-red min-h-12 px-3"
            />
            <OrderButton
              links={links}
              placement="sticky"
              mode="pickup"
              label={copy.order.modes.pickup.short}
              ariaLabel={copy.order.modes.pickup.cta}
              className="btn btn-white min-h-12 px-3"
            />
          </div>
        )}
      </div>
    </div>
  )
}

/** Reserves room at the end of the page so the bar never covers content. */
export function StickyOrderBarSpacer() {
  return <div aria-hidden className="h-[calc(4.5rem+var(--safe-bottom))] md:hidden" />
}
