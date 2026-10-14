import Link from 'next/link'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

import { ui } from '../ui/classes'

export function Footer({ site }: { site: SiteVM }) {
  const location = site.locations[0]
  return (
    <footer className="mt-section">
      <div className={`${ui.container} pb-8`}>
        <div
          data-theme="inverse"
          className="grid gap-8 rounded-[2rem] p-7 sm:grid-cols-[1.4fr_1fr_1fr]"
        >
          <div className="grid content-start gap-3">
            <span className="flex items-center gap-2">
              <Mustache className="h-4 w-auto text-red" />
              <span className="wordmark text-3xl">{site.name}</span>
            </span>
            <p className="max-w-[24ch] text-ink-muted">{copy.footer.tagline}</p>
            <span className="justify-self-start rounded-full bg-red px-3 py-1 text-small font-bold text-white">
              {copy.footer.halal}
            </span>
          </div>
          <nav aria-label="Footer" className="grid content-start">
            {[
              { href: '/menu', label: copy.nav.menu },
              { href: '/about', label: copy.nav.about },
              { href: '/location', label: copy.nav.location },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-tap items-center font-semibold hover:text-red"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="grid content-start gap-1 text-ink-muted">
            {location?.addressLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            {site.socials.map((social) => (
              <a
                key={social.url}
                href={social.url}
                className="inline-flex min-h-tap items-center font-semibold text-white hover:text-red"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
