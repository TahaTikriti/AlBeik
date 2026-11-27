'use client'

import Link from 'next/link'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import type { CardModifierGroup, CardProduct } from '@/lib/pickup-card/types'
import { MAX_ITEM_QUANTITY } from '@/lib/pickup-card/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { ui } from '../../ui/classes'
import { useBag } from './BagProvider'
import { Stepper } from './Stepper'

const money = (cents: number) => formatPrice(cents / 100)

type Props = {
  item: { slug: string; name: string }
  /** `true` when something went into the bag. */
  onClose: (added: boolean) => void
}

type Load = { kind: 'loading' } | { kind: 'ready'; product: CardProduct } | { kind: 'error'; message: string }

/**
 * The Add sheet: the dish's options (Sandwich / Combo), each Clover modifier
 * group (a required side, optional extras) and a quantity, with the live
 * Clover price. "Add" stays off until every required choice is made.
 */
export default function AddSheet({ item, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const added = useRef(false)
  const titleId = useId()
  const { dispatch, contact } = useBag()
  const [load, setLoad] = useState<Load>({ kind: 'loading' })
  const [optionId, setOptionId] = useState('')
  const [picks, setPicks] = useState<Record<string, string[]>>({})
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    dialog.current?.showModal()
    const controller = new AbortController()
    fetch('/order/pickup/options?slug=' + encodeURIComponent(item.slug), {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error)
        const product = body as CardProduct
        setLoad({ kind: 'ready', product })
        setOptionId((product.options.find((o) => o.available) ?? product.options[0])?.id ?? '')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoad({ kind: 'error', message: error instanceof Error && error.message ? error.message : copy.bag.busy })
      })
    return () => controller.abort()
  }, [item.slug])

  const product = load.kind === 'ready' ? load.product : null
  const option = product?.options.find((o) => o.id === optionId) ?? null
  const chosen = useMemo(
    () => (option ? option.groups.flatMap((g) => (picks[g.id] ?? []).flatMap((id) => g.modifiers.filter((m) => m.id === id))) : []),
    [option, picks],
  )
  const missing = option?.groups.find((g) => (picks[g.id]?.length ?? 0) < g.min) ?? null
  const unitCents = (option?.priceCents ?? 0) + chosen.reduce((sum, m) => sum + m.priceCents, 0)
  const maxQuantity = Math.min(MAX_ITEM_QUANTITY, option?.stockLimit ?? MAX_ITEM_QUANTITY)

  function toggle(group: CardModifierGroup, id: string) {
    setPicks((current) => {
      const list = current[group.id] ?? []
      if (group.max === 1) return { ...current, [group.id]: list[0] === id && group.min === 0 ? [] : [id] }
      if (list.includes(id)) return { ...current, [group.id]: list.filter((x) => x !== id) }
      if (group.max !== null && list.length >= group.max) return current
      return { ...current, [group.id]: [...list, id] }
    })
  }

  function add() {
    if (!product || !option || missing) return
    dispatch({
      type: 'add',
      line: {
        optionId: option.id,
        modifierIds: chosen.map((m) => m.id),
        modifierNames: chosen.map((m) => m.name),
        quantity,
        slug: product.slug,
        name: product.name,
        label: option.label,
        unitCents,
      },
    })
    added.current = true
    dialog.current?.close()
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="sheet fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-sheet bg-charcoal p-0 text-white shadow-sheet outline-none md:inset-x-auto md:right-6 md:bottom-6 md:left-auto md:w-[28rem] md:rounded-sheet"
      onClose={() => onClose(added.current)}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className="grain relative">
        <div className="flex items-center justify-center bg-red px-gutter pt-4 pb-3">
          <Mustache className="h-4 w-auto text-white" />
        </div>
        <div className="grid gap-5 px-gutter pt-6 pb-[calc(1.5rem+var(--safe-bottom))]">
          <h2 id={titleId} className="text-display-2 normal-case">
            {item.name}
          </h2>

          {load.kind === 'loading' ? (
            <p role="status" className="text-ink-muted">
              {copy.bag.loading}
            </p>
          ) : null}

          {load.kind === 'error' ? (
            <div role="alert" className="grid gap-3">
              <p>{load.message}</p>
              <p className="text-ink-muted">{copy.bag.busyHelp}</p>
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
            </div>
          ) : null}

          {product && option ? (
            <>
              {product.options.length > 1 ? (
                <fieldset className="grid gap-2">
                  <legend className="mb-2 label text-[0.7rem] text-ink-muted">{copy.bag.pickOne}</legend>
                  <div className="flex flex-wrap gap-2">
                    {product.options.map((o) => (
                      <Choice
                        key={o.id}
                        type="radio"
                        name={titleId + '-option'}
                        label={o.label}
                        price={o.available ? money(o.priceCents) : copy.bag.soldOut}
                        checked={o.id === optionId}
                        disabled={!o.available}
                        onChange={() => {
                          setOptionId(o.id)
                          setPicks({})
                        }}
                      />
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {option.groups.map((group) => {
                const list = picks[group.id] ?? []
                const full = group.max !== null && group.max > 1 && list.length >= group.max
                return (
                  <fieldset key={group.id} className="grid gap-2">
                    <legend className="mb-2 flex w-full items-baseline justify-between gap-3">
                      <span className="font-display text-[1.2rem] uppercase tracking-[0.03em]">{group.name}</span>
                      <span className={`label text-[0.65rem] ${group.min > 0 ? 'text-red-text' : 'text-ink-muted'}`}>
                        {group.min > 0 ? copy.bag.required : copy.bag.optional(group.max)}
                      </span>
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {group.modifiers.map((m) => (
                        <Choice
                          key={m.id}
                          type={group.max === 1 ? 'radio' : 'checkbox'}
                          name={titleId + '-' + group.id}
                          label={m.name}
                          price={m.priceCents ? '+' + money(m.priceCents) : undefined}
                          checked={list.includes(m.id)}
                          disabled={full && !list.includes(m.id)}
                          onChange={() => toggle(group, m.id)}
                        />
                      ))}
                    </div>
                  </fieldset>
                )
              })}

              <div className="flex items-center justify-between gap-4">
                <span className="label text-[0.7rem] text-ink-muted">{copy.bag.quantity}</span>
                <Stepper value={quantity} max={maxQuantity} onChange={setQuantity} />
              </div>

              <button
                type="button"
                className="btn btn-red min-h-12 w-full disabled:opacity-50"
                disabled={!option.available || Boolean(missing)}
                onClick={add}
              >
                {missing
                  ? `Choose ${missing.name.toLowerCase()}`
                  : copy.bag.addPrice(money(unitCents * quantity))}
              </button>
            </>
          ) : null}

          <form method="dialog">
            <button type="submit" className="btn btn-ghost w-full text-white hover:text-black focus-visible:text-black">
              {copy.order.close}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  )
}

function Choice({
  type,
  name,
  label,
  price,
  checked,
  disabled,
  onChange,
}: {
  type: 'radio' | 'checkbox'
  name: string
  label: string
  price?: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <label className="inline-flex min-w-0 max-w-full">
      <input
        type={type}
        name={name}
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        onClick={type === 'radio' && checked ? onChange : undefined}
      />
      <span
        className={`${ui.chip} cursor-pointer gap-2.5 border border-line px-4 peer-checked:border-red peer-checked:bg-red/15 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:cursor-default peer-disabled:opacity-50`}
      >
        {label}
        {price ? <span className="text-ink-muted tabular-nums">{price}</span> : null}
      </span>
    </label>
  )
}
