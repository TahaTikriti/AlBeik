/**
 * The delivery platforms we hand customers off to, in display order.
 *
 * Neither platform supports pre-filling a cart from a link, so the best we can
 * do is an item page (if the client collected one) or the store page.
 * Adding a platform (e.g. DoorDash Storefront) = one entry here + the two
 * matching CMS fields.
 */
export const PLATFORMS = [
  {
    id: 'doordash',
    label: 'DoorDash',
    // drd.sh is DoorDash's share-link shortener.
    hosts: ['doordash.com', 'drd.sh'],
    itemField: 'doordashUrl',
    storeField: 'doordashStoreUrl',
  },
  {
    id: 'ubereats',
    label: 'Uber Eats',
    hosts: ['ubereats.com'],
    itemField: 'uberEatsUrl',
    storeField: 'uberEatsStoreUrl',
  },
] as const

export type Platform = (typeof PLATFORMS)[number]
export type PlatformId = Platform['id']

export function getPlatform(id: PlatformId): Platform {
  const platform = PLATFORMS.find((p) => p.id === id)
  if (!platform) throw new Error(`Unknown order platform: ${id}`)
  return platform
}
