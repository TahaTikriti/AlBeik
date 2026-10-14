import Link from 'next/link'

import { ItemSheetProvider } from '@/components/menu/ItemSheet'
import { MenuItemCard } from '@/components/menu/MenuItemCard'
import { OrderButton } from '@/components/order/OrderButton'
import { Emphasis } from '@/components/ui/Emphasis'
import { ArrowIcon, PinIcon } from '@/components/ui/icons'
import { Media } from '@/components/ui/Media'
import { ui } from '@/components/ui/classes'
import type { HomePageData, SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Divider, Mustache } from '@/theme/motifs'

type Props = HomePageData & { site: SiteVM }

export function HomeView({ hero, promise, featured, promo, testimonials, site }: Props) {
  const location = site.locations[0]

  return (
    <ItemSheetProvider>
      {promo ? (
        <aside className={`${ui.container} pt-2`}>
          <p className="flex min-h-11 flex-wrap items-center justify-center gap-x-3 rounded-full bg-accent-tint px-4 text-center text-small font-semibold text-[#b81d14]">
            <Emphasis line={promo.text} />
            {promo.linkUrl ? (
              <Link href={promo.linkUrl} className="underline underline-offset-4">
                {promo.linkLabel ?? copy.menu.title}
              </Link>
            ) : null}
          </p>
        </aside>
      ) : null}

      {/* HERO */}
      <section
        className={`${ui.container} grid gap-6 pt-6 pb-4 md:grid-cols-2 md:items-center md:gap-12 md:pt-12`}
      >
        <div className="grid gap-4">
          <p className="flex items-center gap-2 text-small font-semibold text-ink-muted">
            <span className="wordmark text-xl text-red">{copy.home.greeting}</span>
            {copy.home.heroKicker}
          </p>
          <h1 className="text-display-1">
            <Emphasis line={hero.headline} />
          </h1>
          {hero.subline ? <p className="text-lg text-ink-muted">{hero.subline}</p> : null}
          <div className="flex flex-wrap gap-2">
            <OrderButton
              links={site.storeOrderLinks}
              placement="home-hero"
              label={copy.order.stickyLabel}
              className="btn btn-red px-7"
            />
            <Link href="/menu" className="btn btn-soft px-6">
              {copy.home.browseTitle}
            </Link>
          </div>
        </div>
        {hero.media ? (
          <div className="relative">
            <Media
              media={hero.media}
              sizes="(min-width: 768px) 46vw, 92vw"
              preload
              className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-raised"
            />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-small font-bold shadow-raised backdrop-blur">
              <span className="grid size-6 place-items-center rounded-full bg-red text-white">
                <Mustache className="h-1.5 w-auto" />
              </span>
              {copy.home.halalTitle}
            </span>
          </div>
        ) : null}
      </section>

      {/* SIGNATURES */}
      {featured.length ? (
        <section aria-labelledby="featured-heading" className="grid gap-4 py-section">
          <div className={`${ui.container} flex items-end justify-between`}>
            <h2 id="featured-heading" className="text-display-2">
              {copy.home.featuredTitle}
            </h2>
            <Link
              href="/menu"
              className="inline-flex min-h-tap items-center gap-1 font-semibold text-red"
            >
              {copy.home.seeAll}
              <ArrowIcon className="size-4" />
            </Link>
          </div>
          <ul className="mx-auto flex w-full max-w-content snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto px-gutter pt-2 pb-6 [scrollbar-width:none]">
            {featured.map((item) => (
              <li key={item.id} className="w-[min(15rem,70vw)] shrink-0 snap-start">
                <MenuItemCard item={item} placement="home-featured" variant="tile" />
              </li>
            ))}
            <li className="w-[min(15rem,70vw)] shrink-0 snap-start">
              <Link
                href="/menu"
                className="card pressable flex h-full min-h-56 flex-col items-center justify-center gap-3 p-4 text-center font-bold text-red"
              >
                <span className="grid size-14 place-items-center rounded-full bg-accent-tint">
                  <ArrowIcon className="size-6" />
                </span>
                {copy.home.browseTitle}
              </Link>
            </li>
          </ul>
        </section>
      ) : null}

      {/* PROMISE */}
      {promise ? (
        <section className={ui.container}>
          <div
            data-theme="red"
            className="grid gap-6 overflow-hidden rounded-[2rem] p-6 md:grid-cols-2 md:items-center md:p-10"
          >
            <div className="grid gap-3">
              <Mustache className="h-5 w-auto self-start text-white" />
              {promise.headline.text ? (
                <h2 className="text-display-1 [&_em]:text-black">
                  <Emphasis line={promise.headline} />
                </h2>
              ) : null}
              {promise.body ? <p className="leading-relaxed">{promise.body}</p> : null}
            </div>
            {promise.media ? (
              <Media
                media={promise.media}
                sizes="(min-width: 768px) 40vw, 90vw"
                className="aspect-square w-full rounded-[1.5rem] object-cover"
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {/* TESTIMONIALS */}
      {testimonials.length ? (
        <section aria-labelledby="testimonials-heading" className="grid gap-4 py-section">
          <h2 id="testimonials-heading" className={`${ui.container} text-display-2`}>
            {copy.home.testimonialsTitle}
          </h2>
          <ul className="mx-auto flex w-full max-w-content snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto px-gutter pb-6 [scrollbar-width:none]">
            {testimonials.map((t) => (
              <li key={t.id} className="w-[min(20rem,82vw)] shrink-0 snap-start">
                <figure className="card grid h-full content-between gap-5 p-5">
                  <blockquote>
                    <p className="leading-relaxed">“{t.quote}”</p>
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <span
                      className="grid size-10 place-items-center rounded-full bg-accent-tint font-brand text-lg text-red"
                      aria-hidden
                    >
                      {t.name.charAt(0)}
                    </span>
                    <span className="grid">
                      <span className="font-bold">{t.name}</span>
                      {t.source ? (
                        <span className="text-small text-ink-muted">{t.source}</span>
                      ) : null}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Divider />

      {/* VISIT */}
      {location ? (
        <section aria-labelledby="visit-heading" className={`${ui.container} pt-section`}>
          <Link href="/location" className="card pressable flex items-center gap-4 p-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent-tint text-red">
              <PinIcon className="size-6" />
            </span>
            <span className="grid flex-1">
              <span id="visit-heading" className="text-display-3">
                {copy.home.visitTitle}
              </span>
              <span className="text-ink-muted">{location.addressLines.join(', ')}</span>
            </span>
            <ArrowIcon className="size-5 text-red" />
          </Link>
        </section>
      ) : null}
    </ItemSheetProvider>
  )
}
