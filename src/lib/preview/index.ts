/** URL the admin's live preview / preview button opens for a site path. */
export function previewUrl(path: string, secret = process.env.PREVIEW_SECRET ?? '') {
  const params = new URLSearchParams({ path, previewSecret: secret })
  return `/next/preview?${params.toString()}`
}

/** Only same-site paths: no scheme, no protocol-relative or backslash tricks. */
export function isSafeRedirectPath(path: string | null | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
}
