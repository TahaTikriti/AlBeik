import { PickupCheckout } from '@/components/order/PickupCheckout'
import { PunchLine } from '@/components/ui/PunchLine'
import { ui } from '@/components/ui/classes'
import type { SiteVM } from '@/lib/data/types'
import type { CardClient } from '@/lib/pickup-card/types'
import { copy } from '@/theme/copy'

/** /order/pickup with online ordering on: the bag, details and payment on one screen. */
export function PickupCheckoutView({ site, client }: { site: SiteVM; client: CardClient }) {
  const place = site.locations[0]
  return (
    <div className={`${ui.container} grid gap-8 pt-10 pb-section md:pt-16`}>
      <header className="grid max-w-xl gap-2">
        <p className="label text-red-text">
          {copy.checkout.eyebrow}
          {place?.addressLines[0] ? ` · ${place.addressLines[0]}` : ''}
        </p>
        <h1 className="text-display-1">
          <PunchLine text={copy.checkout.title} />
        </h1>
      </header>
      <div className="max-w-xl">
        <PickupCheckout client={client} timeZone={site.timezone} />
      </div>
    </div>
  )
}
