import { createHash } from 'node:crypto'

import type { CheckoutStore } from './store'
import { CardError } from './types'

const WINDOW_MS = 10 * 60_000
const MAX_ATTEMPTS = 5

/** Five new payment attempts per address per ten minutes; replays of one attempt don't count. */
export async function checkPayLimit(store: CheckoutStore, ipHash: string, now: Date) {
  if ((await store.countRecent(ipHash, new Date(now.getTime() - WINDOW_MS))) >= MAX_ATTEMPTS)
    throw new CardError('Too many payment attempts. Please call us.', 429, 'not_submitted')
}

/** A keyed hash, so the admin list can group attempts without storing addresses. */
export function hashIp(ip: string, secret: string) {
  return createHash('sha256').update(secret + ip).digest('hex').slice(0, 32)
}
