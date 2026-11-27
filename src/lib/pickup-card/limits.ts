import { createHash } from 'node:crypto'
import { isIP } from 'node:net'

import type { CheckoutStore } from './store'
import { CardError } from './types'

/**
 * Per address: new payment attempts (replays of one attempt don't count),
 * price checks and dish lookups, each of which reaches Clover.
 */
const LIMITS = {
  pay: { max: 5, windowMs: 10 * 60_000, message: 'Too many payment attempts. Please call us.' },
  quote: { max: 20, windowMs: 60_000, message: 'Too many price checks. Please wait a minute, or call us.' },
  options: { max: 20, windowMs: 60_000, message: 'Too many requests. Please wait a minute, or call us.' },
} as const

/**
 * Takes one of the window's numbered slots through the store's write-once
 * claim, so parallel requests can't all slip under the limit.
 */
export async function takeSlot(store: CheckoutStore, kind: keyof typeof LIMITS, ipHash: string, now: Date) {
  const { max, windowMs, message } = LIMITS[kind]
  const window = 'limit:' + kind + ':' + ipHash + ':' + Math.floor(now.getTime() / windowMs)
  for (let slot = 0; slot < max; slot++) if (await store.claim(window, String(slot), true)) return
  throw new CardError(message, 429, 'not_submitted')
}

/** A keyed hash, so the admin list can group attempts without storing addresses. */
export function hashIp(ip: string, secret: string) {
  return createHash('sha256').update(secret + ip).digest('hex').slice(0, 32)
}

/** The request's address, hashed: what the limits count by. */
export function requestAddress(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return hashIp(forwarded && isIP(forwarded) ? forwarded : '127.0.0.1', process.env.PAYLOAD_SECRET || 'dev')
}
