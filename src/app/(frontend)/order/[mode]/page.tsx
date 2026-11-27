import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getSite } from '@/lib/data'
import type { OrderMode } from '@/lib/data/types'
import { linksForMode } from '@/lib/order'
import { type CardConfig, cardClientConfig, getCardConfig } from '@/lib/pickup-card/config'
import { pageMetadata } from '@/lib/seo/metadata'
import { copy } from '@/theme/copy'
import { OrderView } from '@/views/OrderView'
import { PickupCheckoutView } from '@/views/PickupCheckoutView'

type Props = { params: Promise<{ mode: string }> }

const MODES: OrderMode[] = ['delivery', 'pickup']
const isMode = (value: string): value is OrderMode => (MODES as string[]).includes(value)

// /order/delivery and /order/pickup only; anything else is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return MODES.map((mode) => ({ mode }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mode } = await params
  if (!isMode(mode)) return {}
  return pageMetadata(await getSite(), {
    title: copy.order.modes[mode].cta,
    description: copy.order.modes[mode].line,
    path: `/order/${mode}`,
  })
}

export default async function OrderPage({ params }: Props) {
  const { mode } = await params
  if (!isMode(mode)) notFound()
  const site = await getSite()
  // Online pickup on: the checkout. Everything that changes by the minute
  // (open or closed, prices, stock) comes from /order/pickup/quote, so the
  // page itself stays static.
  const config = mode === 'pickup' && site.pickup.enabled ? cardConfig() : null
  if (config) return <PickupCheckoutView site={site} client={cardClientConfig(config)} />
  return <OrderView mode={mode} links={linksForMode(site.storeOrderLinks, mode)} />
}

/** Null when Clover isn't fully configured: the apps page stays up instead. */
function cardConfig(): CardConfig | null {
  try {
    return getCardConfig()
  } catch {
    return null
  }
}
