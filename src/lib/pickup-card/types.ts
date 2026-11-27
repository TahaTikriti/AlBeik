import type { ImageVM } from '@/lib/data/types'

/** A dish's link to Clover: one Clover item per option (Sandwich, Combo, Half portion…). */
export type PickupLink = { slug: string; options: { label: string; cloverItemId: string }[] }

export type CardModifier = { id: string; name: string; priceCents: number }

/** A Clover modifier group as the customer chooses from it. `max: null` = no limit. */
export type CardModifierGroup = {
  id: string
  name: string
  min: number
  max: number | null
  modifiers: CardModifier[]
}

export type CardOption = {
  /** The Clover item ID. */
  id: string
  /** The site's word for it: "Sandwich", "Combo". */
  label: string
  /** Clover's item name, used on the kitchen ticket and receipt. */
  name: string
  priceCents: number
  available: boolean
  stockLimit?: number
  groups: CardModifierGroup[]
}

export type CardProduct = {
  slug: string
  name: string
  description: string | null
  image: ImageVM | null
  options: CardOption[]
}

export type CardLine = { optionId: string; modifierIds: string[]; quantity: number }
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
  { mode: 'preview' } | { mode: 'clover'; merchantId: string; publicKey: string; sdkUrl: string }

export class CardError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
  }
}

/** Most units of one dish in a bag (Clover takes up to 50 line items per order). */
export const MAX_ITEM_QUANTITY = 20
