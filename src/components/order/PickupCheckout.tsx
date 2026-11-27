'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import type { CardClient, CardQuote, CardReceipt } from '@/lib/pickup-card/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'

import { useBag } from './bag/BagProvider'
import { PickupCardFields, type TokenizePickupCard } from './PickupCardFields'
import { attempts, type CheckoutError, DETAILS_KEY, donePath, postCheckout } from './bag/checkoutClient'
import { PickupProgress } from './PickupProgress'

const money = (cents: number) => formatPrice(cents / 100)
type Quote = CardQuote & { readyAt: string; slots?: string[] }
type Details = { name: string; phone: string; email: string }
const NO_DETAILS: Details = { name: '', phone: '', email: '' }
const SETTLED = new Set(['requote', 'not_submitted', 'closed'])

type Place = { name: string; address: string | null; mapUrl: string | null }
type Props = { client: CardClient; timeZone: string; place: Place }

/**
 * The checkout, one screen: when (ASAP or later today), the order with its
 * live Clover total, who's picking up (remembered from last time), and
 * payment, with Pay always in reach. "Pay" stays off until the total on
 * screen is the one Clover just quoted for this exact bag.
 */
export function PickupCheckout({ client, timeZone, place }: Props) {
  const router = useRouter()
  const { lines, ready, dispatch, contact, openBag, subtotalCents, count, prepMinutes } = useBag()
  const key = JSON.stringify(lines.map(({ optionId, modifierIds, quantity }) => ({ optionId, modifierIds, quantity })))
  const [quote, setQuote] = useState<{ key: string; value: Quote } | null>(null)
  const [quoteError, setQuoteError] = useState<{ key: string; message: string; code?: string } | null>(null)
  const [requote, setRequote] = useState(0)
  const [details, setDetails] = useState<Details>(NO_DETAILS)
  // Details remembered from the last order show as one line, with "Change".
  const [editDetails, setEditDetails] = useState(true)
  const [when, setWhen] = useState<'asap' | 'later'>('asap')
  const [slot, setSlot] = useState('')
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
        if (!saved || typeof saved !== 'object') return
        const restored = {
          name: String(saved.name ?? '').slice(0, 80),
          phone: String(saved.phone ?? '').slice(0, 32),
          email: String(saved.email ?? '').slice(0, 254),
        }
        setDetails((current) => (current.name || current.phone ? current : restored))
        if (restored.name.trim() && restored.phone.replace(/\D/g, '').length >= 10) setEditDetails(false)
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
    }, 150)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key, ready, requote, dispatch])

  const fresh = quote?.key === key && quoteError?.key !== key ? quote.value : null
  // The last quote's times stay up while a changed bag is re-priced.
  const plan = quote?.value ?? null
  const closed = quoteError?.key === key && quoteError.code === 'closed' ? quoteError.message : null
  const problem = quoteError?.key === key && !closed ? quoteError.message : null
  const clock = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit' })
  const slots = plan?.slots ?? []
  const pickupAt = when === 'later' && slots.includes(slot) ? slot : null

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
      if (!form.current?.checkValidity()) {
        // A remembered detail that no longer passes: open the fields to fix it.
        setEditDetails(true)
        requestAnimationFrame(() => form.current?.reportValidity())
        return false
      }
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
          ...(pickupAt ? { pickupAt } : {}),
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
    [client.mode, details, fresh, key, pickupAt, router],
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
  const asapLabel = plan ? copy.checkout.asapAt(clock(plan.readyAt)) : copy.checkout.asapIn(prepMinutes)

  const summary = (
    <Card
      title={copy.checkout.bag}
      action={
        <button
          type="button"
          onClick={openBag}
          className="label min-h-tap px-1 text-[0.7rem] text-red-text underline-offset-4 hover:underline"
        >
          {copy.checkout.edit}
        </button>
      }
    >
      <ul className="grid gap-2.5">
        {lines.map((line, index) => {
          const quoted = fresh?.lines[index]
          const parts = [line.label !== 'Regular' ? line.label : '', ...line.modifierNames].filter(Boolean)
          return (
            <li key={index} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3">
              <span className="font-display text-lg tabular-nums text-red-text">{line.quantity}×</span>
              <div className="min-w-0">
                <p className="font-semibold">{line.name}</p>
                {parts.length ? <p className="text-small text-ink-muted">{copy.checkout.lineOptions(parts)}</p> : null}
              </div>
              <span className="tabular-nums">{money((quoted?.unitCents ?? line.unitCents) * line.quantity)}</span>
            </li>
          )
        })}
      </ul>
      <dl className="grid gap-1.5 border-t border-white/15 pt-4 text-small tabular-nums" aria-live="polite">
        <div className="flex justify-between">
          <dt>{copy.bag.subtotalLine(count)}</dt>
          <dd>{money(fresh?.subtotalCents ?? subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{copy.checkout.tax}</dt>
          <dd>{fresh ? money(fresh.taxCents) : <Pending />}</dd>
        </div>
        <div className="flex items-baseline justify-between font-display text-2xl uppercase">
          <dt>{copy.checkout.total}</dt>
          <dd>{fresh ? money(fresh.totalCents) : <Pending wide />}</dd>
        </div>
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
              <a href={contact.phoneHref} className="btn btn-ghost min-h-11 px-5 text-white hover:text-black focus-visible:text-black">
                {copy.bag.call}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  )

  if (closed) {
    return (
      <div className="grid max-w-xl gap-5">
        <section role="status" className="grid gap-3 rounded-card border border-white/15 p-5">
          <h2 className="font-display text-[1.4rem] uppercase tracking-[0.03em]">{copy.checkout.closedTitle}</h2>
          <p>{closed}</p>
          <div className="flex flex-wrap gap-2">
            {contact.phoneHref ? (
              <a href={contact.phoneHref} className="btn btn-red min-h-11 px-5">
                {copy.bag.call}
              </a>
            ) : null}
            <Link href="/order/delivery" className="btn btn-ghost min-h-11 px-5 text-white hover:text-black focus-visible:text-black">
              {copy.bag.apps}
            </Link>
          </div>
        </section>
        {summary}
      </div>
    )
  }

  const payLabel = busy
    ? copy.checkout.paying
    : fresh
      ? copy.checkout.pay(money(fresh.totalCents))
      : problem
        ? copy.checkout.payWaiting
        : copy.checkout.checking

  return (
    <form
      ref={form}
      onSubmit={submit}
      className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] md:items-start md:gap-8"
    >
      <div className="grid min-w-0 gap-5">
        <Card title={copy.checkout.when}>
          <p className="text-small text-ink-muted">
            {place.name}
            {place.address ? ` · ${place.address}` : ''}
            {place.mapUrl ? (
              <>
                {' · '}
                <a href={place.mapUrl} className="underline underline-offset-4 hover:text-white">
                  {copy.checkout.directions}
                </a>
              </>
            ) : null}
          </p>
          <fieldset className="grid gap-2" disabled={busy}>
            <legend className="sr-only">{copy.checkout.when}</legend>
            <TimeOption checked={when === 'asap'} onChange={() => setWhen('asap')} label={copy.checkout.asap} hint={asapLabel} />
            {slots.length ? (
              <TimeOption
                checked={when === 'later'}
                onChange={() => {
                  setWhen('later')
                  if (!slots.includes(slot)) setSlot(slots[0] ?? '')
                }}
                label={copy.checkout.later}
                hint={copy.checkout.laterHint}
              >
                {when === 'later' ? (
                  <select
                    aria-label={copy.checkout.laterTime}
                    required
                    value={slots.includes(slot) ? slot : ''}
                    onChange={(event) => setSlot(event.target.value)}
                    className={`${input} mt-3`}
                  >
                    <option value="" disabled>
                      {copy.checkout.laterTime}
                    </option>
                    {slots.map((s) => (
                      <option key={s} value={s}>
                        {clock(s)}
                      </option>
                    ))}
                  </select>
                ) : null}
              </TimeOption>
            ) : null}
          </fieldset>
        </Card>

        <div className="md:hidden">{summary}</div>

        <Card
          title={copy.checkout.details}
          action={
            !editDetails ? (
              <button
                type="button"
                onClick={() => setEditDetails(true)}
                className="label min-h-tap px-1 text-[0.7rem] text-red-text underline-offset-4 hover:underline"
              >
                {copy.checkout.change}
              </button>
            ) : null
          }
        >
          {!editDetails ? (
            <p>
              <span className="font-semibold">{details.name}</span>
              <span className="text-ink-muted"> · {details.phone}</span>
              {details.email ? <span className="block text-small text-ink-muted">{details.email}</span> : null}
            </p>
          ) : null}
          <fieldset className={editDetails ? 'grid gap-4' : 'hidden'} disabled={busy}>
            <legend className="sr-only">{copy.checkout.details}</legend>
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
        </Card>

        <div className="rounded-card bg-charcoal p-5">
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
        </div>
      </div>

      <aside className="grid gap-4 md:sticky md:top-[calc(var(--spacing-header)+1.5rem)]">
        <div className="hidden md:block">{summary}</div>
        <p ref={errorBox} tabIndex={-1} role="alert" className="font-semibold text-red-text outline-none empty:hidden">
          {error}
        </p>
        {/* Phones: Pay stays in reach at the bottom of the screen. */}
        <div className="fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-white/10 bg-black/95 px-3 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] md:static md:border-0 md:bg-transparent md:p-0">
          <button
            type="submit"
            className="btn btn-red min-h-14 w-full text-lg disabled:opacity-60"
            disabled={busy || !fresh || (client.mode === 'clover' && !fieldsReady)}
          >
            {payLabel}
          </button>
          <p className="mt-2 text-center text-[0.75rem] text-ink-muted">
            {pickupAt ? copy.checkout.payNoteAt(clock(pickupAt)) : copy.checkout.payNote}
          </p>
        </div>
      </aside>
    </form>
  )
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-card bg-charcoal p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[1.3rem] uppercase tracking-[0.03em]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function TimeOption({
  checked,
  onChange,
  label,
  hint,
  children,
}: {
  checked: boolean
  onChange: () => void
  label: string
  hint: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-control border border-white/15 px-4 py-3 transition-colors has-[input:checked]:border-red has-[input:checked]:bg-red/12">
      <label className="flex cursor-pointer items-center gap-3">
        <input type="radio" name="when" checked={checked} onChange={onChange} className="size-5 shrink-0 accent-red" />
        <span className="grid">
          <span className="font-semibold">{label}</span>
          <span className="text-small text-ink-muted">{hint}</span>
        </span>
      </label>
      {children}
    </div>
  )
}

function Pending({ wide = false }: { wide?: boolean }) {
  return (
    <span
      aria-label={copy.checkout.checking}
      className={`inline-block h-[1em] animate-pulse rounded bg-white/15 align-middle ${wide ? 'w-20' : 'w-12'}`}
    />
  )
}
