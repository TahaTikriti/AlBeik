import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getSite } from '@/lib/data'
import type { OrderMode } from '@/lib/data/types'
import { linkForMode } from '@/lib/order'
import { pageMetadata } from '@/lib/seo/metadata'
import { copy } from '@/theme/copy'
import { OrderView } from '@/views/OrderView'

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
  return (
    <OrderView mode={mode} links={site.storeOrderLinks.map((link) => linkForMode(link, mode))} />
  )
}
