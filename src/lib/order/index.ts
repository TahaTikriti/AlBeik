import { getPlatform, PLATFORMS, type PlatformId } from './platforms'

export { PLATFORMS, type PlatformId } from './platforms'

export type OrderLink = {
  platform: PlatformId
  label: string
  href: string
  /** `item` lands on the dish; `store` lands on the restaurant page. */
  level: 'item' | 'store'
}

export type ItemOrderUrls = {
  doordashUrl?: string | null
  uberEatsUrl?: string | null
}

export type StoreOrderUrls = {
  doordashStoreUrl?: string | null
  uberEatsStoreUrl?: string | null
}

export type OrderAction =
  | { kind: 'none' }
  | { kind: 'direct'; link: OrderLink }
  | { kind: 'choose'; links: OrderLink[] }

/**
 * True for an https URL whose host is one of the platform's hosts or a
 * subdomain of one. Shared by CMS field validation and rendering, so a URL
 * saved before a rule change still never reaches the page.
 */
export function isAllowedOrderUrl(platformId: PlatformId, value: string | null | undefined) {
  const raw = value?.trim()
  if (!raw) return false

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false

  const host = url.hostname.toLowerCase()
  return getPlatform(platformId).hosts.some((h) => host === h || host.endsWith(`.${h}`))
}

/**
 * The fallback chain, per platform: item link → store link → hidden.
 * Pass `null` for the item to get the store-level links (site-wide CTA).
 */
export function resolveOrderLinks(item: ItemOrderUrls | null, store: StoreOrderUrls): OrderLink[] {
  const links: OrderLink[] = []

  for (const platform of PLATFORMS) {
    const itemUrl = item?.[platform.itemField]
    const storeUrl = store[platform.storeField]

    if (isAllowedOrderUrl(platform.id, itemUrl)) {
      links.push(toLink(platform.id, itemUrl!, 'item'))
    } else if (isAllowedOrderUrl(platform.id, storeUrl)) {
      links.push(toLink(platform.id, storeUrl!, 'store'))
    }
  }

  return links
}

/** One platform → link straight to it (one tap). Several → let the user choose. */
export function toOrderAction(links: OrderLink[]): OrderAction {
  const [first] = links
  if (!first) return { kind: 'none' }
  if (links.length === 1) return { kind: 'direct', link: first }
  return { kind: 'choose', links }
}

function toLink(platformId: PlatformId, href: string, level: OrderLink['level']): OrderLink {
  return { platform: platformId, label: getPlatform(platformId).label, href: href.trim(), level }
}
