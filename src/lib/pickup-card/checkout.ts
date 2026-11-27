import { createHash } from 'node:crypto'
import { isIP } from 'node:net'

import { getMenuPageData } from '@/lib/data'
import type { SiteVM } from '@/lib/data/types'
import { pickupWindow } from '@/lib/hours'
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

/** A US number as E.164 (+1XXXXXXXXXX), or null. */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 32) return null
  const digits = value.replace(/\D/g, '')
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(local) ? '+1' + local : null
}

/** "(816) 216-1703", for the kitchen ticket. */
export function displayPhone(e164: string) {
  const d = e164.slice(2)
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function readEmail(value: unknown): string | null {
  const email = typeof value === 'string' ? value.trim() : ''
  if (!email) return null
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CardError('Check the email address, or leave it empty.', 400)
  }
  return email
}

export function readPayment(body: Record<string, unknown>, config: CardConfig, request: Request) {
  const attemptId = attemptIdFrom(body.attemptId)
  const pickupName = typeof body.pickupName === 'string' ? body.pickupName.trim() : ''
  if (!pickupName || pickupName.length > 80 || /[\u0000-\u001f\u007f]/u.test(pickupName)) {
    throw new CardError('Enter a pickup name of up to 80 characters.', 400)
  }
  const phone = normalizePhone(body.phone)
  if (!phone) throw new CardError('Enter a 10-digit phone number so we can reach you.', 400)
  const email = readEmail(body.email)
  const { source, quoteId, lines } = body
  if (
    typeof source !== 'string' ||
    (config.mode === 'preview'
      ? !PREVIEW_SOURCES.includes(source)
      : !/^clv_[A-Za-z0-9_-]{1,250}$/.test(source))
  ) {
    throw new CardError('Refresh the payment form and try again.', 400)
  }
  if (typeof quoteId !== 'string' || !quoteId || quoteId.length > 128 || !Array.isArray(lines)) {
    throw new CardError('Review your basket before paying.', 400)
  }
  // The quote digest already binds the validated lines. Include the submitted cart
  // and contact details too so a replay with other contents cannot return another
  // basket's receipt.
  const fingerprint = createHash('sha256')
    .update(JSON.stringify([pickupName, phone, email, quoteId, lines]))
    .digest('hex')
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const host = new URL(request.url).hostname
  const clientIp = forwarded && isIP(forwarded) ? forwarded : '127.0.0.1'
  if (
    config.mode === 'clover' &&
    !['localhost', '127.0.0.1', '[::1]'].includes(host) &&
    !isIP(forwarded ?? '')
  ) {
    throw new CardError('The checkout could not identify the connection. Please try again.', 503)
  }
  return { attemptId, pickupName, phone, email, source, fingerprint, clientIp }
}

/** Preview mode's fixture sources: a paid order, and a declined card. */
export const PREVIEW_SOURCES = ['preview', 'preview-decline']

/** Refuses a quote or payment outside the pickup window, or with online pickup switched off. */
export function assertOrderingOpen(site: SiteVM, now: Date) {
  if (!site.pickup.enabled) throw new CardError('Online ordering is off right now.', 409, 'closed')
  const hours = site.locations[0]?.openingHours ?? []
  const slot = pickupWindow(hours, site.timezone, site.pickup.prepMinutes, now)
  if (slot.open) return slot
  if (!slot.opensAt) throw new CardError('Online ordering is closed right now.', 409, 'closed')
  const day = (date: Date) =>
    date.toLocaleDateString('en-US', { timeZone: site.timezone, dateStyle: 'short' })
  const time = clockTime(slot.opensAt, site.timezone)
  const weekday = slot.opensAt.toLocaleDateString('en-US', { timeZone: site.timezone, weekday: 'long' })
  throw new CardError(
    day(slot.opensAt) === day(now)
      ? `Online ordering opens at ${time}.`
      : `Online ordering opens ${weekday} at ${time}.`,
    409,
    'closed',
  )
}

/** "6:40 PM" in the restaurant's time zone. */
export function clockTime(date: Date, timeZone: string) {
  return date.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit' })
}
