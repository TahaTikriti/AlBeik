import { checkoutStore } from '@/lib/pickup-card/checkout-store'
import { attemptIdFrom, checkoutResponse, readCheckoutBody } from '@/lib/pickup-card/checkout'
import { reconcileCardPayment } from '@/lib/pickup-card/payment'
import { CardError } from '@/lib/pickup-card/types'

export async function POST(request: Request) {
  return checkoutResponse(async (config) => {
    const body = await readCheckoutBody(request)
    const receipt = await reconcileCardPayment(config, await checkoutStore(), attemptIdFrom(body.attemptId))
    if (!receipt) throw new CardError('We have no record of this order yet.', 404)
    return receipt
  })
}
