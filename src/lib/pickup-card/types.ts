import type { ImageVM } from '@/lib/data/types'

export type CardProduct = {
  slug: string
  name: string
  description: string | null
  image: ImageVM | null
  options: {
    id: string
    name: string
    priceCents: number
    available: boolean
    stockLimit?: number
    extras: { id: string; name: string; priceCents: number }[]
  }[]
}

export type CardLine = { optionId: string; extraIds: string[]; quantity: number }
export type CardQuote = {
  subtotalCents: number
  taxCents: number
  totalCents: number
  lines: { name: string; quantity: number; unitCents: number }[]
  quoteId: string
}

export type CardReceipt = {
  orderId: string
  status: 'paid' | 'pending' | 'declined' | 'review'
  printStatus: 'simulated' | 'requested' | 'unconfirmed' | 'not-requested'
  totalCents: number
}

export type CardClient =
  { mode: 'preview' } | { mode: 'sandbox'; merchantId: string; publicKey: string }

export class CardError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
  }
}
