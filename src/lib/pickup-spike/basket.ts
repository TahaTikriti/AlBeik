import type { ImageVM, MenuItemVM } from '@/lib/data/types'

export const PICKUP_SPIKE_PATH = '/order/pickup-spike'
export const MAX_ITEM_QUANTITY = 9

const SAMPLE_SLUGS = ['chicken-tawouk-sandwich', 'albeik-smashed-burger', 'falafel-sandwich']

export type PickupOption = { id: string; name: string; priceCents: number }
export type PickupProduct = {
  slug: string
  name: string
  description: string | null
  image: ImageVM | null
  options: PickupOption[]
}
export type BasketLine = PickupOption & { quantity: number }
export type BasketQuote = { lines: BasketLine[]; subtotalCents: number }
export type CheckoutResult =
  | { kind: 'preview'; quote: BasketQuote }
  | { kind: 'clover-sandbox'; url: string; sessionId: string }

export function isPickupSpikeEnabled() {
  return process.env.PICKUP_SPIKE_ENABLED === '1'
}

export function pickupProducts(items: MenuItemVM[]): PickupProduct[] {
  return SAMPLE_SLUGS.flatMap((slug) => {
    const item = items.find((candidate) => candidate.slug === slug)
    if (!item) return []

    const options: PickupOption[] = []
    const price = item.dealPrice ?? item.price
    if (price != null && price > 0) {
      options.push({ id: slug, name: item.name, priceCents: Math.round(price * 100) })
    }
    if (item.comboPrice != null && item.comboPrice > 0) {
      options.push({
        id: `${slug}:combo`,
        name: `${item.name} Combo`,
        priceCents: Math.round(item.comboPrice * 100),
      })
    }

    return options.length
      ? [{ slug, name: item.name, description: item.description, image: item.image, options }]
      : []
  })
}

/** Accept identifiers and quantities only. Prices come from the current published menu. */
export function quoteBasket(products: PickupProduct[], input: unknown): BasketQuote | null {
  const options = products.flatMap((product) => product.options)
  if (!Array.isArray(input) || input.length === 0 || input.length > options.length) return null

  const seen = new Set<string>()
  const lines: BasketLine[] = []
  for (const line of input) {
    if (line == null || typeof line !== 'object') return null
    const { id, quantity } = line as { id?: unknown; quantity?: unknown }
    if (typeof id !== 'string' || seen.has(id)) return null
    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) return null
    if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) return null

    const option = options.find((candidate) => candidate.id === id)
    if (!option) return null

    seen.add(id)
    lines.push({ ...option, quantity })
  }

  return {
    lines,
    subtotalCents: lines.reduce((subtotal, line) => subtotal + line.priceCents * line.quantity, 0),
  }
}
