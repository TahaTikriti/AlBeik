import { createHash } from 'node:crypto'
import { isIP } from 'node:net'

import { getMenuPageData } from '@/lib/data'
import { loadCardProducts, quoteCardBasket } from './catalog'
import { type CardConfig, getCardConfig } from './config'
import { CardError } from './types'

export async function currentProducts(config: CardConfig) {
  const menu = await getMenuPageData({ draft: false })
  const items = menu.categories.flatMap((category) => category.items)
  return loadCardProducts(
    config,
    items.flatMap((item) => (item.pickup ? [{ slug: item.slug, options: item.pickup.options }] : [])),
    items,
  )
}

export async function currentQuote(config: CardConfig, lines: unknown) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 50) {
    throw new CardError('Choose an item before reviewing your order.', 400)
  }
  return quoteCardBasket(config, await currentProducts(config), lines)
}

export async function checkoutResponse(action: (config: CardConfig) => Promise<unknown>) {
  const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }
  try {
    return Response.json(await action(getCardConfig()), { headers })
  } catch (error) {
    if (error instanceof CardError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status, headers },
      )
    }
    return Response.json(
      {
        error: 'Checkout is temporarily unavailable. Check your order status before trying again.',
      },
      { status: 503, headers },
    )
  }
}

export async function readCheckoutBody(request: Request): Promise<Record<string, unknown>> {
  const origin = request.headers.get('origin')
  // Next can normalize a loopback request URL to localhost even when the browser
  // and Host header use 127.0.0.1. Browsers set Sec-Fetch-Site from the actual origin.
  const sameOrigin = request.headers.get('sec-fetch-site') === 'same-origin'
  if (origin && !sameOrigin && origin !== new URL(request.url).origin) {
    throw new CardError('Please use the checkout on this website.', 403)
  }
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
    throw new CardError('Send a JSON checkout request.', 415)
  }
  const reader = request.body?.getReader()
  if (!reader) throw new CardError('Invalid checkout request.', 400)
  const decoder = new TextDecoder()
  let raw = ''
  let bytes = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 16_000) {
        await reader.cancel()
        throw new CardError('The basket is too large.', 413)
      }
      raw += decoder.decode(value, { stream: true })
    }
    raw += decoder.decode()
  } finally {
    reader.releaseLock()
  }
  let body
  try {
    body = JSON.parse(raw)
  } catch {
    throw new CardError('The checkout request could not be read.', 400)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new CardError('Invalid checkout request.', 400)
  return body
}

export function attemptIdFrom(value: unknown) {
  if (
    typeof value !== 'string' ||
    !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(value)
  ) {
    throw new CardError('Invalid payment reference.', 400)
  }
  return value.toLowerCase()
}

export function readPayment(body: Record<string, unknown>, config: CardConfig, request: Request) {
  const attemptId = attemptIdFrom(body.attemptId)
  const pickupName = typeof body.pickupName === 'string' ? body.pickupName.trim() : ''
  if (!pickupName || pickupName.length > 80 || /[\u0000-\u001f\u007f]/u.test(pickupName)) {
    throw new CardError('Enter a pickup name of up to 80 characters.', 400)
  }
  const { source, quoteId, lines } = body
  if (
    typeof source !== 'string' ||
    (config.mode === 'preview' ? source !== 'preview' : !/^clv_[A-Za-z0-9_-]{1,250}$/.test(source))
  ) {
    throw new CardError('Refresh the payment form and try again.', 400)
  }
  if (typeof quoteId !== 'string' || !quoteId || quoteId.length > 128 || !Array.isArray(lines)) {
    throw new CardError('Review your basket before paying.', 400)
  }
  // The quote digest already binds the validated lines. Include the submitted cart
  // too so a replay with altered contents cannot return another basket's receipt.
  const fingerprint = createHash('sha256')
    .update(JSON.stringify([pickupName, quoteId, lines]))
    .digest('hex')
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const host = new URL(request.url).hostname
  const clientIp = forwarded && isIP(forwarded) ? forwarded : '127.0.0.1'
  if (
    config.mode === 'clover' &&
    !['localhost', '127.0.0.1', '[::1]'].includes(host) &&
    !isIP(forwarded ?? '')
  ) {
    throw new CardError('The test server could not identify the checkout connection.', 503)
  }
  return { attemptId, pickupName, source, fingerprint, clientIp }
}
