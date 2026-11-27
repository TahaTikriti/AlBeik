import { getSite } from '@/lib/data'
import { assertOrderingOpen, checkoutResponse, currentQuote, readCheckoutBody } from '@/lib/pickup-card/checkout'

/** The bag's live Clover price and tax, and when it would be ready. */
export async function POST(request: Request) {
  return checkoutResponse(async (config) => {
    const body = await readCheckoutBody(request)
    const site = await getSite()
    const now = new Date()
    assertOrderingOpen(site, now)
    const { quote } = await currentQuote(config, body.lines)
    return { ...quote, readyAt: new Date(now.getTime() + site.pickup.prepMinutes * 60_000).toISOString() }
  })
}
