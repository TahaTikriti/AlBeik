'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { copy } from '@/theme/copy'

const LINKS = [
  { href: '/', label: copy.nav.home },
  { href: '/menu', label: copy.nav.menu },
  { href: '/about', label: copy.nav.about },
  { href: '/location', label: copy.nav.location },
] as const

export function NavLinks() {
  const pathname = usePathname()
  return (
    <ul className="flex items-center gap-4 whitespace-nowrap">
      {LINKS.map(({ href, label }) => {
        const current = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={current ? 'page' : undefined}
              className="inline-flex min-h-tap items-center aria-[current=page]:underline aria-[current=page]:underline-offset-4"
            >
              {label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
