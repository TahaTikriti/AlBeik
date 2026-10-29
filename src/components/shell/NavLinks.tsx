'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { copy } from '@/theme/copy'

// Catering joins from lg: phones keep three links beside the logo (it's in
// the footer and at the end of the menu there).
const LINKS = [
  { href: '/menu', label: copy.nav.menu, className: '' },
  { href: '/our-story', label: copy.nav.about, className: '' },
  { href: '/visit', label: copy.nav.location, className: '' },
  { href: '/catering', label: copy.nav.catering, className: 'max-lg:hidden' },
] as const

export function NavLinks() {
  const pathname = usePathname()
  return (
    <ul className="flex items-center sm:gap-3">
      {LINKS.map(({ href, label, className }) => {
        const current = pathname.startsWith(href)
        return (
          <li key={href} className={className}>
            <Link
              href={href}
              aria-current={current ? 'page' : undefined}
              className="relative inline-flex min-h-tap min-w-11 items-center justify-center px-2 font-display text-[1.1rem] tracking-[0.05em] uppercase transition-colors after:absolute after:inset-x-2 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-(--duration-base) after:ease-out hover:text-emphasis hover:after:scale-x-100 aria-[current=page]:text-emphasis aria-[current=page]:after:hidden sm:text-[1.15rem]"
            >
              {label}
              {/* One named underline: it slides to the new link on navigation (brand.css). */}
              {current ? (
                <span
                  aria-hidden
                  className="absolute inset-x-2 bottom-2 h-0.5 bg-current"
                  style={{ viewTransitionName: 'nav-underline' }}
                />
              ) : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
