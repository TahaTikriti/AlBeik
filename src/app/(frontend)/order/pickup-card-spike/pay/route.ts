import { checkoutStore } from '@/lib/pickup-card/checkout-store'
import {
  checkoutResponse,
  currentQuote,
  readCheckoutBody,
  readPayment,
} from '@/lib/pickup-card/checkout'
import { submitCardPayment } from '@/lib/pickup-card/payment'
import { CardError } from '@/lib/pickup-card/types'

export async function POST(request: Request) {
  return checkoutResponse(async (config) => {
    const { body, input } = await (async () => {
      try {
        const body = await readCheckoutBody(request)
        return { body, input: readPayment(body, config, request) }
      } catch (error) {
        if (error instanceof CardError)
          throw new CardError(error.message, error.status, 'not_submitted')
        throw error
      }
    })()
    return submitCardPayment(config, await checkoutStore(), input, async () => {
      const prepared = await currentQuote(config, body.lines).catch((error: unknown) => {
        if (error instanceof CardError)
          throw new CardError(error.message, error.status, 'not_submitted')
        throw new CardError(
          'Your bag could not be verified. Please review it again.',
          503,
          'not_submitted',
        )
      })
      if (prepared.quote.quoteId !== body.quoteId) {
        throw new CardError(
          'Your basket has changed. Review the updated total before paying.',
          409,
          'requote',
        )
      }
      return prepared
    })
  })
}
