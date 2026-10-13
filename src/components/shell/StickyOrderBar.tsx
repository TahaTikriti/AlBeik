import type { OrderLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { OrderButton } from '../order/OrderButton'
import { ui } from '../ui/classes'

/** Site-wide, thumb-reachable order CTA (store-level links). Clears the iOS home indicator. */
export function StickyOrderBar({ links }: { links: OrderLink[] }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-line bg-surface pt-3 pb-[calc(0.75rem+var(--safe-bottom))]">
      <div className={ui.container}>
        <OrderButton
          links={links}
          placement="sticky"
          label={copy.order.stickyLabel}
          className={`${ui.buttonPrimary} w-full`}
        />
      </div>
    </div>
  )
}

/** Reserves room at the end of the page so the bar never covers content. */
export function StickyOrderBarSpacer() {
  return <div aria-hidden className="h-[calc(var(--spacing-tap)+1.5rem+var(--safe-bottom))]" />
}
