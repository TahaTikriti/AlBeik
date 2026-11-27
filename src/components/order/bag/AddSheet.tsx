'use client'

import Link from 'next/link'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'

import type { ImageVM } from '@/lib/data/types'
import type { CardModifierGroup, CardOption } from '@/lib/pickup-card/types'
import { MAX_ITEM_QUANTITY } from '@/lib/pickup-card/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { Img } from '../../ui/Img'
import { useBag } from './BagProvider'
import { chosenModifiers, firstMissing, type Picks, startingPicks, togglePick, unitPrice } from './choices'
import { loadProducts, useProducts } from './products'
import { Stepper } from './Stepper'

const money = (cents: number) => formatPrice(cents / 100)

export type AddItem = {
  slug: string
  name: string
  image?: ImageVM | null
  description?: string | null
}

type Props = {
  item: AddItem
  /** `true` when something went into the bag. */
  onClose: (added: boolean) => void
}

/**
 * The Add sheet: photo, the dish's options (Sandwich / Combo) as a list with
 * prices, each Clover modifier group (a required side, optional extras) and
 * one "Add to bag · $17.24" button with the quantity beside it. Prices are
 * already loaded (see products.ts), so it opens complete. Tapping Add with a
 * required choice missing scrolls to it instead of doing nothing.
 */
