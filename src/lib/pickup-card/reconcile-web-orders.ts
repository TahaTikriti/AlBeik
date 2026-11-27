// Server-only: the admin Web orders screen settles orders nobody is watching.
import { after } from 'next/server'
import type { Payload } from 'payload'

import { getSite } from '@/lib/data'

import { orderAlert } from './alert-hook'
import { getCardConfig } from './config'
import { reconcileStoredPayment } from './payment'
import { staleAttempts } from './reconcile'
import { payloadStore } from './store-payload'

/** Rechecks a few stale pending orders with Clover; how many were checked. */
export async function reconcileWebOrders(payload: Payload): Promise<number> {
  const config = (() => {
    try {
      return getCardConfig()
    } catch {
      return null
    }
  })()
  if (!config) return 0
  const { docs } = await payload.find({
    collection: 'web-orders',
    overrideAccess: true,
    where: { status: { equals: 'pending' } },
    sort: 'createdAt',
    limit: 20,
    depth: 0,
    pagination: false,
  })
  const ids = staleAttempts(docs, new Date())
  if (!ids.length) return 0
  const store = payloadStore(payload)
  const notify = orderAlert(after, (await getSite()).timezone)
  for (const id of ids) {
    // A stopped attempt throws: it is recorded as stopped either way.
    await reconcileStoredPayment(config, store, id, notify).catch(() => null)
  }
  return ids.length
}
