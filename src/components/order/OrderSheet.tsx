'use client'

import { useId, useRef, type PointerEvent, type Ref } from 'react'

import type { OrderLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

type Props = {
  ref: Ref<HTMLDialogElement>
  links: OrderLink[]
  item: { slug: string; name: string } | null
  onChoose: (link: OrderLink) => void
}

/** How far the sheet must be dragged down before letting go closes it. */
const DISMISS_PX = 80

/**
 * The "which app?" sheet: a native modal <dialog> that slides up from the
 * bottom. Focus is trapped; Esc, a tap on the backdrop, or dragging the red
 * band down closes it. Links open in the same tab so the platform's app can
 * take over.
 */
export function OrderSheet({ ref, links, item, onChoose }: Props) {
  const titleId = useId()
  const drag = useRef<{ startY: number; dy: number } | null>(null)

  const onDragStart = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { startY: event.clientY, dy: 0 }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onDragMove = (event: PointerEvent<HTMLDivElement>) => {
    const sheet = event.currentTarget.closest('dialog')
    if (!drag.current || !sheet) return
    drag.current.dy = Math.max(0, event.clientY - drag.current.startY)
    sheet.dataset.dragging = ''
    sheet.style.translate = `0 ${drag.current.dy}px`
  }
  const onDragEnd = (event: PointerEvent<HTMLDivElement>) => {
    const sheet = event.currentTarget.closest('dialog')
    const dy = drag.current?.dy ?? 0
    drag.current = null
    if (!sheet) return
    delete sheet.dataset.dragging
    sheet.style.translate = ''
    if (dy > DISMISS_PX) sheet.close()
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="sheet fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none overflow-hidden rounded-t-sheet bg-coal p-0 text-white shadow-sheet md:inset-x-auto md:right-6 md:bottom-6 md:left-auto md:w-[26rem] md:rounded-sheet"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className="grain relative">
        <div
          className="relative flex touch-none items-center justify-between bg-red px-gutter pt-5 pb-3 select-none md:pt-3"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <span
            aria-hidden
            className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/60 md:hidden"
          />
          <Mustache className="h-4 w-auto text-white" />
          <span className="label text-white">100% halal</span>
        </div>
        <div className="grid gap-5 px-gutter pt-6 pb-[calc(1.5rem+var(--safe-bottom))]">
          <div className="grid gap-2">
            <h2 id={titleId} className="text-display-2">
              {copy.order.sheetTitle}
            </h2>
            <p className="text-ink-muted">
              {item ? copy.order.sheetIntroFor(item.name) : copy.order.sheetIntro}
            </p>
          </div>
          <ul className="grid gap-3">
            {links.map((link) => (
              <li key={link.platform}>
                <a
                  href={link.href}
                  aria-label={
                    item && link.level === 'store'
                      ? `${copy.order.on(link.label)}, ${copy.order.storeLevelNote}`
                      : copy.order.on(link.label)
                  }
                  className="group flex min-h-[4.25rem] items-center justify-between rounded-control bg-white px-5 text-black transition-transform duration-(--duration-fast) active:scale-[0.98]"
                  onClick={(event) => {
                    onChoose(link)
                    event.currentTarget.closest('dialog')?.close()
                  }}
                >
                  <span className="grid">
                    <span className="font-display text-[1.6rem] leading-none uppercase">
                      {link.label}
                    </span>
                    {item && link.level === 'store' ? (
                      <span className="text-[0.8rem] text-[#5e554d]">
                        {copy.order.storeLevelNote}
                      </span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden
                    className="grid size-10 place-items-center rounded-full bg-red text-white transition-transform duration-(--duration-base) group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <form method="dialog">
            <button type="submit" className="btn btn-ghost w-full text-white">
              {copy.order.close}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  )
}
