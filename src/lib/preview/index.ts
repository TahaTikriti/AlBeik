/** URL the admin's live preview / preview button opens for a site path. */
export function previewUrl(path: string, secret = process.env.PREVIEW_SECRET ?? '') {
  const params = new URLSearchParams({ path, previewSecret: secret })
  return `/next/preview?${params.toString()}`
}

const BASE = 'http://site.invalid'

/**
 * The path to redirect to, or null if it isn't on this site. Parsed the way a
 * browser would, so tricks like "/\t/evil.com" (browsers strip the tab and
 * see "//evil.com") or backslashes can't send visitors elsewhere.
 */
export function safeRedirectPath(path: string | null | undefined): string | null {
  if (!path?.startsWith('/')) return null
  try {
    const url = new URL(path, BASE)
    return url.origin === BASE ? `${url.pathname}${url.search}${url.hash}` : null
  } catch {
    return null
  }
}
