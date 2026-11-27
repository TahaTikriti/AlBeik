// Server-only: orchestrates one Clover order and one charge per checkout attempt.
import { isIP } from 'node:net'

import type { CardConfig } from './config'
import {
  CloverHttpError,
  confirmedCharge,
  createOrder,
  orderMatches,
  payOrder,
  printOrder,
  readPayment,
} from './payment-clover'
import type { CheckoutStore, WebOrderSummary } from './store'
import type { CardQuote, CardReceipt } from './types'
import { CardError } from './types'

type Attempt = { fingerprint: string; totalCents: number; readyAt?: string }
type Input = {
  attemptId: string
  pickupName: string
  source: string
  fingerprint: string
  clientIp: string
  /** The Clover order's note for the kitchen: name, phone, ready time. */
  note?: string
  /** Shown in the admin's Web orders list; the email also goes on Clover's receipt. */
  details?: Pick<WebOrderSummary, 'phone' | 'email' | 'readyAt' | 'ipHash'>
}
type Prepared = { orderCart: Record<string, unknown>; quote: CardQuote }
type BeforePayError = { message: string; status: number }

/** Preview and each merchant keep separate attempts. */
function scoped(config: CardConfig, attemptId: string) {
  return (config.mode === 'preview' ? 'preview' : config.merchantId) + ':' + attemptId
}

/** Mirror the receipt into the admin's Web orders list. */
async function report(store: CheckoutStore, id: string, result: CardReceipt) {
  // In review without an order, the receipt's ID is only our support reference.
  const cloverOrderId = await store.read<string>(id, 'order')
  await store.summarize(id, {
    status: result.status,
    printStatus: result.printStatus === 'simulated' ? 'requested' : result.printStatus,
    ...(cloverOrderId ? { cloverOrderId } : {}),
  })
  return result
}

async function receipt(
  config: CardConfig,
  store: CheckoutStore,
  id: string,
  attempt: Attempt,
  persistRecovery = false,
): Promise<CardReceipt> {
  const [orderId, paid, declined, stopped, payStarted, printed, printStarted, review] =
    await Promise.all([
      store.read<string>(id, 'order'),
      store.read<string>(id, 'paid'),
      store.read<boolean>(id, 'declined'),
      store.read<BeforePayError>(id, 'stopped'),
      store.read<boolean>(id, 'pay-started'),
      store.read<string>(id, 'print-event'),
      store.read<boolean>(id, 'print-started'),
      store.read<boolean>(id, 'needs-review'),
    ])
  if (stopped) throw new CardError(stopped.message, stopped.status, 'not_submitted')
  let verified = Boolean(paid)
  if (!verified && !declined && payStarted && orderId && config.mode === 'clover') {
    // Recover an ambiguous charge via a read, including after a server restart.
    const charge = await readPayment(config, orderId, attempt.totalCents).catch(() => null)
    verified = Boolean(charge)
    if (charge && persistRecovery) await store.claim(id, 'paid', charge)
  }
  const reference = id.slice(id.indexOf(':') + 1, id.indexOf(':') + 9).toUpperCase()
  return {
    orderId: orderId || (review ? reference : ''),
    totalCents: attempt.totalCents,
    ...(attempt.readyAt ? { readyAt: attempt.readyAt } : {}),
    status: verified ? 'paid' : declined ? 'declined' : review ? 'review' : 'pending',
    printStatus: printed
      ? config.mode === 'preview'
        ? 'simulated'
        : 'requested'
      : printStarted
        ? 'unconfirmed'
        : 'not-requested',
  }
}

export async function lookupCardPayment(
  config: CardConfig,
  store: CheckoutStore,
  attemptId: string,
): Promise<CardReceipt | null> {
  const id = scoped(config, attemptId)
  const attempt = await store.read<Attempt>(id, 'attempt')
  return attempt ? receipt(config, store, id, attempt) : null
}

export async function reconcileCardPayment(
  config: CardConfig,
  store: CheckoutStore,
  attemptId: string,
): Promise<CardReceipt | null> {
  const id = scoped(config, attemptId)
  const attempt = await store.read<Attempt>(id, 'attempt')
  return attempt ? finish(config, store, id, attempt) : null
}

async function finish(
  config: CardConfig,
  store: CheckoutStore,
  id: string,
  attempt: Attempt,
): Promise<CardReceipt> {
  const result = await receipt(config, store, id, attempt, true)
  if (result.status !== 'paid' || result.printStatus !== 'not-requested')
    return report(store, id, result)
  if (!(await store.claim(id, 'print-started', true)))
    return report(store, id, await receipt(config, store, id, attempt))
  try {
    const eventId =
      config.mode === 'preview' ? 'fixture-event' : await printOrder(config, result.orderId)
    await store.claim(id, 'print-event', eventId)
    return report(store, id, {
      ...result,
      printStatus: config.mode === 'preview' ? 'simulated' : 'requested',
    })
  } catch {
    return report(store, id, { ...result, printStatus: 'unconfirmed' })
  }
}

