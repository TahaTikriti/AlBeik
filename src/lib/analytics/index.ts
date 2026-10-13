import type { OrderLink, PlatformId } from '@/lib/order'

/** Where on the site an order control was used. */
export type Placement = 'menu' | 'item' | 'home-hero' | 'home-featured' | 'sticky'

/**
 * Every custom event the site sends. `item` is the menu item slug, or
 * "store" for the site-wide order CTA.
 */
export type AnalyticsEvents = {
  order_sheet_open: { item: string; placement: Placement }
  order_click: {
    item: string
    platform: PlatformId
    level: OrderLink['level']
    placement: Placement
  }
}

type UmamiWindow = {
  umami?: { track: (event: string, data?: Record<string, string>) => void }
}

/**
 * Sends a custom event to Umami (the only vendor-specific line in the app).
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
