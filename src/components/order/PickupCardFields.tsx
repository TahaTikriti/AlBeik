'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

import type { CardClient } from '@/lib/pickup-card/types'
import { copy } from '@/theme/copy'

import { PickupProgress } from './PickupProgress'

const fields = [
  { id: 'CARD_NUMBER', label: 'Card number', example: '••••  ••••  ••••  4242', columns: 'col-span-6' },
  { id: 'CARD_DATE', label: 'Expiry', example: 'MM / YY', columns: 'col-span-2' },
  { id: 'CARD_CVV', label: 'CVV', example: '•••', columns: 'col-span-2' },
  { id: 'CARD_POSTAL_CODE', label: 'ZIP', example: '64112', columns: 'col-span-2' },
] as const

type FieldId = (typeof fields)[number]['id']
type CloverElement = {
  mount(selector: string): void
  addEventListener?(event: string, listener: (data: unknown) => void): void
}
type CloverElements = { create(id: string, options: Record<string, unknown>): CloverElement }
type CloverSdk = {
  elements(): CloverElements
  createToken(): Promise<{ token?: string; errors?: Partial<Record<FieldId, string>> } | null>
  createApplePaymentRequest?(request: { amount: number }): unknown
  updateApplePaymentStatus?(status: 'success' | 'failed'): void
}

export type TokenizePickupCard = () => Promise<string>
/** Pays with a wallet token; true when the order went through. */
export type PayWithWallet = (token: string) => Promise<boolean>

const fieldStyle = {
  body: { backgroundColor: '#000000', margin: '0', overflow: 'hidden' },
  input: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16px',
    lineHeight: '46px',
    height: '46px',
    color: '#ffffff',
    border: '0',
    padding: '0',
    boxSizing: 'border-box',
    backgroundColor: '#000000',
  },
  'input::placeholder': { color: '#b8b8b8', opacity: '1' },
}

/**
 * Clover's hosted card fields (the card never touches this site) and, above
 * them, Apple Pay or Google Pay when this browser has one. Preview mode shows
 * sample fields and a switch to test a declined card.
 */
export function PickupCardFields({
  client,
  amountCents,
  onReady,
  onWallet,
  onPreviewSource,
}: {
  client: CardClient
  /** The fresh quote's total, for the wallet sheet; 0 hides the wallet. */
  amountCents: number
  onReady: (tokenize: TokenizePickupCard) => void
  onWallet: PayWithWallet
  onPreviewSource: (source: 'preview' | 'preview-decline') => void
}) {
  const mounted = useRef(false)
  const [clover, setClover] = useState<{ sdk: CloverSdk; elements: CloverElements } | null>(null)
  const loaded = clover !== null
  const [loadError, setLoadError] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<FieldId, string>>>({})
  const wallet = useRef(onWallet)
  useEffect(() => {
    wallet.current = onWallet
  }, [onWallet])
  // Stable, so the wallet button isn't remounted on every render.
  const [payWithWallet] = useState<PayWithWallet>(() => (token: string) => wallet.current(token))

  useEffect(() => {
    if (client.mode !== 'clover' || loaded || loadError) return
    const timeout = setTimeout(() => setLoadError(true), 12000)
    return () => clearTimeout(timeout)
  }, [client.mode, loaded, loadError])

  function mountFields() {
    if (client.mode !== 'clover' || mounted.current) return
    const Clover = (
      window as Window & {
        Clover?: new (publicKey: string, options: { merchantId: string }) => CloverSdk
      }
    ).Clover
    if (!Clover) {
      setLoadError(true)
      return
    }
    try {
      const instance = new Clover(client.publicKey, { merchantId: client.merchantId })
      const elements = instance.elements()
      for (const field of fields) elements.create(field.id, fieldStyle).mount('#pickup-' + field.id)
      mounted.current = true
      setClover({ sdk: instance, elements })
      setLoadError(false)
      onReady(async () => {
        const result = await instance.createToken()
        setErrors(result?.errors ?? {})
        if (!result?.token || Object.keys(result.errors ?? {}).length) {
          throw new Error('Check the card details.')
        }
        return result.token
      })
    } catch {
      setLoadError(true)
    }
  }

  return (
    <fieldset className="grid min-w-0 grid-cols-6 gap-x-3 gap-y-3.5">
      <legend className="mb-3 font-display text-[1.4rem] uppercase tracking-[0.03em]">{copy.checkout.payment}</legend>
      {client.mode === 'clover' && (
        <Script src={client.sdkUrl} onReady={mountFields} onError={() => setLoadError(true)} />
      )}
      {client.mode === 'clover' && clover && amountCents > 0 && (
        <Wallet
          key={amountCents}
          clover={clover}
          merchantId={client.merchantId}
          amountCents={amountCents}
          pay={payWithWallet}
        />
      )}
      {client.mode === 'clover' && !loaded && !loadError && (
        <div className="col-span-6 text-ink-muted">
          <PickupProgress label="Loading the secure card form…" />
        </div>
      )}
      {fields.map(({ id, label, example, columns }) => (
        <div key={id} className={columns + ' min-w-0'}>
          <span id={'label-' + id} className="mb-1 block text-small font-semibold">
            {label}
          </span>
          <div
            role="group"
            aria-labelledby={'label-' + id}
            id={'pickup-' + id}
            className="flex h-tap min-w-0 items-center overflow-hidden rounded-control border border-white/30 bg-black px-3 text-ink focus-within:border-red-text focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-red-text [&>iframe]:min-w-0"
          >
            {client.mode === 'preview' && <span className="truncate text-base text-ink-muted">{example}</span>}
          </div>
          {errors[id] && (
            <p role="alert" className="mt-1 text-small text-red-text">
              {errors[id]}
            </p>
          )}
        </div>
      ))}
      <p className="col-span-6 text-small text-ink-muted">
        {client.mode === 'preview' ? copy.checkout.previewNote : copy.checkout.cardNote}
      </p>
      {client.mode === 'preview' && (
        <label className="col-span-6 inline-flex min-h-tap items-center gap-3 text-small">
          <input
            type="checkbox"
            className="size-5 accent-red"
            onChange={(event) => onPreviewSource(event.target.checked ? 'preview-decline' : 'preview')}
          />
          {copy.checkout.previewDecline}
        </label>
      )}
      {loadError && (
        <div className="col-span-6 grid justify-items-start gap-2">
          <p className="text-small text-red-text" role="alert">
            {copy.checkout.fieldsFailed}
          </p>
          <button
            type="button"
            className="text-small font-semibold underline underline-offset-4"
            onClick={() => window.location.reload()}
          >
            {copy.checkout.reload}
          </button>
        </div>
      )}
    </fieldset>
  )
}

