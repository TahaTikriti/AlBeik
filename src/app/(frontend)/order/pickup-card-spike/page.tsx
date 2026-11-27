import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { EmbeddedPickup } from '@/components/order/EmbeddedPickup'
import { currentProducts } from '@/lib/pickup-card/checkout'
import { cardClientConfig, getCardConfig } from '@/lib/pickup-card/config'
import { CardError } from '@/lib/pickup-card/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Pickup checkout preview',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function EmbeddedPickupPage() {
  let props: Parameters<typeof EmbeddedPickup>[0]
  try {
    const config = getCardConfig()
    const products = await currentProducts(config)
    props = { products, client: cardClientConfig(config) }
  } catch (error) {
    if (error instanceof CardError && error.status === 404) notFound()
    return (
      <section className="mx-auto max-w-prose px-5 py-section">
        <h1 className="text-display-2">Pickup preview unavailable</h1>
        <p className="mt-4">
          {error instanceof CardError
            ? error.message
            : 'The pickup menu could not be loaded. Please try again.'}
        </p>
        <form method="get" className="mt-6">
          <button type="submit" className="btn btn-red">
            Reload pickup menu
          </button>
        </form>
      </section>
    )
  }
  return <EmbeddedPickup {...props} />
}
