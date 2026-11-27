// Server-only by construction: this module uses the Node filesystem for its journal.
import { isIP } from 'node:net'
import { basename } from 'node:path'
import type { CardConfig } from './config'
import type { CardQuote, CardReceipt } from './types'
import { CardError } from './types'
import {
  CloverHttpError,
  confirmedCharge,
  createOrder,
  orderMatches,
  payOrder,
  printOrder,
  readPayment,
} from './payment-clover'
import { paymentDirectory, readMilestone, recordMilestone } from './payment-store'

type Attempt = { fingerprint: string; totalCents: number }
type Input = {
  attemptId: string
  pickupName: string
  source: string
  fingerprint: string
  clientIp: string
}
type Prepared = { orderCart: Record<string, unknown>; quote: CardQuote }
type BeforePayError = { message: string; status: number }

async function receipt(
  config: CardConfig,
  dir: string,
  attempt: Attempt,
  persistRecovery = false,
): Promise<CardReceipt> {
  const [orderId, paid, declined, stopped, payStarted, printed, printStarted, review] =
    await Promise.all([
      readMilestone<string>(dir, 'order'),
      readMilestone<string>(dir, 'paid'),
      readMilestone<boolean>(dir, 'declined'),
      readMilestone<BeforePayError>(dir, 'stopped'),
      readMilestone<boolean>(dir, 'pay-started'),
      readMilestone<string>(dir, 'print-event'),
      readMilestone<boolean>(dir, 'print-started'),
      readMilestone<boolean>(dir, 'needs-review'),
    ])
  if (stopped) throw new CardError(stopped.message, stopped.status, 'not_submitted')
  let verified = Boolean(paid)
  if (!verified && !declined && payStarted && orderId && config.mode === 'sandbox') {
    // Recover an ambiguous charge via a read, including after a server restart.
    const charge = await readPayment(config, orderId, attempt.totalCents).catch(() => null)
    verified = Boolean(charge)
    if (charge && persistRecovery) await recordMilestone(dir, 'paid', charge)
  }
  return {
    orderId: orderId || (review ? basename(dir).slice(0, 8).toUpperCase() : ''),
    totalCents: attempt.totalCents,
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
  attemptId: string,
): Promise<CardReceipt | null> {
  const dir = paymentDirectory(config, attemptId)
  const attempt = await readMilestone<Attempt>(dir, 'attempt')
  return attempt ? receipt(config, dir, attempt) : null
}

export async function reconcileCardPayment(
  config: CardConfig,
  attemptId: string,
): Promise<CardReceipt | null> {
  const dir = paymentDirectory(config, attemptId)
  const attempt = await readMilestone<Attempt>(dir, 'attempt')
  return attempt ? finish(config, dir, attempt) : null
}

async function finish(config: CardConfig, dir: string, attempt: Attempt): Promise<CardReceipt> {
  const result = await receipt(config, dir, attempt, true)
  if (result.status !== 'paid' || result.printStatus !== 'not-requested') return result
  if (!(await recordMilestone(dir, 'print-started', true))) return receipt(config, dir, attempt)
  try {
    const eventId =
      config.mode === 'preview' ? 'fixture-event' : await printOrder(config, result.orderId)
    await recordMilestone(dir, 'print-event', eventId)
    return { ...result, printStatus: config.mode === 'preview' ? 'simulated' : 'requested' }
  } catch {
    return { ...result, printStatus: 'unconfirmed' }
  }
}

async function replay(config: CardConfig, dir: string, input: Input) {
  const previous = await readMilestone<Attempt>(dir, 'attempt')
  if (!previous) return null
  if (previous.fingerprint !== input.fingerprint) {
    throw new CardError('This checkout reference already belongs to a different basket.', 409)
  }
  return finish(config, dir, previous)
}

export async function submitCardPayment(
  config: CardConfig,
  input: Input,
  prepare: () => Promise<Prepared>,
): Promise<CardReceipt> {
  const dir = paymentDirectory(config, input.attemptId)
  const previous = await replay(config, dir, input)
  if (previous) return previous
  const validSource =
    config.mode === 'preview'
      ? input.source === 'preview'
      : /^clv_[A-Za-z0-9_-]{1,256}$/.test(input.source)
  if (!validSource || (config.mode === 'sandbox' && !isIP(input.clientIp))) {
    throw new CardError(
      'The payment details are incomplete. Please review checkout.',
      400,
      'not_submitted',
    )
  }

  const { quote, orderCart } = await prepare()
  const attempt = { fingerprint: input.fingerprint, totalCents: quote.totalCents }
  if (!(await recordMilestone(dir, 'attempt', attempt))) {
    const concurrent = await replay(config, dir, input)
    if (!concurrent) throw new Error('Checkout journal is unavailable')
    return concurrent
  }

  let orderId: string
  try {
    orderId =
      config.mode === 'preview'
        ? 'TEST-' + input.attemptId.slice(0, 8).toUpperCase()
        : await createOrder(config, orderCart, input.pickupName, input.attemptId)
  } catch (error) {
    if (error instanceof CloverHttpError && [400, 401, 403, 404, 422].includes(error.status)) {
      const stopped = {
        message: 'Clover rejected this pickup order. No payment was submitted.',
        status: 502,
      }
      await recordMilestone(dir, 'stopped', stopped)
      throw new CardError(stopped.message, stopped.status, 'not_submitted')
    }
    // The create request may already have reached Clover. Never create another order for this attempt.
    await recordMilestone(dir, 'needs-review', true)
    return receipt(config, dir, attempt)
  }
  await recordMilestone(dir, 'order', orderId)
  if (config.mode === 'preview') {
    await recordMilestone(dir, 'paid', 'fixture-charge')
    return finish(config, dir, attempt)
  }

  const matched = await orderMatches(config, orderId, orderCart, attempt.totalCents).catch(
    () => null,
  )
  if (matched === null) {
    await recordMilestone(dir, 'needs-review', true)
    return receipt(config, dir, attempt)
  }
  if (!matched) {
    const stopped = {
      message: 'The Clover order could not be matched to your basket. No payment was submitted.',
      status: 409,
    }
    await recordMilestone(dir, 'stopped', stopped)
    throw new CardError(stopped.message, stopped.status, 'not_submitted')
  }
  await recordMilestone(dir, 'pay-started', true)
  let chargeId: string | null = null
  try {
    const response = await payOrder(
      config,
      orderId,
      attempt.totalCents,
      input.source,
      input.attemptId,
      input.clientIp,
    )
    chargeId = confirmedCharge(response, orderId, attempt.totalCents)
  } catch (error) {
    if (error instanceof CloverHttpError && error.code === 'card_declined') {
      chargeId = await readPayment(config, orderId, attempt.totalCents).catch(() => null)
      if (!chargeId) await recordMilestone(dir, 'declined', true)
    }
    // Any other error may have happened after charging. finish() reads the original order.
  }
  if (chargeId) await recordMilestone(dir, 'paid', chargeId)
  return finish(config, dir, attempt)
}
