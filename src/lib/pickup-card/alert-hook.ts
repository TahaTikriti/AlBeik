// Server-only: sends the order email after the response, so checkout never waits on it.
import { getOrderAlertEmail } from '@/lib/data'

import { sendOrderAlert } from './alert'
import type { Notify } from './payment'

export function orderAlert(after: (task: () => Promise<unknown>) => void, timeZone: string): Notify {
  return (order) =>
    after(async () => {
      const result = await sendOrderAlert(order, await getOrderAlertEmail().catch(() => null), fetch, timeZone)
      if (result === 'failed') console.error('[pickup] Order alert email failed for', order.cloverOrderId)
    })
}
