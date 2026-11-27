'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

import type { CardClient } from '@/lib/pickup-card/types'
import { pickupPaymentRetryPath } from './pickupCardClient'
import { PickupProgress } from './PickupProgress'

const fields = [
  { id: 'CARD_NAME', label: 'Name on card', example: 'Test guest', columns: 'col-span-6' },
  {
    id: 'CARD_NUMBER',
    label: 'Card number',
    example: '••••  ••••  ••••  4242',
    columns: 'col-span-6',
  },
  { id: 'CARD_DATE', label: 'Expiration', example: 'MM / YY', columns: 'col-span-3' },
  { id: 'CARD_CVV', label: 'Security code', example: '•••', columns: 'col-span-3' },
  {
    id: 'CARD_STREET_ADDRESS',
    label: 'Billing street address',
    example: 'Street address',
    columns: 'col-span-6 sm:col-span-4',
  },
  {
    id: 'CARD_POSTAL_CODE',
    label: 'Billing ZIP',
    example: 'ZIP code',
    columns: 'col-span-6 sm:col-span-2',
  },
] as const

type FieldId = (typeof fields)[number]['id']
type CloverSdk = {
  elements(): {
    create(
      id: FieldId,
      styles: Record<string, Record<string, string>>,
    ): {
      mount(selector: string): void
    }
  }
  createToken(): Promise<{ token?: string; errors?: Partial<Record<FieldId, string>> } | null>
}

export type TokenizePickupCard = () => Promise<string>

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

export function PickupCardFields({
  client,
  onReady,
}: {
  client: CardClient
  onReady: (tokenize: TokenizePickupCard) => void
}) {
  const mounted = useRef(false)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<FieldId, string>>>({})

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
      const sdk = new Clover(client.publicKey, { merchantId: client.merchantId })
      const elements = sdk.elements()
      for (const field of fields) {
        elements.create(field.id, fieldStyle).mount('#pickup-' + field.id)
      }
      mounted.current = true
      setLoaded(true)
      setLoadError(false)
      onReady(async () => {
        const result = await sdk.createToken()
        setErrors(result?.errors ?? {})
        if (!result?.token || Object.keys(result.errors ?? {}).length) {
          throw new Error('Check the card details and billing address.')
        }
        return result.token
      })
    } catch {
      setLoadError(true)
    }
  }

  return (
    <fieldset className="grid min-w-0 grid-cols-6 gap-x-3 gap-y-3.5 sm:gap-x-4">
      <legend className="text-display-3 mb-2">Payment</legend>
      <p className="col-span-6 mb-1 text-small text-ink-muted">
        {client.mode === 'preview'
          ? 'Sample card for this preview. No card details needed.'
          : 'Use a Clover test card.'}
      </p>
      {client.mode === 'clover' && (
        <Script
          src={client.sdkUrl}
          onReady={mountFields}
          onError={() => setLoadError(true)}
        />
      )}
      {client.mode === 'clover' && !loaded && !loadError && (
        <div className="col-span-6 text-ink-muted">
          <PickupProgress label="Loading secure card fields…" />
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
            className="flex h-tap min-w-0 items-center overflow-hidden rounded-control border border-white/30 bg-surface px-3 text-ink focus-within:border-red-text focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-red-text [&>iframe]:min-w-0"
          >
            {client.mode === 'preview' && (
              <span className="text-base text-ink-muted">{example}</span>
            )}
          </div>
          {errors[id] && (
            <p role="alert" className="mt-1 text-small text-red-text">
              {errors[id]}
            </p>
          )}
        </div>
      ))}
      {loadError && (
        <div className="col-span-6 grid justify-items-start gap-2">
          <p className="text-small text-red-text" role="alert">
            The secure card fields couldn’t load. Your bag is saved for the retry.
          </p>
          <button
            type="button"
            className="text-small font-semibold underline underline-offset-4"
            onClick={() => window.location.replace(pickupPaymentRetryPath)}
          >
            Reload checkout
          </button>
        </div>
      )}
    </fieldset>
  )
}
