import Link from 'next/link'

import { MenuItemCard } from '@/components/menu/MenuItemCard'
import { OrderButton } from '@/components/order/OrderButton'
import { Emphasis } from '@/components/ui/Emphasis'
import { Media } from '@/components/ui/Media'
import { ui } from '@/components/ui/classes'
import type { HomePageData, SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Divider } from '@/theme/motifs'

type Props = HomePageData & { site: SiteVM }

export function HomeView({ hero, promise, featured, promo, testimonials, site }: Props) {
  const location = site.locations[0]

  return (
    <>
      {promo ? (
        <aside className="bg-surface-inverse text-ink-inverse">
          <p
            className={`${ui.container} flex min-h-tap flex-wrap items-center gap-x-3 py-2 text-small`}
          >
            <span>
              <Emphasis line={promo.text} />
            </span>
            {promo.linkUrl ? (
              <Link href={promo.linkUrl} className={ui.link}>
                {promo.linkLabel ?? copy.home.seeMenu}
              </Link>
            ) : null}
          </p>
        </aside>
      ) : null}

      <section
        className={`${ui.container} ${ui.section} grid gap-stack md:grid-cols-2 md:items-center`}
      >
        <div className="grid gap-stack">
          <h1 className="text-display-1">
            <Emphasis line={hero.headline} />
          </h1>
          {hero.subline ? <p className="text-ink-muted">{hero.subline}</p> : null}
          <div className="flex flex-wrap gap-2">
            <OrderButton links={site.storeOrderLinks} placement="home-hero" />
            <Link href="/menu" className={ui.buttonSecondary}>
              {copy.home.seeMenu}
            </Link>
          </div>
        </div>
        {hero.media ? (
          <Media
            media={hero.media}
            sizes="(min-width: 768px) 50vw, 100vw"
            preload
            className="h-auto w-full rounded-card object-cover"
          />
        ) : null}
      </section>

      {promise ? (
        <section
          className={`${ui.container} ${ui.section} grid gap-stack md:grid-cols-2 md:items-center`}
        >
          <div className="grid gap-stack">
            {promise.headline.text ? (
              <h2 className="text-display-2">
                <Emphasis line={promise.headline} />
              </h2>
            ) : null}
            {promise.body ? <p>{promise.body}</p> : null}
          </div>
          {promise.media ? (
            <Media
              media={promise.media}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="h-auto w-full rounded-card object-cover"
            />
          ) : null}
        </section>
      ) : null}

      {featured.length ? (
        <section
          aria-labelledby="featured-heading"
          className={`${ui.container} ${ui.section} grid gap-stack`}
        >
          <h2 id="featured-heading" className="text-display-2">
            {copy.home.featuredTitle}
          </h2>
          <ul className="grid gap-stack sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <li key={item.id}>
                <MenuItemCard item={item} placement="home-featured" />
              </li>
            ))}
          </ul>
          <Link href="/menu" className={ui.link}>
            {copy.home.seeMenu}
          </Link>
        </section>
      ) : null}

      <Divider />

      {testimonials.length ? (
        <section
          aria-labelledby="testimonials-heading"
          className={`${ui.container} ${ui.section} grid gap-stack`}
        >
          <h2 id="testimonials-heading" className="text-display-2">
            {copy.home.testimonialsTitle}
          </h2>
          <ul className="grid gap-stack md:grid-cols-2">
            {testimonials.map((t) => (
              <li key={t.id}>
                <figure className="grid gap-2 rounded-card border border-line p-4">
                  <blockquote>
                    <p>“{t.quote}”</p>
                  </blockquote>
                  <figcaption className="text-small text-ink-muted">
                    {t.name}
                    {t.source ? ` · ${t.source}` : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {location ? (
        <section
          aria-labelledby="visit-heading"
          className={`${ui.container} ${ui.section} grid gap-2`}
        >
          <h2 id="visit-heading" className="text-display-2">
            {copy.home.visitTitle}
          </h2>
          {location.addressLines.length ? (
            <address className="grid not-italic">
              {location.addressLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          ) : null}
          {location.hours.length ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 text-small">
              {location.hours.map((h) => (
                <div key={h.days} className="contents">
                  <dt>{h.days}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <Link href="/location" className={ui.link}>
            {copy.nav.location}
          </Link>
        </section>
      ) : null}
    </>
  )
}
