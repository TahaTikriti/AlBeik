'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import type { CardReceipt } from '@/lib/pickup-card/types'
import { copy } from '@/theme/copy'

import { useBag } from './bag/BagProvider'
import { attempts, type CheckoutError, checkoutPath, postCheckout } from './bag/checkoutClient'
import { PickupProgress } from './PickupProgress'

type Status =
  | { kind: 'checking' }
  | { kind: 'missing' }
  | { kind: 'stopped'; message: string }
  | { kind: 'receipt'; receipt: CardReceipt }

export type PickupPlace = {
  name: string
  addressLines: string[]
  mapUrl: string | null
  phone: string | null
  phoneHref: string | null
}

/**
 * The confirmation: asks the server for this tab's last order until Clover
 * settles it. Never shows the kitchen ticket's print status.
 */
export function PickupWaiting({ timeZone, place }: { timeZone: string; place: PickupPlace | null }) {
  const router = useRouter()
  const { dispatch } = useBag()
  const [status, setStatus] = useState<Status>({ kind: 'checking' })
  const [polling, setPolling] = useState(true)
  const [cycle, setCycle] = useState(0)
  const cleared = useRef(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function check(attemptId: string, checksLeft: number) {
      try {
        const receipt = await postCheckout<CardReceipt>('/status', { attemptId })
        if (cancelled) return
        setStatus({ kind: 'receipt', receipt })
        if (receipt.status !== 'pending') {
          attempts.settle()
          setPolling(false)
          return
        }
      } catch (error) {
        if (cancelled) return
        if ((error as CheckoutError).code === 'not_submitted') {
          attempts.settle()
          setStatus({ kind: 'stopped', message: (error as Error).message })
          setPolling(false)
          return
        }
      }
      if (checksLeft > 1) timer = setTimeout(() => void check(attemptId, checksLeft - 1), 2500)
      else setPolling(false)
    }

    // After hydration: the attempt lives in this tab's storage.
    timer = setTimeout(() => {
      const attemptId = attempts.last()
      if (attemptId) void check(attemptId, 8)
      else {
        setStatus({ kind: 'missing' })
        setPolling(false)
      }
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [cycle])

  const receipt = status.kind === 'receipt' ? status.receipt : null

  // Paid: the bag has done its job.
  useEffect(() => {
    if (receipt?.status === 'paid' && !cleared.current) {
      cleared.current = true
      dispatch({ type: 'clear' })
    }
  }, [receipt?.status, dispatch])

  const pending = status.kind === 'checking' || receipt?.status === 'pending'
  const readyTime = receipt?.readyAt
    ? new Date(receipt.readyAt).toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit' })
    : null

  let title: string
  let body: string | null = null
  if (pending) title = polling ? copy.checkout.confirming : copy.checkout.pendingTitle
  else if (receipt?.status === 'paid') title = copy.checkout.inTitle(receipt.orderId.slice(-4).toUpperCase())
  else if (receipt?.status === 'declined') {
    title = copy.checkout.declinedTitle
    body = copy.checkout.declined
  } else if (receipt?.status === 'review') {
    title = copy.checkout.reviewTitle
    body = copy.checkout.reviewBody(receipt.orderId)
  } else if (status.kind === 'stopped') {
    title = copy.checkout.stoppedTitle
    body = status.message
  } else title = copy.checkout.missingTitle
  if (pending && !polling) body = copy.checkout.pendingBody

  return (
    <section aria-live="polite" className="grid max-w-xl gap-5">
      <h1 className="text-display-2">{title}</h1>
      {pending && polling ? <PickupProgress label={copy.checkout.confirming} /> : null}
      {receipt?.status === 'paid' && readyTime ? (
        <p className="text-lg">{copy.checkout.readyAt(readyTime)}</p>
      ) : null}
      {body ? <p className="text-ink-muted">{body}</p> : null}

      {receipt?.status === 'paid' && place ? (
        <div className="grid gap-3 rounded-card border border-white/15 p-5">
          <p className="label text-[0.7rem] text-ink-muted">{copy.checkout.pickupAt}</p>
          <address className="not-italic">
            <span className="font-semibold">{place.name}</span>
            {place.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <div className="flex flex-wrap gap-2">
            {place.mapUrl ? (
              <a href={place.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-red min-h-11 px-5">
                {copy.checkout.directions}
              </a>
            ) : null}
            {place.phoneHref ? (
              <a href={place.phoneHref} className="btn btn-ghost min-h-11 px-5 text-white">
                {place.phone}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {pending && !polling ? (
          <button
            type="button"
            className="btn btn-red"
            onClick={() => {
              setPolling(true)
              setCycle((n) => n + 1)
            }}
          >
            {copy.checkout.checkAgain}
          </button>
        ) : null}
        {receipt?.status === 'declined' || status.kind === 'stopped' ? (
          <button type="button" className="btn btn-red" onClick={() => router.replace(checkoutPath)}>
            {copy.checkout.tryAgain}
          </button>
        ) : null}
        {(receipt?.status === 'declined' || receipt?.status === 'review' || (pending && !polling)) &&
        place?.phoneHref ? (
          <a href={place.phoneHref} className="btn btn-ghost text-white">
            {copy.bag.call}
          </a>
        ) : null}
        {!pending ? (
          <Link href="/menu" className="btn btn-ghost text-white">
            {receipt?.status === 'paid' ? copy.checkout.orderMore : copy.checkout.backToMenu}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
