/** A US number as E.164 (+1XXXXXXXXXX), or null. */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 32) return null
  const digits = value.replace(/\D/g, '')
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(local) ? '+1' + local : null
}

/** "(816) 216-1703", for the kitchen ticket. */
export function displayPhone(e164: string) {
  const d = e164.slice(2)
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}
