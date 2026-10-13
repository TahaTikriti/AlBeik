'use client'

import { useId, type Ref } from 'react'

import type { OrderLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { ui } from '../ui/classes'

type Props = {
  ref: Ref<HTMLDialogElement>
  links: OrderLink[]
  item: { slug: string; name: string } | null
  onChoose: (link: OrderLink) => void
}

/**
 * The "which app?" sheet. A native modal <dialog>: focus is trapped, Esc
 * closes it, and a tap on the backdrop closes it too. Links navigate in the
 * same tab so the platform's universal link can open its app.
 */
export function OrderSheet({ ref, links, item, onChoose }: Props) {
  const titleId = useId()

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-sheet bg-surface p-0 text-ink shadow-sheet"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className={`${ui.container} grid gap-stack pt-6 pb-[calc(1.5rem+var(--safe-bottom))]`}>
        <h2 id={titleId} className="text-display-3">
          {copy.order.sheetTitle}
        </h2>
        <p className="text-ink-muted">
          {item ? copy.order.sheetIntroFor(item.name) : copy.order.sheetIntro}
        </p>
        <ul className="grid gap-2">
          {links.map((link) => (
            <li key={link.platform}>
              <a
                href={link.href}
                className={`${ui.buttonPrimary} w-full flex-col py-2`}
                onClick={(event) => {
                  onChoose(link)
                  event.currentTarget.closest('dialog')?.close()
                }}
              >
                <span>{copy.order.on(link.label)}</span>
                {item && link.level === 'store' ? (
                  <span className="text-label font-normal">{copy.order.storeLevelNote}</span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
        <form method="dialog">
          <button type="submit" className={`${ui.buttonSecondary} w-full`}>
            {copy.order.close}
          </button>
        </form>
      </div>
    </dialog>
  )
}
