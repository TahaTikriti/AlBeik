import Link from 'next/link'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { ui } from '../ui/classes'

export function Footer({ site }: { site: SiteVM }) {
  const location = site.locations[0]
  return (
    <footer className="grain relative overflow-hidden border-t-4 border-red bg-black">
      <div className={`${ui.container} grid gap-10 pt-16 pb-6`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid content-start gap-3">
            <Mustache className="h-6 w-auto self-start text-red" />
            <p className="max-w-[16rem] font-display text-2xl leading-none uppercase">
              {copy.footer.tagline}
            </p>
          </div>
          <nav aria-label="Footer" className="grid content-start gap-1">
            {[
              { href: '/menu', label: copy.nav.menu },
              { href: '/about', label: copy.nav.about },
              { href: '/location', label: copy.nav.location },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="label inline-flex min-h-tap items-center hover:text-red-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="grid content-start gap-2 text-small text-ink-muted">
            <p className="label text-white">{copy.footer.halal}</p>
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
      </div>
      <p
        aria-hidden
        className="pointer-events-none -mb-[0.18em] text-center font-display text-[31vw] leading-[0.78] tracking-[-0.01em] text-red uppercase select-none md:text-[24vw]"
      >
        {site.name}
      </p>
    </footer>
  )
}
