import Link from 'next/link'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { ui } from '../ui/classes'

export function Footer({ site }: { site: SiteVM }) {
  const location = site.locations[0]
  return (
    <footer className="border-t border-line bg-surface-raised">
      <div className={`${ui.container} grid gap-stack py-section sm:grid-cols-3`}>
        <div className="grid gap-1">
          <p className="font-display text-display-3">{site.name}</p>
          <p className="text-small">{copy.footer.halal}</p>
        </div>
        {location && location.addressLines.length ? (
          <address className="grid gap-1 text-small not-italic">
            {location.addressLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <Link href="/location" className={ui.link}>
              {copy.nav.location}
            </Link>
          </address>
        ) : null}
        {site.socials.length ? (
          <div className="grid gap-1 text-small">
            <p className="font-semibold">{copy.footer.follow}</p>
            <ul className="flex flex-wrap gap-x-4">
              {site.socials.map((social) => (
                <li key={social.url}>
                  <a href={social.url} className={`${ui.link} inline-flex min-h-tap items-center`}>
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </footer>
  )
}
