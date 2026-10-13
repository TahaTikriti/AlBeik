import { ui } from '@/components/ui/classes'
import type { LocationPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'

export function LocationView({ locations }: LocationPageData) {
  const multiple = locations.length > 1
  return (
    <div className={`${ui.container} ${ui.section} grid gap-section`}>
      <h1 className="text-display-1">{copy.location.title}</h1>
      {locations.map((location) => {
        const hasDetails =
          location.addressLines.length || location.phone || location.mapUrl || location.hours.length
        return (
          <section key={location.name} className="grid gap-stack" aria-label={location.name}>
            {multiple ? <h2 className="text-display-2">{location.name}</h2> : null}
            {location.addressLines.length ? (
              <div className="grid gap-1">
                <h2 className="text-label text-ink-muted">{copy.location.address}</h2>
                <address className="grid not-italic">
                  {location.addressLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </address>
              </div>
            ) : null}
            {location.mapUrl || location.phoneHref ? (
              <div className="flex flex-wrap gap-2">
                {location.mapUrl ? (
                  <a href={location.mapUrl} className={ui.buttonPrimary}>
                    {copy.location.directions}
                  </a>
                ) : null}
                {location.phone && location.phoneHref ? (
                  <a href={location.phoneHref} className={ui.buttonSecondary}>
                    {copy.location.call(location.phone)}
                  </a>
                ) : null}
              </div>
            ) : null}
            {location.hours.length ? (
              <div className="grid gap-1">
                <h2 className="text-label text-ink-muted">{copy.location.hours}</h2>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                  {location.hours.map((h) => (
                    <div key={h.days} className="contents">
                      <dt>{h.days}</dt>
                      <dd>{h.time}</dd>
                    </div>
                  ))}
                </dl>
                {location.hoursNote ? (
                  <p className="text-small text-ink-muted">{location.hoursNote}</p>
                ) : null}
              </div>
            ) : null}
            {hasDetails ? null : <p>{copy.location.detailsSoon}</p>}
          </section>
        )
      })}
    </div>
  )
}
