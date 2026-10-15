import Link from 'next/link'

import { Emphasis } from '@/components/ui/Emphasis'
import { ui } from '@/components/ui/classes'
import type { LocationPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { FezMoment, Smoke } from '@/theme/motifs'

export function LocationView({ locations }: LocationPageData) {
  return (
    <div className="grain relative overflow-hidden">
      <Smoke />
      <div className={`${ui.container} grid gap-14 pt-12 pb-section md:pt-20`}>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-mega">
            <Emphasis text={copy.location.heading} />
          </h1>
          <FezMoment className="w-20 shrink-0 md:w-32" />
        </div>

        {locations.map((location) => {
          const hasDetails =
            location.streetAddress || location.phone || location.mapUrl || location.hours.length
          return (
            <section
              key={location.name}
              aria-label={location.name}
              className="grid gap-10 md:grid-cols-2"
            >
              <div className="grid content-start gap-4">
                <p className="label text-red-text">{copy.location.address}</p>
                <address className="grid font-display text-display-1 not-italic uppercase">
                  {location.addressLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </address>
                <div className="flex flex-wrap gap-3">
                  {location.mapUrl ? (
                    <a href={location.mapUrl} className="btn btn-red">
                      {copy.location.directions}
                    </a>
                  ) : null}
                  {location.phone && location.phoneHref ? (
                    <a href={location.phoneHref} className="btn btn-ghost">
                      {copy.location.call(location.phone)}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="grid content-start gap-4">
                <p className="label text-red-text">{copy.location.hours}</p>
                {location.hours.length ? (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-xl">
                    {location.hours.map((h) => (
                      <div key={h.days} className="contents">
                        <dt className="font-display uppercase">{h.days}</dt>
                        <dd>{h.time}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {location.hoursNote ? <p className="text-ink-muted">{location.hoursNote}</p> : null}
                {hasDetails ? null : (
                  <div className="grid gap-5 rounded-card bg-surface-raised p-6">
                    <p className="text-xl leading-snug">{copy.location.detailsSoon}</p>
                    <Link href="/menu" className="btn btn-red justify-self-start">
                      {copy.home.seeMenu}
                    </Link>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
