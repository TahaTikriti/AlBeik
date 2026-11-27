export const checkoutPath = '/order/pickup'
export const donePath = checkoutPath + '/done'

// The attempt in flight (until Clover settles it) and the last one, for the
// confirmation page. Per tab: a second tab can't resubmit this one.
const PENDING = 'albeik.pickup.attempt'
const LAST = 'albeik.pickup.last'
/** Name, phone and email, remembered on this device for the next order. */
export const DETAILS_KEY = 'albeik.pickup.details'

function session(action: (storage: Storage) => string | null | void) {
  try {
    return action(sessionStorage) ?? null
  } catch {
    return null
  }
}

export const attempts = {
  pending: () => session((s) => s.getItem(PENDING)),
  last: () => session((s) => s.getItem(PENDING) ?? s.getItem(LAST)),
  /** A new attempt's ID, or null while this tab already has one in flight. */
  begin: () =>
    session((s) => {
      if (s.getItem(PENDING)) return null
      const id = crypto.randomUUID()
      s.setItem(PENDING, id)
      s.setItem(LAST, id)
      return id
    }),
  /** Clover has answered: the next Pay is a new attempt. */
  settle: () => session((s) => s.removeItem(PENDING)),
}

export type CheckoutError = Error & { code?: string; status?: number; detail?: Record<string, unknown> }

/** The caller's signal plus a timeout, also where AbortSignal.any is missing (Safari before 17.4). */
export function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  if (typeof AbortSignal.any === 'function' && typeof AbortSignal.timeout === 'function')
    return signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  signal?.addEventListener('abort', () => {
    clearTimeout(timer)
    controller.abort()
  })
  if (signal?.aborted) controller.abort()
  return controller.signal
}

export async function postCheckout<T>(
  route: '/quote' | '/pay' | '/status',
  data: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(checkoutPath + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: withTimeout(signal, 35000),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const { error, code, ...detail } = body as Record<string, unknown>
    throw Object.assign(new Error(typeof error === 'string' && error ? error : 'Something went wrong. Please try again.'), {
      code: typeof code === 'string' ? code : undefined,
      status: response.status,
      detail,
    })
  }
  return body
}
