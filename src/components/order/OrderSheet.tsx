'use client'

import { useId, useRef, type PointerEvent, type Ref } from 'react'

import type { ModeLink, OrderMode } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { linkNotes, PlatformLink } from './PlatformLink'

type Props = {
  ref: Ref<HTMLDialogElement>
  /** Already set to `mode` (see linkForMode). */
  links: ModeLink[]
  mode: OrderMode
  onModeChange: (mode: OrderMode) => void
  item: { slug: string; name: string } | null
  onChoose: (link: ModeLink) => void
}

const MODES: OrderMode[] = ['delivery', 'pickup']

/** How far the sheet must be dragged down before letting go closes it. */
const DISMISS_PX = 80

/**
 * The "which app?" sheet: a native modal <dialog> that slides up from the
 * bottom, with a delivery / pickup switch above the apps. Focus is trapped;
 * Esc, a tap on the backdrop, or dragging the red band down closes it. Links
 * open in the same tab so the platform's app can take over.
 */
export function OrderSheet({ ref, links, mode, onModeChange, item, onChoose }: Props) {
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
      tabIndex={-1}
      className="sheet fixed outline-none inset-x-0 top-auto bottom-0 m-0 w-full max-w-none overflow-hidden rounded-t-sheet bg-charcoal p-0 text-white shadow-sheet md:inset-x-auto md:right-6 md:bottom-6 md:left-auto md:w-[26rem] md:rounded-sheet"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className="grain relative">
        <div
          className="relative flex touch-none items-center justify-center bg-red px-gutter pt-5 pb-3 select-none md:pt-3"
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
          <div className="grid gap-2">
            <div
              role="group"
              aria-label={copy.order.modeLabel}
              className="grid grid-cols-2 gap-1 rounded-full bg-black p-1"
            >
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={m === mode}
                  onClick={() => onModeChange(m)}
                  className="min-h-11 rounded-full font-display text-[1.2rem] tracking-[0.04em] uppercase transition-colors duration-(--duration-fast) aria-pressed:bg-white aria-pressed:text-black"
                >
                  {copy.order.modes[m].short}
                </button>
              ))}
            </div>
            <p aria-live="polite" className="text-small text-ink-muted">
              {copy.order.modes[mode].line}
            </p>
          </div>
          <ul className="grid gap-3">
            {links.map((link) => (
              <li key={link.platform}>
                <PlatformLink
                  link={link}
                  notes={linkNotes(link, item)}
                  onClick={(event) => {
                    onChoose(link)
                    event.currentTarget.closest('dialog')?.close()
                  }}
                />
              </li>
            ))}
          </ul>
          <form method="dialog">
            <button
              type="submit"
              className="btn btn-ghost w-full text-white hover:text-black focus-visible:text-black"
            >
              {copy.order.close}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  )
}
