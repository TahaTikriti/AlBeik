import { getMenuItemPageData, getSite } from '@/lib/data'
import { loadCardProducts } from '@/lib/pickup-card/catalog'
import { checkoutStore } from '@/lib/pickup-card/checkout-store'
import { getCardConfig } from '@/lib/pickup-card/config'
import { requestAddress, takeSlot } from '@/lib/pickup-card/limits'
import { CardError } from '@/lib/pickup-card/types'

const headers = { 'Cache-Control': 'no-store' }

/** GET /order/pickup/options?slug=… → the dish with live Clover prices and choices. */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug') ?? ''
  try {
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) throw new CardError('Unknown dish.', 404)
    const [site, page] = await Promise.all([getSite(), getMenuItemPageData(slug, { draft: false })])
    const item = page?.item
    if (!site.pickup.enabled || !item?.pickup) throw new CardError('Not sold online.', 404)
    await takeSlot(await checkoutStore(), 'options', requestAddress(request), new Date())
    const [product] = await loadCardProducts(
      getCardConfig(),
      [{ slug, options: item.pickup.options }],
      [item],
    )
    if (!product) throw new CardError('Not available right now.', 404)
    return Response.json(product, { headers })
  } catch (error) {
    const status = error instanceof CardError ? error.status : 503
    const message =
      error instanceof CardError ? error.message : 'Ordering is busy right now. Please try again.'
    return Response.json({ error: message }, { status, headers })
  }
}
