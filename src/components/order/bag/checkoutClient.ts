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
  start: (id: string) =>
    session((s) => {
      s.setItem(PENDING, id)
      s.setItem(LAST, id)
    }),
  /** Clover has answered: the next Pay is a new attempt. */
  settle: () => session((s) => s.removeItem(PENDING)),
}

export type CheckoutError = Error & { code?: string }

export async function postCheckout<T>(
  route: '/quote' | '/pay' | '/status',
  data: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(checkoutPath + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(35000)]) : AbortSignal.timeout(35000),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw Object.assign(new Error(body.error || 'Something went wrong. Please try again.'), {
      code: body.code as string | undefined,
    })
  }
  return body
}
