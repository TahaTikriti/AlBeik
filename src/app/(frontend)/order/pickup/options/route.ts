import { getSite } from '@/lib/data'
import { currentProducts } from '@/lib/pickup-card/checkout'
import { checkoutStore } from '@/lib/pickup-card/checkout-store'
import { getCardConfig } from '@/lib/pickup-card/config'
import { requestAddress, takeSlot } from '@/lib/pickup-card/limits'
import { CardError, type CardProduct } from '@/lib/pickup-card/types'

/**
 * GET /order/pickup/options → every dish sold online, with Clover prices and
 * choices. The browser loads it once per visit, so Add opens instantly. A
 * short shared cache keeps Clover out of most visits; the checkout re-prices
 * the bag live before anyone pays.
 */
export async function GET(request: Request) {
  try {
    const site = await getSite()
    if (!site.pickup.enabled) throw new CardError('Not sold online.', 404)
    const products = await cached(async () => {
      await takeSlot(await checkoutStore(), 'options', requestAddress(request), new Date())
      return currentProducts(getCardConfig())
    })
    return Response.json(
      { products },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=300' } },
    )
  } catch (error) {
    const status = error instanceof CardError ? error.status : 503
    const message =
      error instanceof CardError ? error.message : 'Ordering is busy right now. Please try again.'
    return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
  }
}

// One server instance's copy, for the moments the shared cache misses.
let memo: { at: number; products: Promise<CardProduct[]> } | null = null

function cached(load: () => Promise<CardProduct[]>) {
  if (memo && Date.now() - memo.at < 30_000) return memo.products
  const products = load()
  memo = { at: Date.now(), products }
  products.catch(() => {
    if (memo?.products === products) memo = null
  })
  return products
}
