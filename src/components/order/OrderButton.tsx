'use client'

import { useRef, useState } from 'react'

import { track, type Placement } from '@/lib/analytics'
import type { ModeLink, OrderLink, OrderMode } from '@/lib/data/types'
import { linkForMode, toOrderAction } from '@/lib/order'
import { copy } from '@/theme/copy'

import { ui } from '../ui/classes'
import { emberBurst } from './emberBurst'
import { OrderSheet } from './OrderSheet'

type Props = {
  /** Already resolved through the fallback chain (item → store → hidden). */
  links: OrderLink[]
  /** The dish being ordered; null for store-level CTAs. */
  item?: { slug: string; name: string } | null
  placement: Placement
  /** The journey this control starts: "Order for Pickup" opens on pickup. */
  mode?: OrderMode
  label?: string
  /** For a short visible label ("Pickup") that needs its full meaning read out. */
  ariaLabel?: string
  className?: string
}

/**
 * The order control. No links → renders nothing. One platform → a direct
 * link (one tap). Several → a button that opens the platform sheet, on the
 * control's mode; the sheet can switch between delivery and pickup.
 */
export function OrderButton({
  links,
  item = null,
  placement,
  mode: startMode = 'delivery',
  label,
  ariaLabel,
  className = ui.buttonPrimary,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState(startMode)
  const action = toOrderAction(links)
  const itemKey = item?.slug ?? 'store'

  const onChoose = (link: ModeLink) =>
    track('order_click', {
      item: itemKey,
      platform: link.platform,
      level: link.level,
      placement,
      mode: link.mode,
    })

  if (action.kind === 'none') return null

  if (action.kind === 'direct') {
    const link = linkForMode(action.link, startMode)
    return (
      <a
        href={link.href}
        className={className}
        aria-label={ariaLabel ?? (item ? copy.order.ctaForOn(item.name, link.label) : undefined)}
        onClick={(event) => {
          emberBurst(event.currentTarget, event.clientX, event.clientY)
          onChoose(link)
        }}
      >
        {label ?? copy.order.on(link.label)}
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-label={ariaLabel ?? (item ? copy.order.ctaFor(item.name) : undefined)}
        onClick={(event) => {
          // Each opening starts on this control's journey.
          setMode(startMode)
          dialog.current?.showModal()
          // The sheet itself takes focus: the browser would put it on the
          // first mode button, which then looks chosen when it isn't.
          dialog.current?.focus()
          // After showModal, so the sparks land above the sheet's backdrop.
          emberBurst(event.currentTarget, event.clientX, event.clientY)
          track('order_sheet_open', { item: itemKey, placement, mode: startMode })
        }}
      >
        {label ?? copy.order.cta}
      </button>
      <OrderSheet
        ref={dialog}
        links={action.links.map((link) => linkForMode(link, mode))}
        mode={mode}
        onModeChange={setMode}
        item={item}
        onChoose={onChoose}
      />
    </>
  )
}
