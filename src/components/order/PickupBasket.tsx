'use client'

import Image from 'next/image'
import { useState } from 'react'

import {
  MAX_ITEM_QUANTITY,
  PICKUP_SPIKE_PATH,
  type BasketQuote,
  type CheckoutResult,
  type PickupProduct,
} from '@/lib/pickup-spike/basket'
import { formatPrice } from '@/lib/text'

import { ui } from '../ui/classes'

type Props = { products: PickupProduct[]; returnedFromCheckout: boolean }

export function PickupBasket({ products, returnedFromCheckout }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [preview, setPreview] = useState<BasketQuote | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const lines = products.flatMap((product) =>
    product.options.flatMap((option) => {
      const quantity = quantities[option.id] ?? 0
      return quantity ? [{ ...option, quantity }] : []
    }),
  )
  const subtotal = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0)
  const count = lines.reduce((sum, line) => sum + line.quantity, 0)

  function changeQuantity(id: string, delta: number) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, Math.min(MAX_ITEM_QUANTITY, (current[id] ?? 0) + delta)),
    }))
    setError('')
  }

  async function checkout() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${PICKUP_SPIKE_PATH}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtotalCents: subtotal,
          lines: lines.map(({ id, quantity }) => ({ id, quantity })),
        }),
      })
      const result: CheckoutResult | { error: string } = await response.json()
      if ('error' in result) {
        setError(result.error)
        return
      }
      if (result.kind === 'clover-sandbox') {
        window.location.assign(result.url)
        return
      }
      setPreview(result.quote)
      document.getElementById('basket')?.scrollIntoView({ block: 'start' })
    } catch {
      setError('Could not start checkout. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      data-page="pickup-spike"
      className={`${ui.container} grid gap-8 pt-10 pb-section md:pt-16`}
    >
      <header className="grid gap-2">
        <p className="label text-red-text">Pickup preview · State Line Rd</p>
        <h1 className="text-display-1">Build your basket</h1>
        <p className="text-lg text-ink-muted">Choose your food here. Pay on Clover.</p>
      </header>
      {returnedFromCheckout ? (
        <p role="status" className="rounded-card border border-line bg-surface-raised px-5 py-3">
          You’re back from Clover’s test checkout. No pickup order was placed.
        </p>
      ) : null}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section aria-label="Pickup menu" className="grid gap-4">
          {products.length === 0 ? <p>The preview menu is unavailable.</p> : null}
          {products.map((product) => (
            <article
              key={product.slug}
              className={`grid overflow-hidden rounded-card border border-line bg-surface-raised ${product.image ? 'sm:grid-cols-[10rem_minmax(0,1fr)]' : ''}`}
            >
              {product.image ? (
                <div className="relative aspect-[16/9] sm:aspect-auto sm:min-h-40">
                  <Image
                    src={product.image.url}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 160px, 100vw"
                    className="object-cover"
                    style={{
                      objectPosition: `${product.image.focalX}% ${product.image.focalY}%`,
                    }}
                  />
                </div>
              ) : null}
              <div className="grid content-start gap-3 p-4 sm:p-5">
                <h2 className="font-display text-2xl leading-tight uppercase">{product.name}</h2>
                {product.description ? (
                  <p className="text-small text-ink-muted">{product.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {product.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={`Add ${option.name}`}
                      disabled={
                        busy || preview != null || quantities[option.id] === MAX_ITEM_QUANTITY
                      }
                      onClick={() => changeQuantity(option.id, 1)}
                      className="btn btn-ghost min-h-11 px-3 text-base disabled:opacity-50"
                    >
                      {option.id.endsWith(':combo') ? 'Add combo' : 'Add'} ·{' '}
                      {formatPrice(option.priceCents / 100)}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
          {count > 0 && !preview ? (
            <a
              href="#basket"
              className="btn btn-red fixed inset-x-3 bottom-[calc(0.6rem+var(--safe-bottom))] z-(--z-sticky) min-h-12 md:static md:justify-self-start lg:hidden"
            >
              View basket ({count}) · {formatPrice(subtotal / 100)}
            </a>
          ) : null}
        </section>

        <section
          id="basket"
          aria-labelledby="basket-title"
          className="grid scroll-mt-24 gap-4 rounded-card border border-line bg-surface-raised p-5 shadow-raised lg:sticky lg:top-24"
        >
          <h2 id="basket-title" className="font-display text-3xl uppercase">
            {preview ? 'Payment preview' : 'Your basket'}
          </h2>
          {!lines.length ? <p className="text-ink-muted">Add something from the menu.</p> : null}
          <ul className="grid gap-3">
            {(preview?.lines ?? lines).map((line) => (
              <li key={line.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <span>{line.name}</span>
                <span className="tabular-nums">
                  {formatPrice((line.priceCents * line.quantity) / 100)}
                </span>
                {preview ? (
                  <span className="text-small text-ink-muted">Qty {line.quantity}</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Remove one ${line.name}`}
                      className="btn btn-ghost size-11 px-0"
                      disabled={busy}
                      onClick={() => changeQuantity(line.id, -1)}
                    >
                      −
                    </button>
                    <span aria-label={`Quantity ${line.quantity}`}>{line.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Add one ${line.name}`}
                      className="btn btn-ghost size-11 px-0 disabled:opacity-50"
                      disabled={busy || line.quantity === MAX_ITEM_QUANTITY}
                      onClick={() => changeQuantity(line.id, 1)}
                    >
                      +
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-4 border-t border-line pt-4 font-semibold">
            <span>Subtotal</span>
            <output aria-live="polite" className="tabular-nums">
              {formatPrice((preview?.subtotalCents ?? subtotal) / 100)}
            </output>
          </div>
          <p className="text-small text-ink-muted">
            {preview
              ? 'This is what Clover would receive. No payment was taken.'
              : 'Test only. Tax and pickup times aren’t included in this preview.'}
          </p>
          {error ? <p role="alert">{error}</p> : null}
          {preview ? (
            <button type="button" className={ui.buttonSecondary} onClick={() => setPreview(null)}>
              Back to basket
            </button>
          ) : (
            <button
              type="button"
              className={`${ui.buttonPrimary} disabled:opacity-50`}
              disabled={!lines.length || busy}
              onClick={checkout}
            >
              {busy ? 'Opening checkout…' : 'Continue to payment'}
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
