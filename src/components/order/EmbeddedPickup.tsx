'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import type {
  CardClient,
  CardLine,
  CardProduct,
  CardQuote,
  CardReceipt,
} from '@/lib/pickup-card/types'
import { MAX_ITEM_QUANTITY } from '@/lib/pickup-spike/basket'
import { formatPrice } from '@/lib/text'

import { ui } from '../ui/classes'
import {
  checkoutAttemptKey,
  pickupCardPath,
  postPickupCard,
  restorePickupBag,
} from './pickupCardClient'
import { PickupCardFields, type TokenizePickupCard } from './PickupCardFields'
import { PickupCardMenuItem } from './PickupCardMenu'
import { PickupProgress } from './PickupProgress'

const money = (cents: number) => formatPrice(cents / 100)
const lineKey = (line: CardLine) => JSON.stringify([line.optionId, line.extraIds])
type Props = { products: CardProduct[]; client: CardClient }

export function EmbeddedPickup({ products, client }: Props) {
  const [lines, setLines] = useState<CardLine[]>([])
  const [bagRestored, setBagRestored] = useState(false)
  const [quote, setQuote] = useState<CardQuote | null>(null)
  const [pickupName, setPickupName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldsReady, setFieldsReady] = useState(false)
  const router = useRouter()
  const [added, setAdded] = useState('')
  const lock = useRef(false)
  const tokenize = useRef<TokenizePickupCard | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const storageKey = checkoutAttemptKey(client)
  const bagKey = storageKey + '.bag'
  const nameKey = storageKey + '.name'

  const requestQuote = useCallback(async (lines: CardLine[]) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const value = await postPickupCard<CardQuote>('/quote', { lines })
      setFieldsReady(false)
      tokenize.current = null
      setQuote(value)
      requestAnimationFrame(() => heading.current?.focus())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not check the bag.')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    const restore = setTimeout(() => {
      try {
        if (sessionStorage.getItem(storageKey)) {
          router.replace(pickupCardPath + '/waiting')
          return
        }
        const optionIds = new Set(
          products.flatMap((product) => product.options.map(({ id }) => id)),
        )
        const savedLines = restorePickupBag(bagKey, optionIds)
        setLines(savedLines)
        setPickupName((sessionStorage.getItem(nameKey) ?? '').slice(0, 60))
        if (
          savedLines.length &&
          new URLSearchParams(window.location.search).get('retry') === 'payment'
        ) {
          void requestQuote(savedLines)
        }
      } catch {
        // A new bag is available when saved browser data cannot be read.
      }
      setBagRestored(true)
    }, 0)
    return () => clearTimeout(restore)
  }, [bagKey, nameKey, products, requestQuote, router, storageKey])

  useEffect(() => {
    if (!bagRestored) return
    try {
      sessionStorage.setItem(bagKey, JSON.stringify(lines))
      sessionStorage.setItem(nameKey, pickupName)
    } catch {
      // The bag still works on this page if browser storage is unavailable.
    }
  }, [bagKey, bagRestored, lines, nameKey, pickupName])

  const options = products.flatMap((product) => product.options)
  const remaining = new Map(
    options.map((option) => [
      option.id,
      Math.min(MAX_ITEM_QUANTITY, option.stockLimit ?? MAX_ITEM_QUANTITY),
    ]),
  )
  for (const line of lines)
    remaining.set(line.optionId, (remaining.get(line.optionId) ?? 0) - line.quantity)
  const bag = lines.flatMap((line) => {
    const option = options.find((option) => option.id === line.optionId)
    if (!option) return []
    const extras = option.extras.filter((extra) => line.extraIds.includes(extra.id))
    return [
      {
        ...line,
        name: [option.name, ...extras.map((extra) => extra.name)].join(' + '),
        unitCents: option.priceCents + extras.reduce((sum, extra) => sum + extra.priceCents, 0),
      },
    ]
  })
  const subtotal = bag.reduce((sum, line) => sum + line.unitCents * line.quantity, 0)
  const displayedLines = quote
    ? quote.lines.map((line) => ({ ...line, selection: null as CardLine | null }))
    : bag.map((line) => ({ ...line, selection: line }))
  const count = bag.reduce((sum, line) => sum + line.quantity, 0)
  const preview = client.mode === 'preview'

  function changeQuantity(line: CardLine, delta: number) {
    if (delta > 0 && (remaining.get(line.optionId) ?? 0) < delta) return
    const key = lineKey(line)
    setLines((current) => {
      const index = current.findIndex((item) => lineKey(item) === key)
      if (index < 0) return delta > 0 ? [...current, line] : current
      return current
        .map((item, position) =>
          position !== index
            ? item
            : {
                ...item,
                quantity: Math.min(MAX_ITEM_QUANTITY, item.quantity + delta),
              },
        )
        .filter((item) => item.quantity > 0)
    })
    setError('')
    const name = options.find((item) => item.id === line.optionId)?.name
    setAdded(name ? 'Updated bag for ' + name : 'Bag updated')
  }

  function focusHeading() {
    requestAnimationFrame(() => heading.current?.focus())
  }

  async function pay(event: FormEvent) {
    event.preventDefault()
    if (!quote || !pickupName.trim() || lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    let sent = false
    try {
      if (sessionStorage.getItem(storageKey)) {
        router.replace(pickupCardPath + '/waiting')
        return
      }
      const source = preview ? 'preview' : await tokenize.current?.()
      if (!source) throw new Error('The secure card fields are still loading.')
      const id = crypto.randomUUID()
      sessionStorage.setItem(storageKey, id)
      sent = true
      await postPickupCard<CardReceipt>('/pay', {
        attemptId: id,
        pickupName: pickupName.trim(),
        source,
        quoteId: quote.quoteId,
        lines,
      })
      router.replace(pickupCardPath + '/waiting')
    } catch (e) {
      if (
        e instanceof Error &&
        'code' in e &&
        (e.code === 'requote' || e.code === 'not_submitted')
      ) {
        sessionStorage.removeItem(storageKey)
        setQuote(null)
        setError(e.message)
        focusHeading()
      } else if (sent) {
        router.replace(pickupCardPath + '/waiting')
      } else {
        setError(e instanceof Error ? e.message : 'Could not prepare payment.')
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  return (
    <div
      data-page="pickup-spike"
      className={ui.container + ' grid gap-7 pt-8 pb-section sm:gap-9 sm:pt-14'}
    >
      <header className="grid gap-2">
        <p className="label text-red-text">
          {preview ? 'Local preview' : 'Clover'} · State Line Rd
        </p>
        <h1 ref={heading} tabIndex={-1} className="text-display-1 outline-none">
          {quote ? 'Pickup checkout' : 'Order pickup'}
        </h1>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)] lg:gap-8">
        {quote ? (
          <form
            id="pickup-card-form"
            onSubmit={pay}
            className="grid min-w-0 gap-6 rounded-card bg-surface-raised p-5 text-ink sm:p-7"
          >
            <fieldset className="border-b border-white/15 pb-6">
              <legend className="text-display-3 mb-3">Pickup details</legend>
              <label className="grid gap-1 text-small font-semibold">
                Name for pickup
                <input
                  autoComplete="given-name"
                  maxLength={60}
                  required
                  pattern=".*\S.*"
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  disabled={busy}
                  className="h-tap w-full rounded-control border border-white/30 bg-surface px-3 text-base font-normal"
                />
              </label>
            </fieldset>
            <PickupCardFields
              client={client}
              onReady={(fn) => {
                tokenize.current = fn
                setFieldsReady(true)
              }}
            />
          </form>
        ) : (
          <section aria-label="Pickup menu" className="grid gap-4">
            {products.length === 0 && <p>The pickup menu is unavailable.</p>}
            {products.map((product) => (
              <PickupCardMenuItem
                key={product.slug}
                product={product}
                remaining={remaining}
                disabled={busy}
                onAdd={(line) => changeQuantity(line, 1)}
              />
            ))}
            <span role="status" className="sr-only">
              {added}
            </span>
          </section>
        )}

        <aside
          id="pickup-bag"
          aria-label="Your bag"
          className="grid scroll-mt-24 gap-4 rounded-card bg-surface-raised p-5 text-ink sm:p-7 lg:sticky lg:top-24"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-4">
            <h2 className="text-display-3">Your bag</h2>
            {quote && (
              <button
                type="button"
                className={ui.link + ' text-small font-semibold'}
                disabled={busy}
                onClick={() => {
                  setQuote(null)
                  setError('')
                  focusHeading()
                }}
              >
                Edit bag
              </button>
            )}
          </div>
          {!count && <p className="text-ink-muted">Add something from the pickup menu.</p>}
          <ul className="grid gap-4">
            {displayedLines.map(({ selection, ...line }, index) => (
              <li
                key={index}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1.5 text-small"
              >
                <span className="font-semibold">
                  {quote ? line.quantity + ' × ' : ''}
                  {line.name}
                </span>
                <span className="tabular-nums">{money(line.unitCents * line.quantity)}</span>
                {selection && (
                  <div className="flex items-center gap-2">
                    <button
                      aria-label={'Remove one ' + line.name}
                      type="button"
                      className="size-10 rounded-control border border-line text-xl"
                      disabled={busy}
                      onClick={() => changeQuantity(selection, -1)}
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      aria-label={'Add one ' + line.name}
                      type="button"
                      className="size-10 rounded-control border border-line text-xl disabled:opacity-50"
                      disabled={busy || (remaining.get(selection.optionId) ?? 0) <= 0}
                      onClick={() => changeQuantity(selection, 1)}
                    >
                      +
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="grid gap-2 border-t border-white/15 pt-4 text-small tabular-nums">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(quote?.subtotalCents ?? subtotal)}</span>
            </div>
            {quote && (
              <>
                <div className="flex justify-between">
                  <span>{preview ? 'Sample tax' : 'Tax'}</span>
                  <span>{money(quote.taxCents)}</span>
                </div>
                <div className="flex justify-between font-display text-2xl uppercase">
                  <span>Total</span>
                  <span>{money(quote.totalCents)}</span>
                </div>
              </>
            )}
          </div>
          {quote && quote.subtotalCents !== subtotal && (
            <p role="status" className="text-small">
              Prices changed. Review the updated bag above before paying.
            </p>
          )}
          {error && (
            <p role="alert" className="text-small font-semibold text-red-text">
              {error}
            </p>
          )}
          {busy && (
            <div className="text-ink-muted">
              <PickupProgress
                label={quote ? 'Submitting your payment…' : 'Checking prices and availability…'}
              />
            </div>
          )}
          {quote ? (
            <button
              type="submit"
              form="pickup-card-form"
              className="btn btn-red disabled:opacity-50"
              disabled={busy || (!preview && !fieldsReady)}
            >
              {busy
                ? 'Submitting…'
                : (preview ? 'Simulate payment · ' : 'Pay · ') + money(quote.totalCents)}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-red disabled:opacity-50"
              disabled={!count || busy}
              onClick={() => void requestQuote(lines)}
            >
              {busy ? 'Checking bag…' : 'Review checkout'}
            </button>
          )}
        </aside>
        {!quote && count > 0 && (
          <a
            href="#pickup-bag"
            className="btn btn-red fixed inset-x-3 bottom-[calc(0.6rem+var(--safe-bottom))] z-(--z-sticky) shadow-raised lg:hidden"
          >
            View bag ({count}) · {money(subtotal)}
          </a>
        )}
      </div>
    </div>
  )
}
