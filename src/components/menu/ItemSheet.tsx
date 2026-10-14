'use client'

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { track, type Placement } from '@/lib/analytics'
import type { MenuItemVM } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'

import { PlatformButtons } from '../order/PlatformButtons'
import { CloseIcon } from '../ui/icons'
import { Img } from '../ui/Img'

type Open = (item: MenuItemVM, placement: Placement) => void

const ItemSheetContext = createContext<Open | null>(null)

/** The opener, or null outside a provider (cards then fall back to the item page link). */
export const useItemSheet = () => useContext(ItemSheetContext)

/**
 * One shared bottom sheet for item details: tap a dish, see it big, order it.
 * Without JS (or outside the provider) the card links to /menu/<slug> instead.
 */
export function ItemSheetProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [state, setState] = useState<{ item: MenuItemVM; placement: Placement } | null>(null)
  const titleId = useId()

  const open = useCallback<Open>((item, placement) => {
    setState({ item, placement })
    // Open after React renders the new item.
    requestAnimationFrame(() => dialog.current?.showModal())
    track('order_sheet_open', { item: item.slug, placement })
  }, [])

  const item = state?.item

  return (
    <ItemSheetContext.Provider value={open}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="sheet fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-sheet bg-surface p-0 text-ink shadow-sheet md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-[30rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-sheet"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        {item ? (
          <div className="relative grid gap-5 px-gutter pt-3 pb-[calc(1.5rem+var(--safe-bottom))]">
            <span className="grabber md:hidden" aria-hidden />
            <form method="dialog" className="absolute top-3 right-3">
              <button
                type="submit"
                aria-label={copy.item.close}
                className="grid size-11 place-items-center rounded-full bg-surface-raised shadow-raised"
              >
                <CloseIcon className="size-5" />
              </button>
            </form>

            <div className="relative mx-auto mt-4 w-[min(17rem,72vw)]">
              <div className="absolute inset-[-8%] rounded-full bg-surface-sunken" aria-hidden />
              {item.image ? (
                <Img image={item.image} sizes="17rem" className="plate float relative w-full" />
              ) : null}
            </div>

            <div className="grid gap-2 text-center">
              <p className="label text-red">{item.category.name}</p>
              <h2 id={titleId} className="text-display-2">
                {item.name}
              </h2>
              {item.price !== null ? (
                <p className="justify-self-center rounded-full border-2 border-red px-4 py-1 font-bold text-red">
                  {formatPrice(item.price)}
                </p>
              ) : null}
              {item.tags.length ? (
                <ul className="flex flex-wrap justify-center gap-1.5">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="inline-flex items-center rounded-full bg-accent-tint px-3 py-1 text-[0.75rem] font-semibold text-[#b81d14]"
                    >
                      {copy.item.tags[tag]}
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.description ? <p className="text-ink-muted">{item.description}</p> : null}
            </div>

            {item.orderLinks.length ? (
              <div className="grid gap-3">
                <p className="label text-ink-muted">{copy.item.orderTitle}</p>
                <PlatformButtons links={item.orderLinks} item={item} placement={state.placement} />
              </div>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </ItemSheetContext.Provider>
  )
}
