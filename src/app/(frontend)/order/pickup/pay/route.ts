import { after } from 'next/server'

import { getSite } from '@/lib/data'
import { orderAlert } from '@/lib/pickup-card/alert-hook'
import { checkoutStore } from '@/lib/pickup-card/checkout-store'
import {
  assertOrderingOpen,
  checkoutResponse,
  clockTime,
  currentQuote,
  displayPhone,
  readCheckoutBody,
  readPayment,
  readPickupTime,
} from '@/lib/pickup-card/checkout'
import { hashIp, takeSlot } from '@/lib/pickup-card/limits'
import { submitCardPayment } from '@/lib/pickup-card/payment'
import { CardError } from '@/lib/pickup-card/types'

// A quote, an order, a charge and a print, each with a 10 s Clover timeout: never cut one short.
export const maxDuration = 60

/** Every refusal before Clover is reached says so, so the browser can retry safely. */
function notSubmitted(error: unknown): never {
  if (error instanceof CardError)
    throw new CardError(error.message, error.status, error.code === 'closed' ? 'closed' : 'not_submitted')
  throw error
}

export async function POST(request: Request) {
  return checkoutResponse(async (config) => {
    const body = await readCheckoutBody(request).catch(notSubmitted)
    const input = (() => {
      try {
        return readPayment(body, config, request)
      } catch (error) {
        notSubmitted(error)
      }
    })()
    const site = await getSite()
    const now = new Date()
    // For the kitchen's note. A new attempt's time is checked in the gate below;
    // a replay returns its receipt even once that time has passed.
    const chosen = typeof body.pickupAt === 'string' ? new Date(body.pickupAt) : null
    const pickup =
      chosen && !Number.isNaN(chosen.getTime())
        ? { readyAt: chosen, scheduled: true }
        : { readyAt: new Date(now.getTime() + site.pickup.prepMinutes * 60_000), scheduled: false }
    const readyAt = pickup.readyAt
    const when = clockTime(readyAt, site.timezone)
    const store = await checkoutStore()
    const ipHash = hashIp(input.clientIp, process.env.PAYLOAD_SECRET || 'dev')
    return submitCardPayment(
      config,
      store,
      {
        ...input,
        note: `Pickup for ${input.pickupName} · ${displayPhone(input.phone)} · ${pickup.scheduled ? `SCHEDULED for ${when}` : `ASAP, ready ~${when}`}`,
        details: { phone: input.phone, email: input.email, readyAt: readyAt.toISOString(), ipHash },
      },
      async () => {
        // Only a new attempt is checked against the clock and the limit; a replay returns its receipt.
        try {
          assertOrderingOpen(site, now)
          readPickupTime(body.pickupAt, site, now)
          await takeSlot(store, 'pay', ipHash, now)
        } catch (error) {
          notSubmitted(error)
        }
        const prepared = await currentQuote(config, body.lines).catch((error: unknown) => {
          if (error instanceof CardError) notSubmitted(error)
          throw new CardError('Your bag could not be checked. Please try again.', 503, 'not_submitted')
        })
        if (prepared.quote.quoteId !== body.quoteId) {
          throw new CardError('Prices changed. Check the new total, then pay.', 409, 'requote')
        }
        return prepared
      },
      orderAlert(after, site.timezone),
    )
  })
}
