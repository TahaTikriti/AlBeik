import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PickupWaiting } from '@/components/order/PickupWaiting'
import { ui } from '@/components/ui/classes'
import { getSite } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Your pickup order',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function PickupDonePage() {
  const site = await getSite()
  if (!site.pickup.enabled) notFound()
  const location = site.locations[0]
  const place = location
    ? {
        name: location.name,
        addressLines: location.addressLines,
        mapUrl: location.mapUrl,
        phone: location.phone,
        phoneHref: location.phoneHref,
      }
    : null
  return (
    <div className={`${ui.container} pt-10 pb-section md:pt-16`}>
      <PickupWaiting timeZone={site.timezone} place={place} />
    </div>
  )
}
