'use client'

import { useSyncExternalStore } from 'react'

import type { CardProduct } from '@/lib/pickup-card/types'

/**
 * Every dish sold online, loaded once per visit in the background, so the
 * Add sheet opens with its prices and choices already there.
 */
type Snapshot = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  products: ReadonlyMap<string, CardProduct>
  error: string | null
}

// Older than this, the next Add refreshes it in the background (stock, prices).
const STALE_MS = 5 * 60_000

let snapshot: Snapshot = { status: 'idle', products: new Map(), error: null }
let loadedAt = 0
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()

function set(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next }
  for (const listener of listeners) listener()
}

/** Starts (or refreshes) the load; safe to call from every Add button. */
export function loadProducts(): Promise<void> {
  if (inflight) return inflight
  if (snapshot.status === 'ready' && Date.now() - loadedAt < STALE_MS) return Promise.resolve()
  if (snapshot.status !== 'ready') set({ status: 'loading', error: null })
  inflight = fetch('/order/pickup/options')
    .then(async (response) => {
      const body = (await response.json().catch(() => ({}))) as { products?: CardProduct[]; error?: string }
      if (!response.ok || !Array.isArray(body.products)) throw new Error(body.error || '')
      loadedAt = Date.now()
      set({ status: 'ready', products: new Map(body.products.map((p) => [p.slug, p])), error: null })
    })
    .catch((error: unknown) => {
      // A refresh that fails keeps the prices already on screen.
      if (snapshot.status !== 'ready')
        set({ status: 'error', error: error instanceof Error && error.message ? error.message : null })
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

let scheduled = false

/** Loads the products (and `alsoLoad`, the sheet's code) once the browser is idle after the page shows. */
export function prefetchProducts(alsoLoad?: () => unknown) {
  if (scheduled) return
  scheduled = true
  const run = () => {
    void loadProducts()
    alsoLoad?.()
  }
  const idle = (globalThis as { requestIdleCallback?: (fn: () => void, o?: { timeout: number }) => void })
    .requestIdleCallback
  if (idle) idle(run, { timeout: 2500 })
  else setTimeout(run, 1200)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const SERVER: Snapshot = { status: 'idle', products: new Map(), error: null }

export function useProducts(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER,
  )
}
