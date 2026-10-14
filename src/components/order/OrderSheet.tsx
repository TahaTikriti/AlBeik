'use client'

import { useId, type Ref } from 'react'

import type { Placement } from '@/lib/analytics'
import type { OrderLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { PlatformButtons } from './PlatformButtons'

type Props = {
  ref: Ref<HTMLDialogElement>
  links: OrderLink[]
  item: { slug: string; name: string } | null
  placement: Placement
}

/** Bottom sheet to pick a delivery app (native modal <dialog>: focus trap, Esc, tap outside). */
export function OrderSheet({ ref, links, item, placement }: Props) {
  const titleId = useId()
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="sheet fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-sheet bg-surface p-0 text-ink shadow-sheet md:inset-x-auto md:right-6 md:bottom-6 md:left-auto md:w-[25rem] md:rounded-sheet"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className="grid gap-5 px-gutter pt-3 pb-[calc(1.25rem+var(--safe-bottom))]">
        <span className="grabber md:hidden" aria-hidden />
        <div className="grid gap-1">
          <h2 id={titleId} className="text-display-2">
            {copy.order.sheetTitle}
          </h2>
          <p className="text-ink-muted">
            {item ? copy.order.sheetIntroFor(item.name) : copy.order.sheetIntro}
          </p>
        </div>
        <PlatformButtons links={links} item={item} placement={placement} />
        <form method="dialog">
          <button type="submit" className="btn w-full text-ink-muted">
            {copy.order.close}
          </button>
        </form>
      </div>
    </dialog>
  )
}
