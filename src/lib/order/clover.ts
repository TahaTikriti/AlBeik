/** Accept the public ordering URLs Clover provides for a restaurant. */
export function normalizeCloverPickupUrl(value: string | null | undefined): string | null {
  const raw = value?.trim()
  if (!raw) return null

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null

  switch (url.hostname) {
    case 'clover.com':
    case 'www.clover.com':
      return /^\/online-ordering\/[a-z0-9-]+\/?$/i.test(url.pathname) ? url.href : null
    case 'customers.clover.com':
      return /^\/online-ordering\/?$/.test(url.pathname) &&
        /^[a-z0-9]+$/i.test(url.searchParams.get('cloverMerchantId') ?? '')
        ? url.href
        : null
    default:
      return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloveronline\.com$/.test(url.hostname) &&
        url.pathname === '/'
        ? url.href
        : null
  }
}
