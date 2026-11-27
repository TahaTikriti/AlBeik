'use client'

import { useState } from 'react'

import type { CardLine, CardProduct } from '@/lib/pickup-card/types'
import { formatPrice } from '@/lib/text'

import { Img } from '../ui/Img'
import { ui } from '../ui/classes'

const comboDetails = 'Small fries and your choice of a 20 oz fountain drink.'

export function PickupCardMenuItem({
  product,
  onAdd,
  disabled,
  remaining,
}: {
  product: CardProduct
  onAdd: (line: CardLine) => void
  remaining: Map<string, number>
  disabled: boolean
}) {
  const [optionId, setOptionId] = useState('')
  const [extraId, setExtraId] = useState('')
  const option =
    product.options.find((item) => item.id === optionId && item.available) ??
    product.options.find((item) => item.available)
  // Spike UI, replaced by the Add sheet (plan Task 6): extras from every group.
  const extrasOf = (o: typeof option) => o?.groups.flatMap((group) => group.modifiers) ?? []
  const extra = extrasOf(option).find((extra) => extra.id === extraId)
  const singleExtra = extrasOf(option).length === 1 ? extrasOf(option)[0] : null
  const total = (option?.priceCents ?? 0) + (extra?.priceCents ?? 0)
  const atLimit = option && remaining.get(option.id) === 0

  return (
    <article className="grid gap-x-4 gap-y-4 rounded-card bg-charcoal p-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:p-5">
      <div className="flex gap-3.5 sm:contents">
        {product.image && (
          <Img
            image={product.image}
            sizes="(min-width: 640px) 128px, 80px"
            className="aspect-square size-20 shrink-0 rounded-control object-cover sm:row-span-2 sm:size-32"
          />
        )}
        <div className={!product.image ? 'sm:col-span-2' : ''}>
          <h2 className="text-display-3 normal-case">{product.name}</h2>
          {product.description && (
            <p className="mt-1.5 text-small leading-snug text-ink-muted">{product.description}</p>
          )}
        </div>
      </div>
      <div className={'grid gap-3 ' + (product.image ? 'sm:col-start-2' : 'sm:col-span-2')}>
        {!option ? (
          <p className="label text-ink-muted">Sold out</p>
        ) : (
          <>
            {product.options.length > 1 && (
              <fieldset className="min-w-0" disabled={disabled}>
                <legend className="sr-only">Choose an option for {product.name}</legend>
                <div className="flex flex-wrap items-start gap-2">
                  {product.options.map((item) => {
                    const combo = isCombo(item.name)
                    return (
                      <PickupChoice
                        key={item.id}
                        group={product.slug + '-option'}
                        name={optionLabel(product.name, item.name)}
                        price={item.available ? formatPrice(item.priceCents / 100) : 'Sold out'}
                        selected={item.id === option.id}
                        disabled={!item.available}
                        details={combo ? comboDetails : undefined}
                        detailsId={combo ? product.slug + '-' + item.id + '-details' : undefined}
                        onChange={() => {
                          setOptionId(item.id)
                          setExtraId('')
                        }}
                      />
                    )
                  })}
                </div>
              </fieldset>
            )}
            {product.options.length === 1 && isCombo(option.name) && (
              <p className="text-small leading-snug text-ink-muted">{comboDetails}</p>
            )}
            {singleExtra ? (
              <label className="flex min-h-9 items-center gap-2 text-small">
                <input
                  type="checkbox"
                  className="size-4 accent-red"
                  disabled={disabled}
                  checked={Boolean(extra)}
                  onChange={(e) => setExtraId(e.target.checked ? singleExtra.id : '')}
                />
                {singleExtra.name} · +{formatPrice(singleExtra.priceCents / 100)}
              </label>
            ) : extrasOf(option).length > 1 ? (
              <fieldset className="min-w-0" disabled={disabled}>
                <legend className="mb-1.5 text-small text-ink-muted">Optional extra</legend>
                <div className="flex flex-wrap gap-2">
                  <PickupChoice
                    group={product.slug + '-extra'}
                    name="No extra"
                    selected={!extra}
                    onChange={() => setExtraId('')}
                  />
                  {extrasOf(option).map((choice) => (
                    <PickupChoice
                      key={choice.id}
                      group={product.slug + '-extra'}
                      name={choice.name}
                      price={'+' + formatPrice(choice.priceCents / 100)}
                      selected={choice.id === extra?.id}
                      onChange={() => setExtraId(choice.id)}
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}
            <button
              type="button"
              className="btn btn-red min-h-11 justify-self-start px-5 text-base disabled:opacity-50"
              disabled={disabled || atLimit}
              onClick={() =>
                onAdd({
                  optionId: option.id,
                  modifierIds: extra ? [extra.id] : [],
                  quantity: 1,
                })
              }
            >
              {atLimit ? 'Bag limit reached' : 'Add to bag · ' + formatPrice(total / 100)}
            </button>
          </>
        )}
      </div>
    </article>
  )
}

function isCombo(name: string) {
  return /\bcombo$/i.test(name)
}

function optionLabel(productName: string, name: string) {
  if (name === productName + ' Combo') return 'Combo'
  if (name === productName && /sandwich$/i.test(name)) return 'Sandwich'
  if (name === productName) return 'Regular'
  return name
}

function PickupChoice({
  group,
  name,
  price,
  selected,
  disabled,
  details,
  detailsId,
  onChange,
}: {
  group: string
  name: string
  price?: string
  selected: boolean
  disabled?: boolean
  details?: string
  detailsId?: string
  onChange: () => void
}) {
  return (
    <label className={'group inline-flex min-w-0 max-w-full' + (details ? ' w-36 sm:w-40' : '')}>
      <input
        type="radio"
        name={group}
        className="peer sr-only"
        checked={selected}
        disabled={disabled}
        aria-label={[name, price].filter(Boolean).join(' ')}
        aria-describedby={detailsId}
        onChange={onChange}
      />
      <span
        className={
          ui.chip +
          ' cursor-pointer flex-col items-start justify-center border border-line px-3.5 py-2 leading-snug peer-checked:border-red peer-checked:bg-red/15 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:cursor-default peer-disabled:opacity-50' +
          (details
            ? ' w-full group-hover:rounded-control group-hover:border-red group-focus-within:rounded-control peer-checked:rounded-control'
            : '')
        }
      >
        <span className="flex items-baseline gap-x-2.5">
          {name}
          {price && <span className="shrink-0 text-ink-muted tabular-nums">{price}</span>}
        </span>
        {details && (
          <span
            id={detailsId}
            className={
              'mt-1 max-w-44 font-body text-small font-normal normal-case tracking-normal text-ink-muted ' +
              (selected ? 'block' : 'hidden group-hover:block group-focus-within:block')
            }
          >
            {details}
          </span>
        )}
      </span>
    </label>
  )
}