async function replay(config: CardConfig, store: CheckoutStore, id: string, input: Input) {
  const previous = await store.read<Attempt>(id, 'attempt')
  if (!previous) return null
  if (previous.fingerprint !== input.fingerprint) {
    throw new CardError('This checkout reference already belongs to a different basket.', 409)
  }
  return finish(config, store, id, previous)
}

export async function submitCardPayment(
  config: CardConfig,
  store: CheckoutStore,
  input: Input,
  prepare: () => Promise<Prepared>,
): Promise<CardReceipt> {
  const id = scoped(config, input.attemptId)
  const previous = await replay(config, store, id, input)
  if (previous) return previous
  const validSource =
    config.mode === 'preview'
      ? input.source === 'preview' || input.source === 'preview-decline'
      : /^clv_[A-Za-z0-9_-]{1,256}$/.test(input.source)
  if (!validSource || (config.mode === 'clover' && !isIP(input.clientIp))) {
    throw new CardError(
      'The payment details are incomplete. Please review checkout.',
      400,
      'not_submitted',
    )
  }

  const { quote, orderCart } = await prepare()
  const attempt: Attempt = {
    fingerprint: input.fingerprint,
    totalCents: quote.totalCents,
    ...(input.details?.readyAt ? { readyAt: input.details.readyAt } : {}),
  }
  if (!(await store.claim(id, 'attempt', attempt))) {
    const concurrent = await replay(config, store, id, input)
    if (!concurrent) throw new Error('Checkout store is unavailable')
    return concurrent
  }
  await store.summarize(id, {
    status: 'pending',
    printStatus: 'not-requested',
    totalCents: quote.totalCents,
    pickupName: input.pickupName,
    lines: quote.lines.map(({ name, quantity }) => ({ name, quantity })),
    ...input.details,
  })

  let orderId: string
  try {
    orderId =
      config.mode === 'preview'
        ? 'TEST-' + input.attemptId.slice(0, 8).toUpperCase()
        : await createOrder(
            config,
            orderCart,
            input.pickupName,
            input.note ?? 'Pickup for ' + input.pickupName + ' (' + input.attemptId.slice(0, 8) + ')',
          )
  } catch (error) {
    if (error instanceof CloverHttpError && [400, 401, 403, 404, 422].includes(error.status)) {
      const stopped = {
        message: 'Clover rejected this pickup order. No payment was submitted.',
        status: 502,
      }
      await store.claim(id, 'stopped', stopped)
      await store.summarize(id, { status: 'stopped', printStatus: 'not-requested' })
      throw new CardError(stopped.message, stopped.status, 'not_submitted')
    }
    // The create request may already have reached Clover. Never create another order for this attempt.
    await store.claim(id, 'needs-review', true)
    return report(store, id, await receipt(config, store, id, attempt))
  }
  await store.claim(id, 'order', orderId)
  if (config.mode === 'preview') {
    if (input.source === 'preview-decline') await store.claim(id, 'declined', true)
    else await store.claim(id, 'paid', 'fixture-charge')
    return finish(config, store, id, attempt)
  }

  const matched = await orderMatches(config, orderId, orderCart, attempt.totalCents).catch(
    () => null,
  )
  if (matched === null) {
    await store.claim(id, 'needs-review', true)
    return report(store, id, await receipt(config, store, id, attempt))
  }
  if (!matched) {
    const stopped = {
      message: 'The Clover order could not be matched to your basket. No payment was submitted.',
      status: 409,
    }
    await store.claim(id, 'stopped', stopped)
    await store.summarize(id, { status: 'stopped', printStatus: 'not-requested', cloverOrderId: orderId })
    throw new CardError(stopped.message, stopped.status, 'not_submitted')
  }
  await store.claim(id, 'pay-started', true)
  let chargeId: string | null = null
  try {
    const response = await payOrder(
      config,
      orderId,
      attempt.totalCents,
      input.source,
      input.attemptId,
      input.clientIp,
      input.details?.email ?? null,
    )
    chargeId = confirmedCharge(response, orderId, attempt.totalCents)
  } catch (error) {
    if (error instanceof CloverHttpError && error.code === 'card_declined') {
      chargeId = await readPayment(config, orderId, attempt.totalCents).catch(() => null)
      if (!chargeId) await store.claim(id, 'declined', true)
    }
    // Any other error may have happened after charging. finish() reads the original order.
  }
  if (chargeId) await store.claim(id, 'paid', chargeId)
  return finish(config, store, id, attempt)
}
