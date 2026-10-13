'use client'

import { useRef } from 'react'

import { track, type Placement } from '@/lib/analytics'
import type { OrderLink } from '@/lib/data/types'
import { toOrderAction } from '@/lib/order'
import { copy } from '@/theme/copy'

import { ui } from '../ui/classes'
import { OrderSheet } from './OrderSheet'

type Props = {
  /** Already resolved through the fallback chain (item → store → hidden). */
  links: OrderLink[]
  /** The dish being ordered; null for store-level CTAs. */
  item?: { slug: string; name: string } | null
  placement: Placement
  label?: string
  className?: string
}

/**
 * The order control. No links → renders nothing. One platform → a direct
 * link (one tap). Several → a button that opens the platform sheet.
 */
export function OrderButton({
  links,
  item = null,
  placement,
  label,
  className = ui.buttonPrimary,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const action = toOrderAction(links)
  const itemKey = item?.slug ?? 'store'

  const onChoose = (link: OrderLink) =>
    track('order_click', { item: itemKey, platform: link.platform, level: link.level, placement })

  if (action.kind === 'none') return null

  if (action.kind === 'direct') {
    const { link } = action
    return (
      <a
        href={link.href}
        className={className}
        aria-label={item ? copy.order.ctaForOn(item.name, link.label) : undefined}
        onClick={() => onChoose(link)}
      >
        {copy.order.on(link.label)}
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-label={item ? copy.order.ctaFor(item.name) : undefined}
        onClick={() => {
          dialog.current?.showModal()
          track('order_sheet_open', { item: itemKey, placement })
        }}
      >
        {label ?? copy.order.cta}
      </button>
      <OrderSheet ref={dialog} links={action.links} item={item} onChoose={onChoose} />
    </>
  )
}
