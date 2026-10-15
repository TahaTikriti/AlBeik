import Link from 'next/link'

import type { SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { LogoPanel } from '@/theme/motifs'

import { Emphasis } from '../ui/Emphasis'
import { ui } from '../ui/classes'

export function Footer({ site }: { site: SiteVM }) {
  const location = site.locations[0]
  return (
    <footer className="grain relative overflow-hidden border-t-4 border-red bg-black">
      <div className={`${ui.container} grid gap-12 pt-14 pb-8 md:gap-16 md:pt-20`}>
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr] md:gap-12">
          <div className="grid content-start justify-items-start gap-6">
            <LogoPanel sizes="18rem" className="w-[16rem] md:w-[18rem]" />
            {/* The slogan as set in the brand guidelines. */}
            <p className="font-display text-[1.75rem] leading-[0.98] uppercase">
              {copy.footer.tagline.split(/(?<=\.)\s+/).map((sentence) => (
                <span key={sentence} className="block">
                  <Emphasis text={sentence} />
                </span>
              ))}
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
                    className="label inline-flex min-h-tap min-w-11 items-center hover:text-red-text"
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
        <p className="label border-t border-line pt-6 text-ink-muted">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}