/**
 * Apple Pay (Safari with a card in Wallet) or Google Pay, per Clover's iframe
 * docs. Remounted when the total changes, since the sheet shows the amount.
 * Hidden if Clover can't create it.
 */
function Wallet({
  clover,
  merchantId,
  amountCents,
  pay,
}: {
  clover: { sdk: CloverSdk; elements: CloverElements }
  merchantId: string
  amountCents: number
  pay: PayWithWallet
}) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = box.current
    if (!container) return
    const { sdk, elements } = clover
    let cleanup = () => {}
    try {
      const applePay = (window as Window & { ApplePaySession?: { canMakePayments?: () => boolean } })
        .ApplePaySession
      if (applePay?.canMakePayments?.() && sdk.createApplePaymentRequest) {
        const request = sdk.createApplePaymentRequest({ amount: amountCents })
        elements
          .create('PAYMENT_REQUEST_BUTTON_APPLE_PAY', { applePaymentRequest: request, sessionIdentifier: merchantId })
          .mount('#pickup-wallet')
        // Apple Pay reports the token on the window and waits up to 30 s for a status.
        const onToken = async (event: Event) => {
          const token = (event as CustomEvent<{ tokenRecieved?: { id?: string } }>).detail?.tokenRecieved?.id
          const ok = token ? await pay(token) : false
          sdk.updateApplePaymentStatus?.(ok ? 'success' : 'failed')
        }
        window.addEventListener('paymentMethod', onToken)
        cleanup = () => window.removeEventListener('paymentMethod', onToken)
      } else {
        const button = elements.create('PAYMENT_REQUEST_BUTTON', {
          paymentReqData: {
            total: { label: 'AlBeik pickup', amount: amountCents },
            options: { button: { buttonType: 'short' } },
          },
        })
        button.mount('#pickup-wallet')
        button.addEventListener?.('paymentMethod', (data) => {
          const value = data as { token?: string; tokenRecieved?: { id?: string } }
          const token = value?.token ?? value?.tokenRecieved?.id
          if (token) void pay(token)
        })
      }
    } catch {
      // No wallet here: leave just the card form.
      if (container.parentElement) container.parentElement.hidden = true
    }
    return () => {
      cleanup()
      container.replaceChildren()
    }
  }, [clover, merchantId, amountCents, pay])

  return (
    <div className="col-span-6 grid gap-3">
      <div id="pickup-wallet" ref={box} className="min-h-10 empty:hidden" />
      <p className="label text-center text-[0.65rem] text-ink-muted">{copy.checkout.walletOr}</p>
    </div>
  )
}
