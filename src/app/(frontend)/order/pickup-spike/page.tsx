import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PickupBasket } from '@/components/order/PickupBasket'
import { getMenuPageData } from '@/lib/data'
import { isPickupSpikeEnabled, pickupProducts } from '@/lib/pickup-spike/basket'

export const metadata: Metadata = {
  title: 'Pickup checkout preview',
  robots: { index: false, follow: false },
}

export default async function PickupSpikePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  if (!isPickupSpikeEnabled()) notFound()

  const [menu, params] = await Promise.all([getMenuPageData({ draft: false }), searchParams])
  const products = pickupProducts(menu.categories.flatMap((category) => category.items))

  return <PickupBasket products={products} returnedFromCheckout={params.from === 'clover'} />
}
