'use client'

import Link from 'next/link'
import { useRef, useState, type MouseEvent } from 'react'

import { track, type Placement } from '@/lib/analytics'
import type { ModeLink, OrderLink, OrderMode } from '@/lib/data/types'
import { linksForMode } from '@/lib/order'
import { copy } from '@/theme/copy'

import { ui } from '../ui/classes'
import { useStartPickup } from './bag/BagBar'
import { usePickupOnline } from './bag/BagProvider'
import { emberBurst } from './emberBurst'
import { OrderSheet } from './OrderSheet'

type Item = { slug: string; name: string }

type Props = {
  /** Already resolved through the fallback chain (item → store → hidden). */
  links: OrderLink[]
  /** The dish being ordered; null for store-level CTAs. */
  item?: Item | null
  placement: Placement
  /** The journey this control starts: "Order for Pickup" opens on pickup. */
  mode?: OrderMode
  label?: string
  /** For a short visible label ("Pickup") that needs its full meaning read out. */
  ariaLabel?: string
  className?: string
}

/**
 * The platform sheet and how to open it. A hook rather than part of the
 * button so OrderMenu can keep the sheet outside its folding panel: a modal
 * inside a hidden element doesn't show.
 */
export function useOrderSheet({
  links,
  item = null,
  placement,
}: {
  links: OrderLink[]
  item?: Item | null
  placement: Placement
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<OrderMode>('delivery')
  const itemKey = item?.slug ?? 'store'
  // A dish not sold online keeps its apps for pickup; the store-level sheet sends pickup here.
  const online = usePickupOnline() && !item

  const onChoose = (link: ModeLink) =>
    track('order_click', {
      item: itemKey,
      platform: link.platform,
      level: link.level,
      placement,
      mode: link.mode,
    })

  const open = (startMode: OrderMode, event: MouseEvent<HTMLElement>) => {
    // Each opening starts on this control's journey.
    setMode(startMode)
    dialog.current?.showModal()
    // The sheet itself takes focus: the browser would put it on the
    // first mode button, which then looks chosen when it isn't.
    dialog.current?.focus()
    // After showModal, so the sparks land above the sheet's backdrop.
    emberBurst(event.currentTarget, event.clientX, event.clientY)
    track('order_sheet_open', { item: itemKey, placement, mode: startMode })
  }

  const sheet = (
    <OrderSheet
      ref={dialog}
      links={linksForMode(links, mode, { online })}
      online={online}
      mode={mode}
      onModeChange={setMode}
      item={item}
      onChoose={onChoose}
    />
  )

  return { open, sheet, onChoose }
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
  mode,
  label,
  ariaLabel,
  className = ui.buttonPrimary,
}: Props) {
  const online = usePickupOnline() && !item
  const startMode = mode ?? (linksForMode(links, 'delivery').length ? 'delivery' : 'pickup')
  const modeLinks = linksForMode(links, startMode, { online })
  const canChoose = (mode ? modeLinks : links).length > 1
  const { open, sheet, onChoose } = useOrderSheet({ links, item, placement })
  const startPickup = useStartPickup()

  // Pickup on this site: the menu to start an order, or the bag if it has one.
  if (online && startMode === 'pickup') {
    return (
      <Link
        href={startPickup.href}
        className={className}
        aria-label={ariaLabel}
        onClick={(event) => {
          track('order_click', { item: 'store', platform: 'web', level: 'store', placement, mode: 'pickup' })
          startPickup.onClick?.(event)
        }}
      >
        {label ?? copy.order.pickupHere}
      </Link>
    )
  }

  const [link] = modeLinks
  if (!link) return null

  if (!canChoose) {
    const opensFullMenu = item && link.platform === 'clover'
    const directLabel = opensFullMenu
      ? copy.order.cloverFullMenu
      : (label ?? copy.order.on(link.label))
    const directAriaLabel = item
      ? opensFullMenu
        ? directLabel
        : copy.order.ctaForOn(item.name, link.label)
      : undefined
    return (
      <a
        href={link.href}
        className={className}
        aria-label={ariaLabel ?? directAriaLabel}
        onClick={(event) => {
          emberBurst(event.currentTarget, event.clientX, event.clientY)
          onChoose(link)
        }}
      >
        {directLabel}
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
        onClick={(event) => open(startMode, event)}
      >
        {label ?? copy.order.cta}
      </button>
      {sheet}
    </>
  )
}
