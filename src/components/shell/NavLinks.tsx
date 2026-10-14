'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { copy } from '@/theme/copy'

import { HomeIcon, MenuIcon, PinIcon, StoryIcon } from '../ui/icons'

export const NAV = [
  { href: '/', label: copy.nav.home, Icon: HomeIcon },
  { href: '/menu', label: copy.nav.menu, Icon: MenuIcon },
  { href: '/about', label: copy.nav.about, Icon: StoryIcon },
  { href: '/location', label: copy.nav.location, Icon: PinIcon },
] as const

export function useIsCurrent() {
  const pathname = usePathname()
  return (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
}

/** Desktop top navigation. */
export function NavLinks() {
  const isCurrent = useIsCurrent()
  return (
    <ul className="flex items-center gap-1">
      {NAV.map(({ href, label }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={isCurrent(href) ? 'page' : undefined}
            className="inline-flex min-h-tap items-center rounded-full px-4 font-semibold text-ink-muted transition-colors hover:text-ink aria-[current=page]:bg-surface-raised aria-[current=page]:text-ink aria-[current=page]:shadow-[var(--shadow-raised)]"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
