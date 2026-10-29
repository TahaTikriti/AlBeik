import type { OrderLink, OrderMode, PlatformId } from '@/lib/order'

/** Where on the site an order control was used. */
export type Placement =
  | 'menu'
  | 'item'
  | 'home-hero'
  | 'home-featured'
  | 'home-final'
  | 'sticky'
  | 'header'
  | 'visit'
  | 'story'
  | 'order-page'

/** Where a directions or call link was used. */
export type ContactPlacement = 'home-visit' | 'visit' | 'footer' | 'menu' | 'catering'

/**
 * Every custom event the site sends. `item` is the menu item slug, or
 * "store" for the site-wide order CTA.
 */
export type AnalyticsEvents = {
  order_sheet_open: { item: string; placement: Placement; mode: OrderMode }
  order_click: {
    item: string
    platform: PlatformId
    level: OrderLink['level']
    placement: Placement
    mode: OrderMode
  }
  directions_click: { placement: ContactPlacement }
  call_click: { placement: ContactPlacement }
}

type UmamiWindow = {
  umami?: { track: (event: string, data?: Record<string, string>) => void }
}

/**
 * Sends a custom event to Umami (with `trackOnClick`, the only vendor-specific
 * code in the app).
 * A no-op on the server, before the script loads, or when it is blocked;
 * analytics must never get in the way of an order click.
 */
export function track<E extends keyof AnalyticsEvents>(event: E, props: AnalyticsEvents[E]) {
  if (typeof window === 'undefined') return
  try {
    ;(window as UmamiWindow).umami?.track(event, props)
  } catch {
    // Swallowed on purpose: see above.
  }
}

/**
 * Attributes that make a plain link report a click, for links rendered on the
 * server. Umami reads them and waits for the event before leaving the page.
 */
export function trackOnClick<E extends keyof AnalyticsEvents>(event: E, props: AnalyticsEvents[E]) {
  return Object.fromEntries([
    ['data-umami-event', event],
    ...Object.entries(props).map(([key, value]) => [`data-umami-event-${key}`, String(value)]),
  ]) as Record<`data-${string}`, string>
}
