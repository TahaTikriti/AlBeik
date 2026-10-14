'use client'

import { track, type Placement } from '@/lib/analytics'
import type { OrderLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { ArrowIcon } from '../ui/icons'

type Props = {
  links: OrderLink[]
  item: { slug: string; name: string } | null
  placement: Placement
  /** Called after a choice. */
  onChoose?: () => void
}

/** One big row per delivery app. Same tab, so the app's universal link can take over. */
export function PlatformButtons({ links, item, placement, onChoose }: Props) {
  return (
    <ul className="grid gap-2.5">
      {links.map((link) => (
        <li key={link.platform}>
          <a
            href={link.href}
            aria-label={
              item && link.level === 'store'
                ? `${copy.order.on(link.label)}, ${copy.order.storeLevelNote}`
                : copy.order.on(link.label)
            }
            onClick={(event) => {
              // Close the sheet this lives in, so it isn't open on return.
              event.currentTarget.closest('dialog')?.close()
              track('order_click', {
                item: item?.slug ?? 'store',
                platform: link.platform,
                level: link.level,
                placement,
              })
              onChoose?.()
            }}
            className="group flex min-h-16 items-center gap-4 rounded-tile bg-surface-raised px-4 shadow-raised transition-transform duration-(--duration-fast) active:scale-[0.98]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-tint font-brand text-lg text-red">
              {link.label.charAt(0)}
            </span>
            <span className="grid flex-1">
              <span className="font-bold">{copy.order.on(link.label)}</span>
              {item && link.level === 'store' ? (
                <span className="text-small text-ink-muted">{copy.order.storeLevelNote}</span>
              ) : null}
            </span>
            <ArrowIcon className="size-5 text-red transition-transform duration-(--duration-base) group-hover:translate-x-1" />
          </a>
        </li>
      ))}
    </ul>
  )
}
