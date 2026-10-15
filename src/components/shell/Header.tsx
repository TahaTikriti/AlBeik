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
        <div className="hidden md:block">
          <OrderButton
            links={site.storeOrderLinks}
            placement="sticky"
            label={copy.order.stickyLabel}
            className="btn btn-red min-h-11 text-[1.1rem] shadow-none"
          />
        </div>
      </div>
    </header>
  )
}
