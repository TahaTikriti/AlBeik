import type { CardClient, CardLine } from '@/lib/pickup-card/types'
import { MAX_ITEM_QUANTITY } from '@/lib/pickup-spike/basket'

export const pickupCardPath = '/order/pickup-card-spike'
export const pickupPaymentRetryPath = pickupCardPath + '?retry=payment'

export function checkoutAttemptKey(client: CardClient) {
  return 'albeik.pickup-card.' + (client.mode === 'preview' ? 'preview' : client.merchantId)
}

export function restorePickupBag(key: string, optionIds: Set<string>): CardLine[] {
  const lines: unknown = JSON.parse(sessionStorage.getItem(key) ?? '[]')
  if (!Array.isArray(lines) || lines.length > 50) return []
  return lines.filter(
    (line): line is CardLine =>
      line &&
      typeof line.optionId === 'string' &&
      optionIds.has(line.optionId) &&
      Number.isInteger(line.quantity) &&
      line.quantity >= 1 &&
      line.quantity <= MAX_ITEM_QUANTITY &&
      Array.isArray(line.extraIds) &&
      line.extraIds.length <= 1 &&
      line.extraIds.every((id: unknown) => typeof id === 'string'),
  )
}

export async function postPickupCard<T>(
  route: '/quote' | '/pay' | '/status',
  data: unknown,
): Promise<T> {
  const response = await fetch(pickupCardPath + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(35000),
  })
  const body = await response.json()
  if (!response.ok) {
    throw Object.assign(new Error(body.error || 'The request could not be completed.'), {
      code: body.code,
    })
  }
  return body
}
