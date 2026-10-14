import type { OrderLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { OrderButton } from '../order/OrderButton'

/** Thumb-reachable order CTA on phones (desktop has it in the header). Clears the home indicator. */
export function StickyOrderBar({ links }: { links: OrderLink[] }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-(--z-sticky) px-3 pb-[calc(0.6rem+var(--safe-bottom))] md:hidden">
      <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-black/85 p-2 ps-4 shadow-raised backdrop-blur-md">
        <Mustache className="h-3.5 w-auto shrink-0 text-red" />
        <span className="label min-w-0 flex-1 text-[0.66rem] leading-tight tracking-[0.1em] text-ink-muted">
          {copy.order.stickyKicker}
        </span>
        <OrderButton
          links={links}
          placement="sticky"
          label={copy.order.stickyLabel}
          className="btn btn-red min-h-12 shrink-0 px-6"
        />
      </div>
    </div>
  )
}

/** Reserves room at the end of the page so the bar never covers content. */
export function StickyOrderBarSpacer() {
  return <div aria-hidden className="h-[calc(4.5rem+var(--safe-bottom))] md:hidden" />
}
