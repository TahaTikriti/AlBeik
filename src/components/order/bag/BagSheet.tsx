'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef } from 'react'

import { MAX_ITEM_QUANTITY } from '@/lib/pickup-card/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { useBag } from './BagProvider'
import { checkoutPath } from './checkoutClient'
import { Stepper } from './Stepper'

const money = (cents: number) => formatPrice(cents / 100)

/**
 * The bag, over whatever page you're on: what's in it, quantities, the
 * subtotal, and one button to the checkout. "Add more" just closes it on the
 * menu, so browsing never loses your place.
 */
export default function BagSheet({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const pathname = usePathname()
  const { lines, count, subtotalCents, dispatch, prepMinutes } = useBag()

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const close = () => dialog.current?.close()
  const onMenu = pathname === '/menu' || pathname.startsWith('/menu/')

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="sheet drawer fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88dvh] w-full max-w-none flex-col overflow-hidden rounded-t-sheet bg-charcoal p-0 text-white shadow-sheet outline-none open:flex md:inset-y-0 md:start-auto md:end-0 md:h-dvh md:max-h-none md:w-[26rem] md:rounded-none md:rounded-s-sheet"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-gutter pt-5 pb-4">
        <div className="grid gap-0.5">
          <h2 id={titleId} className="font-display text-[1.6rem] leading-none uppercase tracking-[0.03em]">
            {copy.bag.drawerTitle}
          </h2>
          <p className="text-small text-ink-muted">{copy.bag.drawerLine(prepMinutes)}</p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={copy.order.close}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-black/60 hover:bg-black"
        >
          <svg aria-hidden viewBox="0 0 14 14" className="size-3.5">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {lines.length ? (
        <>
          <ul className="min-h-0 flex-1 divide-y divide-white/10 overflow-y-auto overscroll-contain px-gutter">
            {lines.map((line, index) => {
              const parts = [line.label !== 'Regular' ? line.label : '', ...line.modifierNames].filter(Boolean)
              return (
                <li key={line.optionId + line.modifierIds.join()} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{line.name}</p>
                    {parts.length ? (
                      <p className="text-small text-ink-muted">{copy.checkout.lineOptions(parts)}</p>
                    ) : null}
                  </div>
                  <span className="tabular-nums">{money(line.unitCents * line.quantity)}</span>
                  <div className="col-span-2">
                    <Stepper
                      size="sm"
                      value={line.quantity}
                      min={0}
                      max={MAX_ITEM_QUANTITY}
                      removeLabel={copy.bag.remove(line.name)}
                      onChange={(quantity) => dispatch({ type: 'quantity', index, quantity })}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
          <footer className="grid gap-3 border-t border-white/10 px-gutter pt-4 pb-[calc(1rem+var(--safe-bottom))]">
            <div className="flex items-baseline justify-between">
              <span className="text-small text-ink-muted">{copy.bag.subtotalLine(count)}</span>
              <span className="font-display text-2xl tabular-nums">{money(subtotalCents)}</span>
            </div>
            <Link href={checkoutPath} onClick={close} className="btn btn-red min-h-14 w-full text-lg">
              {copy.bag.checkout}
            </Link>
            {onMenu ? (
              <button type="button" onClick={close} className="min-h-11 w-full text-small font-semibold text-ink-muted underline underline-offset-4 hover:text-white">
                {copy.bag.addMore}
              </button>
            ) : (
              <Link href="/menu" onClick={close} className="min-h-11 w-full text-small font-semibold text-ink-muted underline underline-offset-4 hover:text-white">
                {copy.bag.addMore}
              </Link>
            )}
          </footer>
        </>
      ) : (
        <div className="grid justify-items-center gap-4 px-gutter py-12 text-center">
          <Mustache className="h-6 w-auto text-red" />
          <p className="text-lg">{copy.bag.empty}</p>
          {onMenu ? (
            <button type="button" onClick={close} className="btn btn-red min-h-12 px-6">
              {copy.bag.emptyCta}
            </button>
          ) : (
            <Link href="/menu" onClick={close} className="btn btn-red min-h-12 px-6">
              {copy.bag.emptyCta}
            </Link>
          )}
        </div>
      )}
    </dialog>
  )
}
