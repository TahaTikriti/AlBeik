import Link from 'next/link'

import { PickupCheckout } from '@/components/order/PickupCheckout'
import { ui } from '@/components/ui/classes'
import type { SiteVM } from '@/lib/data/types'
import type { CardClient } from '@/lib/pickup-card/types'
import { copy } from '@/theme/copy'

/** /order/pickup with online ordering on: when, the order, who, and payment on one screen. */
export function PickupCheckoutView({ site, client }: { site: SiteVM; client: CardClient }) {
  const location = site.locations[0]
  const place = {
    name: location?.name || site.name,
    address: location?.addressLines[0] ?? null,
    mapUrl: location?.mapUrl ?? null,
  }
  return (
    <div className={`${ui.container} grid max-w-5xl gap-6 pt-6 pb-[calc(9rem+var(--safe-bottom))] md:pt-10 md:pb-section`}>
      <header className="grid gap-3">
        <Link
          href="/menu"
          className="label inline-flex min-h-tap items-center gap-2 justify-self-start text-[0.7rem] text-ink-muted hover:text-white"
        >
          <span aria-hidden>←</span> {copy.checkout.back}
        </Link>
        <h1 className="font-display text-[2.4rem] leading-none uppercase md:text-[3rem]">
          {copy.checkout.title}
        </h1>
      </header>
      <PickupCheckout client={client} timeZone={site.timezone} place={place} />
    </div>
  )
}
