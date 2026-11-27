import type { BasketQuote, CheckoutResult } from './basket'
import { PICKUP_SPIKE_PATH } from './basket'

const SANDBOX_ENDPOINT = 'https://apisandbox.dev.clover.com/invoicingcheckoutservice/v1/checkouts'

export async function createPickupCheckout(quote: BasketQuote): Promise<CheckoutResult> {
  const merchantId = process.env.PICKUP_SPIKE_CLOVER_SANDBOX_MERCHANT_ID?.trim()
  const key = process.env.PICKUP_SPIKE_CLOVER_SANDBOX_PRIVATE_KEY?.trim()
  if (!merchantId && !key) return { kind: 'preview', quote }
  if (!merchantId || !key) throw new Error('Incomplete Clover sandbox configuration')

  // Clover only accepts HTTPS return URLs. The local HTTP preview uses Clover's
  // own sandbox receipt page when no HTTPS preview origin has been configured.
  const origin = process.env.NEXT_PUBLIC_SERVER_URL
  const returnTo = origin?.startsWith('https://')
    ? new URL(`${PICKUP_SPIKE_PATH}?from=clover`, origin).href
    : undefined

  const response = await fetch(SANDBOX_ENDPOINT, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AlBeikPickupSpike/1.0',
      'X-Clover-Merchant-Id': merchantId,
    },
    body: JSON.stringify({
      customer: { firstName: 'AlBeik', lastName: 'Test', email: 'pickup-test@example.com' },
      ...(returnTo ? { redirectUrls: { success: returnTo, failure: returnTo } } : {}),
      shoppingCart: {
        lineItems: quote.lines.map((line) => ({
          name: line.name,
          price: line.priceCents,
          unitQty: line.quantity,
        })),
      },
    }),
  })

  if (!response.ok) throw new Error(`Clover sandbox returned ${response.status}`)
  const { href, checkoutSessionId } = await response.json()
  if (typeof href !== 'string' || typeof checkoutSessionId !== 'string' || !checkoutSessionId) {
    throw new Error('Clover sandbox response did not include a checkout')
  }

  const checkout = new URL(href)
  if (
    checkout.protocol !== 'https:' ||
    checkout.username ||
    checkout.password ||
    checkout.port ||
    !checkout.hostname.endsWith('.dev.clover.com')
  ) {
    throw new Error('Clover returned an unexpected sandbox checkout URL')
  }

  return { kind: 'clover-sandbox', url: checkout.href, sessionId: checkoutSessionId }
}
