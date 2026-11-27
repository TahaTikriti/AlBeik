// Server-only: the backup email for each paid web order (the admin's Web orders screen comes first).
import { displayPhone } from './phone'
import type { WebOrderSummary } from './store'

const money = (cents: number) => '$' + (cents / 100).toFixed(2)

/**
 * Emails the order through Resend. `off` without RESEND_API_KEY or an address.
 * Never throws: a lost email must not touch the checkout.
 */
export async function sendOrderAlert(
  order: WebOrderSummary,
  to: string | null,
  fetchImpl: typeof fetch = fetch,
  timeZone = 'America/Chicago',
): Promise<'sent' | 'off' | 'failed'> {
  const key = process.env.RESEND_API_KEY
  if (!key || !to) return 'off'
  const name = order.pickupName ?? 'Guest'
  const total = money(order.totalCents ?? 0)
  const ready = order.readyAt
    ? new Date(order.readyAt).toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit' })
    : null
  const text = [
    `${name} paid ${total} for pickup.`,
    '',
    ...(order.lines ?? []).map((line) => `${line.quantity} × ${line.name}`),
    '',
    ready ? `Ready around ${ready}` : null,
    order.phone ? `Phone: ${order.phone.startsWith('+1') ? displayPhone(order.phone) : order.phone}` : null,
    order.cloverOrderId ? `Clover order: ${order.cloverOrderId}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')
  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ORDER_ALERT_FROM || 'AlBeik orders <onboarding@resend.dev>',
        to: [to],
        subject: `New pickup order · ${name} · ${total}`,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    return response.ok ? 'sent' : 'failed'
  } catch {
    return 'failed'
  }
}
