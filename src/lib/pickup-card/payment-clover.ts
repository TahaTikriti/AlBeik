import { type CloverConfig, cloverUrls } from './config'

type Sandbox = CloverConfig
type JObject = Record<string, unknown>

const userAgent = 'AlBeikPickup/1.0'
export class CloverHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
    super('Clover request failed')
  }
}

function record(value: unknown): JObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JObject)
    : {}
}

function elements(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const list = record(value).elements
  return Array.isArray(list) ? list : []
}

function id(value: unknown): string {
  const raw = record(value).id
  if (typeof raw !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(raw))
    throw new Error('Missing Clover ID')
  return raw
}

async function request(url: string, key: string, body?: JObject, headers?: Record<string, string>) {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + key,
      'User-Agent': userAgent,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    const data = record(await response.json().catch(() => null))
    const code = record(data.error).code ?? data.code
    throw new CloverHttpError(response.status, typeof code === 'string' ? code : undefined)
  }
  return record(await response.json())
}

function platform(config: Sandbox) {
  return cloverUrls(config.env).platform + encodeURIComponent(config.merchantId)
}

export async function createOrder(config: Sandbox, cart: JObject, name: string, attemptId: string) {
  const order = await request(platform(config) + '/atomic_order/orders', config.restToken, {
    orderCart: {
      ...cart,
      groupLineItems: false,
      title: 'Pickup · ' + name,
      note: 'Pickup for ' + name + ' (' + attemptId.slice(0, 8) + ')',
    },
  })
  return id(order)
}

function lineSignatures(value: unknown) {
  return elements(value)
    .map((item) => {
      const line = record(item)
      const extras = elements(line.modifications)
        .map((entry) => id(record(entry).modifier))
        .sort()
      return JSON.stringify([id(line.item), extras])
    })
    .sort()
}

export async function orderMatches(
  config: Sandbox,
  orderId: string,
  cart: JObject,
  totalCents: number,
) {
  const url = platform(config) + '/orders/' + encodeURIComponent(orderId)
  const [order, items] = await Promise.all([
    request(url, config.restToken),
    request(url + '/line_items?expand=modifications&limit=1000', config.restToken),
  ])
  const expected = lineSignatures(cart.lineItems)
  return (
    id(order) === orderId &&
    order.total === totalCents &&
    id(order.orderType) === config.orderTypeId &&
    expected.length > 0 &&
    JSON.stringify(lineSignatures(items)) === JSON.stringify(expected)
  )
}

export async function payOrder(
  config: Sandbox,
  orderId: string,
  amount: number,
  source: string,
  attemptId: string,
  clientIp: string,
) {
  return request(
    cloverUrls(config.env).ecommerce + encodeURIComponent(orderId) + '/pay',
    config.privateKey,
    { source, amount, currency: 'usd', ecomind: 'ecom', email: 'pickup-test@example.com' },
    { 'X-Forwarded-For': clientIp, 'Idempotency-Key': attemptId },
  )
}

export function confirmedCharge(data: JObject, orderId: string, amount: number): string | null {
  if (
    data.id !== orderId ||
    data.status !== 'paid' ||
    data.amount !== amount ||
    data.amount_paid !== amount ||
    String(data.currency).toLowerCase() !== 'usd'
  )
    return null
  return typeof data.charge === 'string' && data.charge ? data.charge : null
}

export async function readPayment(config: Sandbox, orderId: string, amount: number) {
  const order = await request(cloverUrls(config.env).ecommerce + encodeURIComponent(orderId), config.privateKey)
  return confirmedCharge(order, orderId, amount)
}

export async function printOrder(config: Sandbox, orderId: string) {
  const event = await request(platform(config) + '/print_event', config.restToken, {
    orderRef: { id: orderId },
  })
  if (id(event.orderRef) !== orderId || !['CREATED', 'PRINTING'].includes(String(event.state))) {
    throw new Error('Clover did not acknowledge print request')
  }
  return id(event)
}
