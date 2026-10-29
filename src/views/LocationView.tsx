import Link from 'next/link'

import { OrderButton } from '@/components/order/OrderButton'
import { PunchLine } from '@/components/ui/PunchLine'
import { ui } from '@/components/ui/classes'
import { trackOnClick } from '@/lib/analytics'
import type { LocationPageData, OrderLink } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { FezMoment, Smoke } from '@/theme/motifs'

/**
 * A utility page: address, directions, call, hours and the map, where a
 * visitor can act on them at once. The footer hides its own map here
 * (data-page, brand.css).
 */
export function LocationView({
  locations,
  orderLinks,
}: LocationPageData & { orderLinks: OrderLink[] }) {
  return (
    <div data-page="visit" className="grain relative overflow-hidden">
      <Smoke />
      <div className={`${ui.container} grid gap-12 pt-12 pb-section md:gap-16 md:pt-20`}>
        <header className="grid gap-5">
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-display-1 max-w-[13ch]">
              <PunchLine text={copy.location.heading} />
            </h1>
            <FezMoment className="w-20 shrink-0 md:w-32" />
          </div>
          <p className="max-w-[40ch] text-lg text-ink-muted">{copy.location.intro}</p>
        </header>

        {locations.map((location) => {
          const hasDetails =
            location.streetAddress || location.phone || location.mapUrl || location.hours.length
          return (
            <section
              key={location.name}
              aria-label={location.name}
              className="grid gap-12 md:grid-cols-2 md:gap-12"
            >
              <div className="grid content-start gap-12">
                <div className="grid gap-4">
                  <p className="label text-red-text">{copy.location.address}</p>
                  <address className="grid font-display text-display-2 not-italic uppercase">
                    {location.addressLines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </address>
                  <div className="flex flex-wrap gap-3">
                    {location.mapUrl ? (
                      <a
                        href={location.mapUrl}
                        target="_blank"
                        rel="noopener"
                        className="btn btn-red"
                        {...trackOnClick('directions_click', { placement: 'visit' })}
                      >
                        {copy.location.directions}
                      </a>
                    ) : null}
                    {location.phone && location.phoneHref ? (
                      <a
                        href={location.phoneHref}
                        className="btn btn-ghost"
                        {...trackOnClick('call_click', { placement: 'visit' })}
                      >
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
                  {location.hoursNote ? (
                    <p className="text-ink-muted">{location.hoursNote}</p>
                  ) : null}
                  {orderLinks.length > 0 && (location.hours.length || location.hoursNote) ? (
                    <div className="grid gap-4 pt-6">
                      <p className="label text-red-text">{copy.location.orderAhead}</p>
                      <div className="flex flex-wrap gap-3">
                        <OrderButton
                          links={orderLinks}
                          placement="visit"
                          mode="pickup"
                          label={copy.order.modes.pickup.cta}
                          className="btn btn-white"
                        />
                        <OrderButton
                          links={orderLinks}
                          placement="visit"
                          mode="delivery"
                          label={copy.order.modes.delivery.cta}
                          className="btn btn-ghost"
                        />
                      </div>
                    </div>
                  ) : null}
                  {location.hours.length || location.hoursNote ? null : (
                    <div className="grid gap-5 rounded-card bg-surface-raised p-6">
                      <p className="text-xl leading-snug">
                        {hasDetails ? copy.location.hoursSoon : copy.location.detailsSoon}
                      </p>
                      <Link href="/menu" className="btn btn-red justify-self-start">
                        {copy.home.seeMenu}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {location.mapEmbedUrl ? (
                <figure className="overflow-clip rounded-card bg-charcoal ring-1 ring-white/10">
                  <iframe
                    src={location.mapEmbedUrl}
                    title={copy.footer.mapTitle}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    className="map-dark aspect-[4/3] h-auto w-full border-0 md:aspect-auto md:h-full md:min-h-[26rem]"
                  />
                </figure>
              ) : null}
            </section>
          )
        })}
      </div>
    </div>
  )
}
