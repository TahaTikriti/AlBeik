// Server-only: "Link dishes to Clover and update prices" in Site settings → Ordering.
import type { PayloadRequest } from 'payload'

import { type CloverItem, matchDishes, pricesFromClover } from './clover-match'
import { type CloverConfig, cloverUrls, getCardConfig } from './config'
import { CardError } from './types'

export type CloverSyncResult = { linked: number; pricesUpdated: number; unmatched: string[] }

async function fetchCloverItems(config: CloverConfig): Promise<CloverItem[]> {
  const items: CloverItem[] = []
  for (let offset = 0; offset < 10_000; offset += 1000) {
    const url =
      cloverUrls(config.env).platform +
      encodeURIComponent(config.merchantId) +
      '/items?limit=1000&offset=' +
      offset
    const response = await fetch(url, {
      headers: { authorization: 'Bearer ' + config.restToken, accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new CardError('Clover did not return the item list.', 502)
    const page = (await response.json()) as { elements?: unknown[] }
    const elements = Array.isArray(page.elements) ? page.elements : []
    for (const raw of elements) {
      const item = raw as Partial<CloverItem> & { deleted?: boolean }
      if (typeof item.id === 'string' && typeof item.name === 'string' && typeof item.price === 'number' && !item.deleted)
        items.push({ id: item.id, name: item.name, price: item.price })
    }
    if (elements.length < 1000) break
  }
  return items
}

export async function syncDishesWithClover(req: PayloadRequest): Promise<CloverSyncResult> {
  const config = getCardConfig()
  if (config.mode !== 'clover')
    throw new CardError('Connect Clover first (PICKUP_MODE=clover on the server).', 400)
  const items = await fetchCloverItems(config)
  const byId = new Map(items.map((item) => [item.id, item]))
  const { docs } = await req.payload.find({
    collection: 'menu-items',
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { name: true, pickupOptions: true, price: true, comboPrice: true, dealPrice: true },
  })
  const { linked, unmatched } = matchDishes(
    docs.map((doc) => ({ id: doc.id, name: doc.name, hasLinks: Boolean(doc.pickupOptions?.length) })),
    items,
  )
  const newOptions = new Map(linked.map((entry) => [entry.dishId, entry.options]))
  let pricesUpdated = 0
  for (const doc of docs) {
    const options =
      newOptions.get(doc.id)?.map(({ label, cloverItemId }) => ({ label, cloverItemId })) ??
      (doc.pickupOptions ?? []).map(({ label, cloverItemId }) => ({ label, cloverItemId }))
    if (!options.length) continue
    const prices = pricesFromClover(options, byId)
    const priceChanged =
      (prices.price !== undefined && prices.price !== doc.price) ||
      (prices.comboPrice !== undefined && prices.comboPrice !== doc.comboPrice)
    if (!priceChanged && !newOptions.has(doc.id)) continue
    // A deal at or above the new price would fail validation; linked dishes don't show deals anyway.
    const price = prices.price ?? doc.price
    const clearDeal = typeof doc.dealPrice === 'number' && typeof price === 'number' && doc.dealPrice >= price
    await req.payload.update({
      collection: 'menu-items',
      id: doc.id,
      overrideAccess: true,
      req,
      data: {
        ...(newOptions.has(doc.id) ? { pickupOptions: options } : {}),
        ...prices,
        ...(clearDeal ? { dealPrice: null } : {}),
      },
    })
    if (priceChanged) pricesUpdated++
  }
  return { linked: linked.length, pricesUpdated, unmatched }
}
