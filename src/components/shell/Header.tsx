import Link from 'next/link'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Logo } from '@/theme/motifs'

import { OrderButton } from '../order/OrderButton'
import { ui } from '../ui/classes'
import { PinIcon } from '../ui/icons'
import { NavLinks } from './NavLinks'

export function Header({ site }: { site: SiteVM }) {
  const city = site.locations[0]?.city ?? site.locations[0]?.name
  return (
    <header className="sticky top-0 z-(--z-header) h-header bg-surface/90 backdrop-blur-md">
      <div className={`${ui.container} flex h-full items-center gap-3`}>
        <Link
          href="/"
          aria-label={`${site.name}, home`}
          className="inline-flex min-h-tap shrink-0 items-center"
        >
          <Logo name={site.name} image={site.logo} />
        </Link>
        <nav aria-label={copy.nav.label} className="ms-auto hidden md:block">
          <NavLinks />
        </nav>
        {city ? (
          <Link
            href="/location"
            className="ms-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface-raised px-4 text-small font-semibold shadow-[var(--shadow-raised)] md:hidden"
          >
            <PinIcon className="size-4 text-red" />
            {city}
          </Link>
        ) : null}
        <div className="hidden md:block">
          <OrderButton
            links={site.storeOrderLinks}
            placement="sticky"
            label={copy.order.stickyLabel}
            className="btn btn-red"
          />
        </div>
      </div>
    </header>
  )
}
