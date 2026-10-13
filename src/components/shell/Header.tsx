import Link from 'next/link'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Logo } from '@/theme/motifs'

import { ui } from '../ui/classes'
import { NavLinks } from './NavLinks'

export function Header({ site }: { site: SiteVM }) {
  return (
    <header className="sticky top-0 z-(--z-header) h-header border-b border-line bg-surface">
      <div className={`${ui.container} flex h-full items-center gap-4`}>
        <Link
          href="/"
          className="inline-flex min-h-tap shrink-0 items-center font-display text-display-3"
        >
          <Logo name={site.name} image={site.logo} />
        </Link>
        <nav
          aria-label={copy.nav.label}
          className="ms-auto min-w-0 overflow-x-auto [scrollbar-width:none]"
        >
          <NavLinks />
        </nav>
      </div>
    </header>
  )
}
