import Link from 'next/link'

import { linkNotes, PlatformLink } from '@/components/order/PlatformLink'
import { PunchLine } from '@/components/ui/PunchLine'
import { ui } from '@/components/ui/classes'
import { trackOnClick } from '@/lib/analytics'
import type { ModeLink, OrderMode } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Smoke } from '@/theme/motifs'

const MODES: OrderMode[] = ['delivery', 'pickup']

type Props = { mode: OrderMode; links: ModeLink[] }

/**
 * A journey's own page, the blueprint's choice screen: a link that starts
 * delivery or pickup from Google, Instagram or a QR code. The apps open in
 * this mode where they allow it; the switch is two plain links.
 */
export function OrderView({ mode, links }: Props) {
  return (
    <div className="grain relative overflow-hidden">
      <Smoke />
      <div className={`${ui.container} grid gap-8 pt-12 pb-section md:pt-20`}>
        <header className="grid gap-4">
          <h1 className="text-display-1">
            <PunchLine text={copy.order.page[mode]} />
          </h1>
          <p className="max-w-[40ch] text-lg text-ink-muted">{copy.order.modes[mode].line}</p>
        </header>
        <div className="grid max-w-md gap-5">
          <nav
            aria-label={copy.order.modeLabel}
            className="grid grid-cols-2 gap-1 rounded-full bg-charcoal p-1"
          >
            {MODES.map((m) => (
              <Link
                key={m}
                href={`/order/${m}`}
                aria-current={m === mode ? 'page' : undefined}
                className="grid min-h-11 place-items-center rounded-full font-display text-[1.2rem] tracking-[0.04em] uppercase transition-colors duration-(--duration-fast) aria-[current=page]:bg-white aria-[current=page]:text-black"
              >
                {copy.order.modes[m].short}
              </Link>
            ))}
          </nav>
          <ul className="grid gap-3">
            {links.map((link) => (
              <li key={link.platform}>
                <PlatformLink
                  link={link}
                  notes={linkNotes(link, null)}
                  {...trackOnClick('order_click', {
                    item: 'store',
                    platform: link.platform,
                    level: link.level,
                    placement: 'order-page',
                    mode,
                  })}
                />
              </li>
            ))}
          </ul>
          <Link href="/menu" className="btn btn-ghost justify-self-start">
            {copy.order.menuFirst}
          </Link>
        </div>
      </div>
    </div>
  )
}
