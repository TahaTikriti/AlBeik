import { attemptIdFrom, checkoutResponse, readCheckoutBody } from '@/lib/pickup-card/checkout'
import { reconcileCardPayment } from '@/lib/pickup-card/payment'
import { CardError } from '@/lib/pickup-card/types'

export async function POST(request: Request) {
  return checkoutResponse(async (config) => {
    const body = await readCheckoutBody(request)
    const receipt = await reconcileCardPayment(config, attemptIdFrom(body.attemptId))
    if (!receipt) throw new CardError('This payment attempt has no recorded status yet.', 404)
    return receipt
  })
}
