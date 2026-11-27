'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import type { CardClient, CardQuote, CardReceipt } from '@/lib/pickup-card/types'
import { MAX_ITEM_QUANTITY } from '@/lib/pickup-card/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'

import { useBag } from './bag/BagProvider'
import { Stepper } from './bag/Stepper'
import { PickupCardFields, type TokenizePickupCard } from './PickupCardFields'
import { attempts, type CheckoutError, DETAILS_KEY, donePath, postCheckout } from './bag/checkoutClient'
import { PickupProgress } from './PickupProgress'

const money = (cents: number) => formatPrice(cents / 100)
type Quote = CardQuote & { readyAt: string }
type Details = { name: string; phone: string; email: string }
const NO_DETAILS: Details = { name: '', phone: '', email: '' }
const SETTLED = new Set(['requote', 'not_submitted', 'closed'])

type Props = { client: CardClient; timeZone: string }

/**
 * The whole checkout on one screen: the bag with the live Clover total, who's
 * picking up, and payment. "Pay" stays off until the total on screen is the
 * one Clover just quoted for this exact bag.
 */
export function PickupCheckout({ client, timeZone }: Props) {
  const router = useRouter()
  const { lines, ready, dispatch, contact } = useBag()
  const key = JSON.stringify(lines.map(({ optionId, modifierIds, quantity }) => ({ optionId, modifierIds, quantity })))
  const [quote, setQuote] = useState<{ key: string; value: Quote } | null>(null)
  const [quoteError, setQuoteError] = useState<{ key: string; message: string; code?: string } | null>(null)
  const [requote, setRequote] = useState(0)
  const [details, setDetails] = useState<Details>(NO_DETAILS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dropped, setDropped] = useState(0)
  const latestLines = useRef(lines)
  useEffect(() => {
    latestLines.current = lines
  }, [lines])
  const [fieldsReady, setFieldsReady] = useState(false)
  const tokenize = useRef<TokenizePickupCard | null>(null)
  const previewSource = useRef<'preview' | 'preview-decline'>('preview')
  const lock = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const errorBox = useRef<HTMLParagraphElement>(null)

  // A payment still in flight in this tab: show its status, never a second Pay.
  useEffect(() => {
    if (attempts.pending()) router.replace(donePath)
  }, [router])

  // Remembered details from the last order on this device (after hydration).
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) ?? 'null') as Partial<Details> | null
        if (saved && typeof saved === 'object')
          setDetails((current) =>
            current.name || current.phone
              ? current
              : {
                  name: String(saved.name ?? '').slice(0, 80),
                  phone: String(saved.phone ?? '').slice(0, 32),
                  email: String(saved.email ?? '').slice(0, 254),
                },
          )
      } catch {
        // Nothing saved, or storage blocked.
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Price the bag whenever it changes.
  useEffect(() => {
    if (!ready || key === '[]') return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      postCheckout<Quote>('/quote', { lines: JSON.parse(key) }, controller.signal)
        .then((value) => {
          setQuote({ key, value })
          setQuoteError(null)
        })
        .catch((e: CheckoutError) => {
          if (controller.signal.aborted) return
          const gone = e.code === 'unavailable' && Array.isArray(e.detail?.lines) ? new Set(e.detail.lines) : null
          if (gone?.size) {
            // Sold out or off the menu since the bag was filled: drop just those, then re-price.
            dispatch({ type: 'replace', lines: latestLines.current.filter((_, index) => !gone.has(index)) })
            setDropped((n) => n + gone.size)
            return
          }
          setQuoteError({ key, message: e.message, code: e.code })
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key, ready, requote, dispatch])

  const fresh = quote?.key === key && quoteError?.key !== key ? quote.value : null
  const closed = quoteError?.key === key && quoteError.code === 'closed' ? quoteError.message : null
  const problem = quoteError?.key === key && !closed ? quoteError.message : null
  const readyTime = fresh
    ? new Date(fresh.readyAt).toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit' })
    : null

  function showError(message: string) {
    setError(message)
    requestAnimationFrame(() => errorBox.current?.focus())
  }

  const pay = useCallback(
    async (walletToken?: string): Promise<boolean> => {
      if (lock.current || !fresh) return false
      if (attempts.pending()) {
        router.replace(donePath)
        return false
      }
      if (!form.current?.reportValidity()) return false
      lock.current = true
      setBusy(true)
      setError('')
      let sent = false
      // Stays locked while the confirmation page loads: a tap then would be a second order.
      let leaving = false
      try {
        const source =
          walletToken ?? (client.mode === 'preview' ? previewSource.current : await tokenize.current?.())
        if (!source) throw new Error(copy.checkout.fieldsLoading)
        const contactDetails = { name: details.name.trim(), phone: details.phone.trim(), email: details.email.trim() }
        try {
          localStorage.setItem(DETAILS_KEY, JSON.stringify(contactDetails))
        } catch {
          // Not remembered; nothing else changes.
        }
        const attemptId = attempts.begin()
        if (!attemptId) {
          leaving = true
          router.replace(donePath)
          return false
        }
        sent = true
        const receipt = await postCheckout<CardReceipt>('/pay', {
          attemptId,
          quoteId: fresh.quoteId,
          lines: JSON.parse(key),
          pickupName: contactDetails.name,
          phone: contactDetails.phone,
          email: contactDetails.email || undefined,
          source,
        })
        if (receipt.status === 'declined') {
          attempts.settle()
          showError(copy.checkout.declined)
          return false
        }
        leaving = true
        router.replace(donePath)
        return receipt.status === 'paid'
      } catch (e) {
        const failure = e as CheckoutError
        if (failure.code && SETTLED.has(failure.code)) {
          // Clover was never charged: this tab can try again.
          attempts.settle()
          showError(failure.message)
          setRequote((n) => n + 1)
        } else if (sent) {
          leaving = true
          router.replace(donePath)
        } else {
          showError(failure.message || copy.checkout.fieldsLoading)
        }
        return false
      } finally {
        if (!leaving) {
          lock.current = false
          setBusy(false)
        }
      }
    },
    [client.mode, details, fresh, key, router],
  )

  function submit(event: FormEvent) {
    event.preventDefault()
    void pay()
  }

  if (!ready) return <PickupProgress label={copy.checkout.checking} />
  if (!lines.length) {
    return (
      <div className="grid justify-items-start gap-4">
        <p className="text-lg">{copy.bag.empty}</p>
        <Link href="/menu" className="btn btn-red">
          {copy.bag.emptyCta}
        </Link>
      </div>
    )
  }

  const update = (field: keyof Details) => (event: { target: { value: string } }) =>
    setDetails((current) => ({ ...current, [field]: event.target.value }))
  const input =
    'h-tap w-full rounded-control border border-white/30 bg-black px-3 text-base font-normal text-white focus-visible:border-red-text'

  return (
    <form ref={form} onSubmit={submit} className="grid gap-8">
      <section aria-labelledby="bag-title" className="grid gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="bag-title" className="font-display text-[1.4rem] uppercase tracking-[0.03em]">
            {copy.checkout.bag}
          </h2>
          <Link href="/menu" className="label text-[0.7rem] text-red-text underline-offset-4 hover:underline">
            {copy.checkout.edit}
          </Link>
        </div>
        <ul className="grid divide-y divide-white/10">
          {lines.map((line, index) => {
            const quoted = fresh?.lines[index]
            const parts = [line.label !== 'Regular' ? line.label : '', ...line.modifierNames].filter(Boolean)
            return (
              <li key={index} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{line.name}</p>
                  {parts.length ? <p className="text-small text-ink-muted">{copy.checkout.lineOptions(parts)}</p> : null}
                </div>
                <span className="tabular-nums">
                  {money((quoted?.unitCents ?? line.unitCents) * line.quantity)}
                </span>
                <div className="col-span-2 flex items-center gap-3">
                  <Stepper
                    size="sm"
                    value={line.quantity}
                    min={1}
                    max={MAX_ITEM_QUANTITY}
                    onChange={(quantity) => dispatch({ type: 'quantity', index, quantity })}
                  />
                  <button
                    type="button"
                    className="min-h-tap px-2 text-small text-ink-muted underline underline-offset-4 hover:text-white"
                    aria-label={copy.bag.remove(line.name)}
                    onClick={() => dispatch({ type: 'remove', index })}
                  >
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
        <dl className="grid gap-1.5 border-t border-white/15 pt-4 text-small tabular-nums" aria-live="polite">
          {fresh ? (
            <>
              <div className="flex justify-between">
                <dt>{copy.checkout.subtotal}</dt>
                <dd>{money(fresh.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{copy.checkout.tax}</dt>
                <dd>{money(fresh.taxCents)}</dd>
              </div>
              <div className="flex justify-between font-display text-2xl uppercase">
                <dt>{copy.checkout.total}</dt>
                <dd>{money(fresh.totalCents)}</dd>
              </div>
            </>
          ) : problem || closed ? null : (
            <div className="text-ink-muted">
              <PickupProgress label={copy.checkout.checking} />
            </div>
          )}
        </dl>
        {dropped ? (
          <p role="status" className="text-small text-ink-muted">
            {copy.bag.dropped(dropped)}
          </p>
        ) : null}
        {problem ? (
          <div role="alert" className="grid gap-3">
            <p className="font-semibold text-red-text">{problem}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-red min-h-11 px-5" onClick={() => setRequote((n) => n + 1)}>
                {copy.checkout.retryQuote}
              </button>
              {contact.phoneHref ? (
                <a href={contact.phoneHref} className="btn btn-ghost min-h-11 px-5 text-white">
                  {copy.bag.call}
                </a>
              ) : null}
              <Link href="/order/delivery" className="btn btn-ghost min-h-11 px-5 text-white">
                {copy.bag.apps}
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      {closed ? (
        <section role="status" className="grid gap-3 rounded-card border border-white/15 p-5">
          <h2 className="font-display text-[1.4rem] uppercase tracking-[0.03em]">{copy.checkout.closedTitle}</h2>
          <p>{closed}</p>
          <div className="flex flex-wrap gap-2">
            {contact.phoneHref ? (
              <a href={contact.phoneHref} className="btn btn-red min-h-11 px-5">
                {copy.bag.call}
              </a>
            ) : null}
            <Link href="/order/delivery" className="btn btn-ghost min-h-11 px-5 text-white">
              {copy.bag.apps}
            </Link>
          </div>
        </section>
      ) : (
        <>
          <fieldset className="grid gap-4" disabled={busy}>
            <legend className="mb-3 flex w-full flex-wrap items-baseline justify-between gap-x-4">
              <span className="font-display text-[1.4rem] uppercase tracking-[0.03em]">{copy.checkout.details}</span>
              {readyTime ? (
                <span className="label text-[0.7rem] text-red-text">{copy.checkout.readyAround(readyTime)}</span>
              ) : null}
            </legend>
            <label className="grid gap-1 text-small font-semibold">
              {copy.checkout.name}
              <input
                name="name"
                autoComplete="name"
                maxLength={80}
                required
                pattern=".*\S.*"
                value={details.name}
                onChange={update('name')}
                className={input}
              />
            </label>
            <label className="grid gap-1 text-small font-semibold">
              {copy.checkout.phone}
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                required
                minLength={10}
                maxLength={32}
                value={details.phone}
                onChange={update('phone')}
                aria-describedby="phone-help"
                className={input}
              />
              <span id="phone-help" className="font-normal text-ink-muted">
                {copy.checkout.phoneHelp}
              </span>
            </label>
            <label className="grid gap-1 text-small font-semibold">
              {copy.checkout.email}
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                value={details.email}
                onChange={update('email')}
                className={input}
              />
            </label>
          </fieldset>

          <PickupCardFields
            client={client}
            amountCents={fresh?.totalCents ?? 0}
            onReady={(fn) => {
              tokenize.current = fn
              setFieldsReady(true)
            }}
            onWallet={pay}
            onPreviewSource={(source) => {
              previewSource.current = source
            }}
          />

          <div className="grid gap-3">
            <p ref={errorBox} tabIndex={-1} role="alert" className="font-semibold text-red-text outline-none empty:hidden">
              {error}
            </p>
            <button
              type="submit"
              className="btn btn-red min-h-14 w-full text-lg disabled:opacity-50"
              disabled={busy || !fresh || (client.mode === 'clover' && !fieldsReady)}
            >
              {busy ? copy.checkout.paying : fresh ? copy.checkout.pay(money(fresh.totalCents)) : copy.checkout.checking}
            </button>
          </div>
        </>
      )}
    </form>
  )
}
