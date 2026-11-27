import { getMenuPageData } from '@/lib/data'
import { isPickupSpikeEnabled, pickupProducts, quoteBasket } from '@/lib/pickup-spike/basket'
import { createPickupCheckout } from '@/lib/pickup-spike/clover-sandbox'

export async function POST(request: Request) {
  if (!isPickupSpikeEnabled()) return new Response(null, { status: 404 })

  const basket = (await request.json().catch(() => null)) as {
    lines?: unknown
    subtotalCents?: unknown
  } | null
  if (!Array.isArray(basket?.lines)) {
    return Response.json({ error: 'Your basket is empty.' }, { status: 400 })
  }

  try {
    const menu = await getMenuPageData({ draft: false })
    const products = pickupProducts(menu.categories.flatMap((category) => category.items))
    const quote = quoteBasket(products, basket.lines)
    if (!quote) {
      return Response.json(
        { error: 'An item or quantity is unavailable. Refresh the menu and try again.' },
        { status: 400 },
      )
    }
    if (quote.subtotalCents !== basket.subtotalCents) {
      return Response.json(
        { error: 'The menu price has changed. Refresh the menu before checking out.' },
        { status: 409 },
      )
    }

    return Response.json(await createPickupCheckout(quote))
  } catch {
    return Response.json(
      { error: 'The checkout preview is unavailable. Your basket is still here.' },
      { status: 502 },
    )
  }
}
