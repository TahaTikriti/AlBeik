import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PickupWaiting } from '@/components/order/PickupWaiting'
import { getSite } from '@/lib/data'
import { cardClientConfig, getCardConfig } from '@/lib/pickup-card/config'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Pickup order status',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function PickupWaitingPage() {
  let client
  try {
    client = cardClientConfig(getCardConfig())
  } catch {
    notFound()
  }
  const location = (await getSite()).locations[0]
  const phone =
    location?.phone && location.phoneHref
      ? { label: location.phone, href: location.phoneHref }
      : null
  return <PickupWaiting client={client} phone={phone} />
}