export default function AddSheet({ item, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const added = useRef(false)
  const titleId = useId()
  const { dispatch, contact } = useBag()
  const { status, products } = useProducts()
  const product = products.get(item.slug) ?? null
  const [optionId, setOptionId] = useState<string | null>(null)
  const [picks, setPicks] = useState<Picks | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [flagged, setFlagged] = useState<string | null>(null)
  const groupRefs = useRef(new Map<string, HTMLFieldSetElement>())

  useEffect(() => {
    dialog.current?.showModal()
    void loadProducts()
  }, [])

  const option: CardOption | null =
    product?.options.find((o) => o.id === optionId) ??
    product?.options.find((o) => o.available) ??
    product?.options[0] ??
    null
  const currentPicks = picks ?? (option ? startingPicks(option) : {})
  const missing = option ? firstMissing(option, currentPicks) : null
  const unitCents = option ? unitPrice(option, currentPicks) : 0
  const maxQuantity = Math.min(MAX_ITEM_QUANTITY, option?.stockLimit ?? MAX_ITEM_QUANTITY)
  const image = product?.image ?? item.image ?? null
  const description = product?.description ?? item.description ?? null

  function chooseOption(next: CardOption) {
    setOptionId(next.id)
    setPicks(startingPicks(next))
    setFlagged(null)
  }

  function toggle(group: CardModifierGroup, id: string) {
    setPicks(togglePick(currentPicks, group, id))
    if (flagged === group.id) setFlagged(null)
  }

  function add() {
    if (!product || !option?.available) return
    if (missing) {
      setFlagged(missing.id)
      groupRefs.current.get(missing.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const chosen = chosenModifiers(option, currentPicks)
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

  const close = () => dialog.current?.close()

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="sheet fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none flex-col overflow-hidden rounded-t-sheet bg-charcoal p-0 text-white shadow-sheet outline-none open:flex md:inset-0 md:m-auto md:h-fit md:max-h-[88dvh] md:w-[30rem] md:rounded-sheet"
      onClose={() => onClose(added.current)}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <button
        type="button"
        onClick={close}
        aria-label={copy.order.close}
        className="absolute end-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-black/70 text-white shadow-raised hover:bg-black"
      >
        <svg aria-hidden viewBox="0 0 14 14" className="size-3.5">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {image ? (
          <Img
            image={image}
            sizes="(min-width: 768px) 30rem, 100vw"
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="grid h-16 place-items-center bg-red">
            <Mustache className="h-4 w-auto text-white" />
          </div>
        )}

        <div className="grid gap-6 px-gutter pt-5 pb-6">
          <div className="grid gap-1.5 pe-8">
            <h2 id={titleId} className="text-[1.75rem] leading-[1.05] normal-case">
              {item.name}
            </h2>
            {description ? <p className="text-small text-ink-muted">{description}</p> : null}
          </div>

          {product && option ? (
            <>
              {product.options.length > 1 ? (
                <Group title={copy.bag.pickOne} badge={copy.bag.required} done>
                  {product.options.map((o) => (
                    <Row
                      key={o.id}
                      type="radio"
                      name={titleId + '-option'}
                      label={o.label}
                      price={o.available ? money(o.priceCents) : copy.bag.soldOut}
                      checked={o.id === option.id}
                      disabled={!o.available}
                      onChange={() => chooseOption(o)}
                    />
                  ))}
                </Group>
              ) : null}

              {option.groups.map((group) => {
                const list = currentPicks[group.id] ?? []
                const full = group.max !== null && group.max > 1 && list.length >= group.max
                const required = group.min > 0
                return (
                  <Group
                    key={option.id + group.id}
                    ref={(el) => {
                      if (el) groupRefs.current.set(group.id, el)
                      else groupRefs.current.delete(group.id)
                    }}
                    title={group.name}
                    badge={required ? copy.bag.required : copy.bag.optional(group.max)}
                    required={required}
                    done={list.length >= group.min}
                    flagged={flagged === group.id}
                  >
                    {group.modifiers.map((m) => (
                      <Row
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
                  </Group>
                )
              })}
            </>
          ) : status === 'ready' ? (
            <Problem message={copy.bag.notOnline} phoneHref={contact.phoneHref} />
          ) : status === 'error' ? (
            <Problem message={copy.bag.busy} phoneHref={contact.phoneHref} retry={() => void loadProducts()} />
          ) : (
            <div aria-busy className="grid gap-2" role="status" aria-label={copy.bag.loading}>
              <span className="h-14 animate-pulse rounded-control bg-white/8" />
              <span className="h-14 animate-pulse rounded-control bg-white/8" />
            </div>
          )}
        </div>
      </div>

      {product && option ? (
        <div className="grid gap-2 border-t border-white/10 bg-charcoal px-gutter pt-3 pb-[calc(0.75rem+var(--safe-bottom))]">
          {flagged && missing ? (
            <p role="alert" className="text-small font-semibold text-red-text">
              {copy.bag.choose(missing.name)}
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <Stepper value={quantity} max={maxQuantity} onChange={setQuantity} />
            <button
              type="button"
              className="btn btn-red min-h-12 flex-1 px-4 disabled:opacity-50"
              disabled={!option.available}
              onClick={add}
            >
              {option.available ? copy.bag.addPrice(money(unitCents * quantity)) : copy.bag.soldOut}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}

function Group({
  ref,
  title,
  badge,
  required = true,
  done = false,
  flagged = false,
  children,
}: {
  ref?: (el: HTMLFieldSetElement | null) => void
  title: string
  badge: string
  required?: boolean
  done?: boolean
  flagged?: boolean
  children: ReactNode
}) {
  return (
    <fieldset ref={ref} className="grid scroll-mt-4 gap-2">
      <legend className="mb-2 flex w-full items-center justify-between gap-3">
        <span className="font-display text-[1.2rem] uppercase tracking-[0.03em]">{title}</span>
        <span
          className={`label rounded-full px-2.5 py-1 text-[0.62rem] transition-colors ${
            flagged
              ? 'bg-red text-white'
              : required && !done
                ? 'bg-white text-black'
                : 'bg-white/10 text-ink-muted'
          }`}
        >
          {required && done ? '✓ ' + badge : badge}
        </span>
      </legend>
      <div className={`grid gap-2 rounded-control ${flagged ? 'outline-2 outline-offset-4 outline-red' : ''}`}>
        {children}
      </div>
    </fieldset>
  )
}

function Row({
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
    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-control border border-white/15 px-4 transition-colors has-checked:border-red has-checked:bg-red/12 has-disabled:cursor-default has-disabled:opacity-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-red-text">
      <input
        type={type}
        name={name}
        className={`size-5 shrink-0 accent-red outline-none ${type === 'checkbox' ? 'rounded-sm' : ''}`}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="min-w-0 flex-1 font-semibold">{label}</span>
      {price ? <span className="shrink-0 text-ink-muted tabular-nums">{price}</span> : null}
    </label>
  )
}

function Problem({
  message,
  phoneHref,
  retry,
}: {
  message: string
  phoneHref: string | null
  retry?: () => void
}) {
  return (
    <div role="alert" className="grid gap-3">
      <p>{message}</p>
      <div className="flex flex-wrap gap-2">
        {retry ? (
          <button type="button" className="btn btn-red min-h-11 px-5" onClick={retry}>
            {copy.checkout.retryQuote}
          </button>
        ) : null}
        {phoneHref ? (
          <a href={phoneHref} className={`btn min-h-11 px-5 ${retry ? 'btn-ghost text-white hover:text-black focus-visible:text-black' : 'btn-red'}`}>
            {copy.bag.call}
          </a>
        ) : null}
        <Link href="/order/delivery" className="btn btn-ghost min-h-11 px-5 text-white hover:text-black focus-visible:text-black">
          {copy.bag.apps}
        </Link>
      </div>
    </div>
  )
}
