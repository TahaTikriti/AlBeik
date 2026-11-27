'use client'

import { useEffect, useState } from 'react'

import type { CardClient, CardReceipt } from '@/lib/pickup-card/types'
import { formatPrice } from '@/lib/text'

import { ui } from '../ui/classes'
import {
  checkoutAttemptKey,
  pickupCardPath,
  pickupPaymentRetryPath,
  postPickupCard,
} from './pickupCardClient'
import { PickupProgress } from './PickupProgress'

type Status =
  | { kind: 'checking' }
  | { kind: 'missing' }
  | { kind: 'stopped'; message: string }
  | { kind: 'receipt'; receipt: CardReceipt }

export function PickupWaiting({
  client,
  phone,
}: {
  client: CardClient
  phone: { label: string; href: string } | null
}) {
  const key = checkoutAttemptKey(client)
  const [status, setStatus] = useState<Status>({ kind: 'checking' })
  const [cycle, setCycle] = useState(0)
  const [polling, setPolling] = useState(true)
  const preview = client.mode === 'preview'

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function check(attemptId: string, checksLeft: number) {
      try {
        const receipt = await postPickupCard<CardReceipt>('/status', { attemptId })
        if (cancelled) return
        setStatus({ kind: 'receipt', receipt })
        if (receipt.status !== 'pending') {
          setPolling(false)
          return
        }
      } catch (error) {
        if (cancelled) return
        if (error instanceof Error && 'code' in error && error.code === 'not_submitted') {
          setStatus({ kind: 'stopped', message: error.message })
          setPolling(false)
          return
        }
      }
      if (checksLeft > 1) {
        timer = setTimeout(() => void check(attemptId, checksLeft - 1), 2500)
      } else {
        setPolling(false)
      }
    }

    // Defer the initial check until hydration so browser storage stays client-only.
    timer = setTimeout(() => {
      try {
        const attemptId = sessionStorage.getItem(key)
        if (attemptId) {
          void check(attemptId, 6)
          return
        }
      } catch {
        // Storage is unavailable in this browser.
      }
      setStatus({ kind: 'missing' })
      setPolling(false)
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [cycle, key])

  function continueCheckout() {
    if (status.kind !== 'missing') sessionStorage.removeItem(key)
    if (status.kind === 'receipt' && status.receipt.status === 'paid') {
      sessionStorage.removeItem(key + '.bag')
      sessionStorage.removeItem(key + '.name')
    }
    window.location.replace(
      status.kind === 'receipt' && status.receipt.status === 'declined'
        ? pickupPaymentRetryPath
        : pickupCardPath,
    )
  }

  const receipt = status.kind === 'receipt' ? status.receipt : null
  const needsReview = receipt?.status === 'review'
  const waiting = status.kind === 'checking' || receipt?.status === 'pending'
  const title = waiting
    ? polling
      ? 'Confirming your order'
      : 'Payment still pending'
    : receipt?.status === 'paid'
      ? preview
        ? 'Pickup preview complete'
        : 'Pickup order confirmed'
      : receipt?.status === 'declined'
        ? 'Payment declined'
        : needsReview
          ? 'Pickup order needs review'
          : status.kind === 'stopped'
            ? 'Order could not be placed'
            : 'No pickup order to show'

  return (
    <div data-page="pickup-spike" className={ui.container + ' grid gap-6 pt-8 pb-section sm:pt-14'}>
      <p className="label text-red-text">
        {preview ? 'Local preview' : 'Clover'} · State Line Rd
      </p>
      <section
        aria-labelledby="pickup-status-title"
        aria-live="polite"
        className="grid w-full max-w-2xl gap-4 rounded-card bg-surface-raised p-6 text-ink sm:p-8"
      >
        <h1 id="pickup-status-title" className="text-display-2">
          {title}
        </h1>
        {waiting && polling && <PickupProgress label="Checking with Clover…" />}
        {waiting && !polling && (
          <>
            <p className="text-ink-muted">
              We’re still waiting for payment confirmation. Check the status of this order before
              paying again.
            </p>
            {receipt?.orderId && (
              <p className="text-small text-ink-muted">
                Order reference <strong className="text-ink">{receipt.orderId}</strong>
              </p>
            )}
          </>
        )}
        {receipt?.status === 'paid' && (
          <>
            <p className="text-ink-muted">
              {preview
                ? 'Your simulated order is complete. You can try another pickup order.'
                : 'Clover confirmed payment for this pickup order.'}
            </p>
            <dl className="grid gap-3 border-t border-white/15 pt-4 text-small">
              <div className="flex justify-between gap-4">
                <dt>Order reference</dt>
                <dd className="break-all font-semibold">{receipt.orderId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>{preview ? 'Simulated total' : 'Test payment total'}</dt>
                <dd className="font-semibold tabular-nums">
                  {formatPrice(receipt.totalCents / 100)}
                </dd>
              </div>
              {!preview && (
                <div className="flex justify-between gap-4">
                  <dt>Kitchen ticket</dt>
                  <dd>
                    {receipt.printStatus === 'requested'
                      ? 'Printing requested'
                      : 'Print unconfirmed'}
                  </dd>
                </div>
              )}
            </dl>
          </>
        )}
        {receipt?.status === 'declined' && (
          <p className="text-ink-muted">
            Try a different card or call AlBeik to place your pickup order.
          </p>
        )}
        {status.kind === 'stopped' && <p className="text-ink-muted">{status.message}</p>}
        {needsReview && (
          <p className="text-ink-muted">
            Payment was never submitted. Ask the restaurant to check pickup reference{' '}
            <strong>{receipt.orderId}</strong> before placing another order.
          </p>
        )}
        {waiting
          ? !polling && (
              <button
                type="button"
                className={ui.buttonPrimary + ' justify-self-start'}
                onClick={() => {
                  setPolling(true)
                  setCycle((previous) => previous + 1)
                }}
              >
                Check payment status
              </button>
            )
          : !needsReview && (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className={ui.buttonPrimary} onClick={continueCheckout}>
                  {receipt?.status === 'declined' ? 'Try another card' : 'Back to pickup menu'}
                </button>
                {receipt?.status === 'declined' && phone && (
                  <a href={phone.href} className={ui.buttonSecondary}>
                    Call {phone.label}
                  </a>
                )}
              </div>
            )}
      </section>
    </div>
  )
}
