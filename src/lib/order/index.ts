import { normalizeCloverPickupUrl } from './clover'
import { getPlatform, PLATFORMS, type PlatformId as MarketplaceId } from './platforms'

export { PLATFORMS } from './platforms'

export type PlatformId = MarketplaceId | 'clover'

type MarketplaceLink = {
  platform: MarketplaceId
  label: string
  href: string
  /** `item` lands on the dish; `store` lands on the restaurant page. */
  level: 'item' | 'store'
}

type CloverLink = { platform: 'clover'; label: 'Clover'; href: string; level: 'store' }

export type OrderLink = MarketplaceLink | CloverLink

export type ItemOrderUrls = {
  doordashUrl?: string | null
  uberEatsUrl?: string | null
}

export type StoreOrderUrls = {
  doordashStoreUrl?: string | null
  uberEatsStoreUrl?: string | null
  cloverPickupUrl?: string | null
}

/** How the customer gets the food. */
export type OrderMode = 'delivery' | 'pickup'

/** A link for one mode; `preset` is false when the app can't be opened in it. */
export type ModeLink = OrderLink & { mode: OrderMode; preset: boolean }

export type OrderAction =
  { kind: 'none' } | { kind: 'direct'; link: OrderLink } | { kind: 'choose'; links: OrderLink[] }

/**
 * True for an https URL whose host is one of the platform's hosts or a
 * subdomain of one. Shared by CMS field validation and rendering, so a URL
 * saved before a rule change still never reaches the page.
 */
export function isAllowedOrderUrl(platformId: MarketplaceId, value: string | null | undefined) {
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
 * Marketplaces fall back from item to store. Clover has a single pickup storefront.
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

  const cloverUrl = normalizeCloverPickupUrl(store.cloverPickupUrl)
  if (cloverUrl)
    links.push({ platform: 'clover', label: 'Clover', href: cloverUrl, level: 'store' })

  return links
}

/**
 * Clover owns pickup when configured. Marketplaces are the pickup fallback.
 * With `online` (pickup ordered on this website) there's no app to open:
 * callers send pickup to /order/pickup.
 */
export function linksForMode(
  links: OrderLink[],
  mode: OrderMode,
  { online = false }: { online?: boolean } = {},
): ModeLink[] {
  if (mode === 'pickup' && online) return []
  if (mode === 'pickup') {
    const clover = links.find((link) => link.platform === 'clover')
    if (clover) return [{ ...clover, mode, preset: true }]
  }

  return links.filter((link) => link.platform !== 'clover').map((link) => linkForMode(link, mode))
}

/** One platform → link straight to it (one tap). Several → let the user choose. */
export function toOrderAction(links: OrderLink[]): OrderAction {
  const [first] = links
  if (!first) return { kind: 'none' }
  if (links.length === 1) return { kind: 'direct', link: first }
  return { kind: 'choose', links }
}

/**
 * The link that opens the platform in the given mode, where its URLs allow
 * it. Other platforms keep their link; their store page opens on delivery.
 */
export function linkForMode(link: MarketplaceLink, mode: OrderMode): ModeLink {
  const param = getPlatform(link.platform).modeParam
  if (!param) return { ...link, mode, preset: mode === 'delivery' }
  const url = new URL(link.href)
  url.searchParams.set(param.name, param[mode])
  return { ...link, href: url.toString(), mode, preset: true }
}

function toLink(
  platformId: MarketplaceId,
  href: string,
  level: MarketplaceLink['level'],
): MarketplaceLink {
  return { platform: platformId, label: getPlatform(platformId).label, href: href.trim(), level }
}
