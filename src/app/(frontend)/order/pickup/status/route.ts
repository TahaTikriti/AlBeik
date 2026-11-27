import { after } from 'next/server'

import { getSite } from '@/lib/data'
import { orderAlert } from '@/lib/pickup-card/alert-hook'
import { checkoutStore } from '@/lib/pickup-card/checkout-store'
import { attemptIdFrom, checkoutResponse, readCheckoutBody } from '@/lib/pickup-card/checkout'
import { abandonCardPayment, reconcileCardPayment } from '@/lib/pickup-card/payment'
import { CardError } from '@/lib/pickup-card/types'

export async function POST(request: Request) {
  return checkoutResponse(async (config) => {
    const body = await readCheckoutBody(request)
    const store = await checkoutStore()
    const attemptId = attemptIdFrom(body.attemptId)
    const notify = orderAlert(after, (await getSite()).timezone)
    let receipt = await reconcileCardPayment(config, store, attemptId, notify)
    // The page gave up waiting for a payment that never arrived: close it, then
    // answer for whichever won (the abandon, or a payment that just landed).
    if (!receipt && body.abandon === true) {
      await abandonCardPayment(config, store, attemptId)
      receipt = await reconcileCardPayment(config, store, attemptId, notify)
    }
    if (!receipt) throw new CardError('We have no record of this order yet.', 404)
    return receipt
  })
}
