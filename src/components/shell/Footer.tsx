import Link from 'next/link'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Mark, Wordmark } from '@/theme/motifs'

import { ui } from '../ui/classes'

export function Footer({ site }: { site: SiteVM }) {
  const location = site.locations[0]
  return (
    <footer className="grain relative overflow-hidden border-t-4 border-red bg-black">
      <div className={`${ui.container} grid gap-12 pt-14 pb-8 md:gap-16 md:pt-20`}>
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr] md:gap-12">
          <div className="flex items-end gap-5">
            <Mark sizes="4.5rem" className="h-24 w-auto shrink-0 md:h-28" />
            <p className="max-w-[15rem] font-display text-2xl leading-none uppercase">
              {copy.footer.tagline}
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 md:grid md:gap-x-0">
              {[
                { href: '/menu', label: copy.nav.menu },
                { href: '/about', label: copy.nav.about },
                { href: '/location', label: copy.nav.location },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="label inline-flex min-h-tap items-center hover:text-red-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="grid content-start gap-2 text-small text-ink-muted">
            {location?.addressLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            {site.socials.map((social) => (
              <a
                key={social.url}
                href={social.url}
                className={`${ui.link} inline-flex min-h-tap items-center`}
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
        <Wordmark className="w-full text-red" />
      </div>
    </footer>
  )
}
