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
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-14">
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

          {location?.mapEmbedUrl ? (
            <figure className="map-card grid overflow-clip rounded-card bg-charcoal ring-1 ring-white/10 md:row-span-2">
              {/* Lazy: Google's map code only loads once the footer is near. */}
              <iframe
                src={location.mapEmbedUrl}
                title={copy.footer.mapTitle}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="map-dark aspect-[4/3] h-auto w-full border-0 md:aspect-auto md:h-full md:min-h-[22rem]"
              />
              <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4 sm:p-5">
                <address className="grid not-italic">
                  <span className="label text-red-text">{copy.footer.mapLabel}</span>
                  {location.addressLines.map((line) => (
                    <span key={line} className="text-small text-ink-muted first-of-type:text-white">
                      {line}
                    </span>
                  ))}
                </address>
                {location.mapUrl ? (
                  <a
                    href={location.mapUrl}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-red min-h-11 text-[1.1rem]"
                  >
                    {copy.location.directions}
                  </a>
                ) : null}
              </figcaption>
            </figure>
          ) : null}

          <div className="grid grid-cols-2 gap-8 md:self-end">
            <nav aria-label="Footer">
              <ul className="grid">
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
              {/* Shown here only when there's no map card carrying the address. */}
              {location && !location.mapEmbedUrl
                ? location.addressLines.map((line) => <span key={line}>{line}</span>)
                : null}
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
        <p className="label border-t border-line pt-6 text-ink-muted">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}
