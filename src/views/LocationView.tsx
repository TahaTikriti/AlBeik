import Link from 'next/link'

import { Emphasis } from '@/components/ui/Emphasis'
import { PinIcon } from '@/components/ui/icons'
import { ui } from '@/components/ui/classes'
import type { LocationPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Fez } from '@/theme/motifs'

export function LocationView({ locations }: LocationPageData) {
  return (
    <div className={`${ui.container} grid gap-6 pt-6 pb-4 md:pt-12`}>
      <header className="flex items-center justify-between gap-4">
        <div className="grid gap-2">
          <p className="label text-red">{copy.location.title}</p>
          <h1 className="text-display-1">
            <Emphasis text={copy.location.heading} />
          </h1>
        </div>
        <Fez className="float w-20 shrink-0 -rotate-12 md:w-28" />
      </header>

      {locations.map((location) => {
        const hasDetails =
          location.streetAddress || location.phone || location.mapUrl || location.hours.length
        return (
          <section
            key={location.name}
            aria-label={location.name}
            className="grid gap-3 md:grid-cols-2"
          >
            <div className="card grid content-start gap-4 p-6">
              <span className="grid size-12 place-items-center rounded-full bg-accent-tint text-red">
                <PinIcon className="size-6" />
              </span>
              <p className="label text-ink-muted">{copy.location.address}</p>
              <address className="grid text-display-2 not-italic">
                {location.addressLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
              <div className="flex flex-wrap gap-2">
                {location.mapUrl ? (
                  <a href={location.mapUrl} className="btn btn-red">
                    {copy.location.directions}
                  </a>
                ) : null}
                {location.phone && location.phoneHref ? (
                  <a href={location.phoneHref} className="btn btn-soft">
                    {copy.location.call(location.phone)}
                  </a>
                ) : null}
              </div>
            </div>

            <div className="card grid content-start gap-4 p-6">
              <p className="label text-ink-muted">{copy.location.hours}</p>
              {location.hours.length ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                  {location.hours.map((h) => (
                    <div key={h.days} className="contents">
                      <dt className="font-bold">{h.days}</dt>
                      <dd className="text-ink-muted">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {location.hoursNote ? <p className="text-ink-muted">{location.hoursNote}</p> : null}
              {hasDetails ? null : (
                <>
                  <p className="text-lg">{copy.location.detailsSoon}</p>
                  <Link href="/menu" className="btn btn-red justify-self-start">
                    {copy.notFound.cta}
                  </Link>
                </>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
