'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { copy } from '@/theme/copy'

const LINKS = [
  { href: '/menu', label: copy.nav.menu },
  { href: '/about', label: copy.nav.about },
  { href: '/location', label: copy.nav.location },
] as const

export function NavLinks() {
  const pathname = usePathname()
  return (
    <ul className="flex items-center gap-1 sm:gap-3">
      {LINKS.map(({ href, label }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={pathname.startsWith(href) ? 'page' : undefined}
            className="relative inline-flex min-h-tap items-center px-2 font-display text-[1.15rem] tracking-[0.05em] uppercase transition-colors hover:text-red aria-[current=page]:text-red"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
