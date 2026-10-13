const MESSAGE = 'Use a path like /menu or an https:// link.'

/** Accepts a site path ("/menu") or an absolute https URL. */
export function validateHref(value: string | null | undefined): true | string {
  const v = value?.trim()
  if (!v) return true
  if (v.startsWith('/')) return v.startsWith('//') ? MESSAGE : true
  try {
    return new URL(v).protocol === 'https:' ? true : MESSAGE
  } catch {
    return MESSAGE
  }
}
