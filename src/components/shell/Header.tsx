import Link from 'next/link'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Logo } from '@/theme/motifs'

import { OrderButton } from '../order/OrderButton'
import { ui } from '../ui/classes'
import { NavLinks } from './NavLinks'

/** White, so the original logo sits on white as in the brand guidelines. */
export function Header({ site }: { site: SiteVM }) {
  return (
    <header
      data-theme="light"
      className="sticky top-0 z-(--z-header) h-header border-b border-line"
      // Holds still above the page during page changes (brand.css).
      style={{ viewTransitionName: 'site-header' }}
    >
      <div className={`${ui.container} flex h-full items-center gap-3`}>
        <Link
          href="/"
          aria-label={`${site.name}, home`}
          className="group inline-flex min-h-tap min-w-11 shrink-0 items-center"
        >
          <Logo />
        </Link>
        <nav aria-label={copy.nav.label} className="ms-auto">
          <NavLinks />
        </nav>
        {/* Both journeys, side by side (phones have them in the bottom bar). */}
        <div className="hidden items-center gap-2 md:flex">
          <OrderButton
            links={site.storeOrderLinks}
            placement="header"
            mode="delivery"
            label={copy.order.modes.delivery.short}
            ariaLabel={copy.order.modes.delivery.cta}
            className="btn btn-red min-h-11 px-4 text-[1.1rem] shadow-none"
          />
          <OrderButton
            links={site.storeOrderLinks}
            placement="header"
            mode="pickup"
            label={copy.order.modes.pickup.short}
            ariaLabel={copy.order.modes.pickup.cta}
            className="btn btn-charcoal min-h-11 px-4 text-[1.1rem] shadow-none"
          />
        </div>
      </div>
      {/* A fuse burning along the header's edge as the page scrolls (brand.css). */}
      <span className="fuse" aria-hidden />
    </header>
  )
}
