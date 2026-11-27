import { getSite } from '@/lib/data'
import { requestAddress, takeSlot } from '@/lib/pickup-card/limits'
import { checkoutStore } from '@/lib/pickup-card/checkout-store'
import { checkoutResponse, currentQuote, pickupPlan, readCheckoutBody } from '@/lib/pickup-card/checkout'

/** The bag's live Clover price and tax, when it would be ready, and the later times today. */
export async function POST(request: Request) {
  return checkoutResponse(async (config) => {
    const body = await readCheckoutBody(request)
    const site = await getSite()
    const now = new Date()
    const plan = pickupPlan(site, now)
    await takeSlot(await checkoutStore(), 'quote', requestAddress(request), now)
    const { quote } = await currentQuote(config, body.lines)
    return { ...quote, readyAt: plan.readyAt.toISOString(), slots: plan.slots.map((slot) => slot.toISOString()) }
  })
}
