import Link from 'next/link'
import { ViewTransition } from 'react'
import { preload } from 'react-dom'

import { dishPreloadAttrs } from '@/components/menu/dishImage'
import { OrderButton } from '@/components/order/OrderButton'
import { Countdown } from '@/components/ui/Countdown'
import { Emphasis } from '@/components/ui/Emphasis'
import { HeroLoop } from '@/components/ui/HeroLoop'
import { Img } from '@/components/ui/Img'
import { Marquee } from '@/components/ui/Marquee'
import { Media } from '@/components/ui/Media'
import { PunchLine } from '@/components/ui/PunchLine'
import { ui } from '@/components/ui/classes'
import { trackOnClick } from '@/lib/analytics'
import type { HomePageData, MenuItemVM, RichLine, SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Embers, Mustache, Smoke } from '@/theme/motifs'

type CategoryLink = { slug: string; name: string; count: number }

type Props = HomePageData & { site: SiteVM; categories: CategoryLink[] }

/**
 * Splits "The recipe is *Lebanese*. The extra attitude is ours." into the
 * shout ("The recipe is Lebanese.") and the follow-up line.
 */
function splitFirstSentence(line: RichLine): [RichLine, RichLine | null] {
  const first: RichLine['segments'] = []
  for (const [i, segment] of line.segments.entries()) {
    const stop = segment.emphasis ? -1 : segment.text.indexOf('.')
    if (stop === -1) {
      first.push(segment)
      continue
    }
    first.push({ text: segment.text.slice(0, stop + 1), emphasis: false })
    const rest = [
      { text: segment.text.slice(stop + 1).trimStart(), emphasis: false },
      ...line.segments.slice(i + 1),
    ].filter((s) => s.text)
    const text = (segs: RichLine['segments']) => segs.map((s) => s.text).join('')
    return [
      { segments: first, text: text(first) },
      rest.length ? { segments: rest, text: text(rest) } : null,
    ]
  }
  return [line, null]
}

/**
 * The blueprint's homepage order (section 2): food and the two order paths,
 * the signatures, the introduction, the halal callout, the menu categories,
 * reviews, the visit details and a last order prompt.
 */
export function HomeView({
  hero,
  promise,
  featured,
  promo,
  testimonials,
  site,
  categories,
}: Props) {
  const [shout, followUp] = splitFirstSentence(hero.headline)
  // The loop's poster is the hero's largest paint: fetch it first.
  if (hero.loop?.poster) preload(hero.loop.poster, { as: 'image', fetchPriority: 'high' })
  const location = site.locations[0]

  return (
    <>
      {promo ? (
        <aside className="bg-white text-black">
          <p
            className={`${ui.container} flex min-h-11 flex-wrap items-center justify-center gap-x-3 py-2 text-center font-display text-lg uppercase`}
          >
            {promo.countdownTo ? <Countdown to={promo.countdownTo} /> : null}
            <span>
              <Emphasis line={promo.text} />
            </span>
            {promo.linkUrl ? (
              <Link href={promo.linkUrl} className="label underline underline-offset-4">
                {promo.linkLabel ?? copy.home.seeMenu}
              </Link>
            ) : null}
          </p>
        </aside>
      ) : null}

      {/* HERO: the brand's reels on a page. On phones and tablets the dish fills
          the whole first screen behind the copy (dimmed under the words, full
          strength below); from lg it sits beside the copy. The page's one
          orchestrated moment: the words punch in, LEBANESE settles in after them,
          the grill throws embers. The order buttons never wait for it. */}
      <section className="grain relative overflow-hidden max-lg:min-h-[calc(100svh-var(--spacing-header))]">
        <Smoke />
        <div
          className={`${ui.container} relative z-10 grid gap-6 pt-9 pb-10 lg:min-h-[min(44rem,calc(100dvh-var(--spacing-header)))] lg:grid-cols-[minmax(0,52%)_1fr] lg:content-center lg:py-20 lg:*:col-start-1`}
        >
          <div className="grid gap-3">
            <p className="label text-red-text">{copy.home.heroKicker}</p>
            <h1>
              <span className="text-display-1 block">
                <PunchLine line={shout} />
              </span>
              {followUp ? (
                <span className="swipe-in mt-[0.35em] block font-display text-[clamp(1.6rem,1.2rem+2vw,2.6rem)] leading-none">
                  <Emphasis line={followUp} />
                </span>
              ) : null}
            </h1>
          </div>
          {hero.subline ? (
            <p className="max-w-[34ch] text-lg text-ink-muted">{hero.subline}</p>
          ) : null}
          {/* The two journeys, equally visible: stacked on phones, side by side from sm. */}
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <OrderButton
              links={site.storeOrderLinks}
              placement="home-hero"
              mode="delivery"
              label={copy.order.modes.delivery.cta}
              className="btn btn-red min-h-14 px-3 text-[1.3rem] sm:px-8 sm:text-[1.5rem]"
            />
            <OrderButton
              links={site.storeOrderLinks}
              placement="home-hero"
              mode="pickup"
              label={copy.order.modes.pickup.cta}
              className="btn btn-white min-h-14 px-3 text-[1.3rem] sm:px-8 sm:text-[1.5rem]"
            />
          </div>
          {location?.streetAddress ? (
            <p className="label flex flex-wrap items-center gap-x-3 gap-y-1 text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.9)]">
              <Link href="/visit" className="min-h-tap content-center hover:text-white">
                {[location.streetAddress, location.city].filter(Boolean).join(', ')}
              </Link>
              <span aria-hidden className="text-red-text">
                ●
              </span>
              <span>{copy.home.halalChip}</span>
            </p>
          ) : null}
        </div>

        {/* With a loop, the video stands alone (its poster is its first frame);
            otherwise the photo, with embers standing in for the fire. */}
        {hero.loop ? (
          <figure className="hero-shade absolute inset-0 lg:left-auto lg:w-[54%]">
            <HeroLoop video={hero.loop} className="h-full w-full object-cover" />
          </figure>
        ) : hero.media ? (
          <figure className="absolute inset-0 lg:left-auto lg:w-[54%]">
            <Media
              media={hero.media}
              sizes="(min-width: 1024px) 54vw, 100vw"
              preload
              className="fade-photo hero-settle h-full w-full object-cover"
            />
            <Embers />
          </figure>
        ) : null}
      </section>

      <Marquee items={copy.marquee} />

      {/* SIGNATURES: a few confident starting points. Same-size cards, a
          swipeable row up to lg, then a grid of five. */}
      {featured.length ? (
        <section
          aria-labelledby="featured-heading"
          className={`${ui.container} ${ui.section} grid gap-8`}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <h2 id="featured-heading" className="kinetic text-display-1">
              <Emphasis text={copy.home.featuredTitle} />
            </h2>
            <Link href="/menu" className="btn btn-ghost">
              {copy.home.seeMenu}
            </Link>
          </div>
          <ol className="-mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto px-gutter [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
            {featured.map((item) => (
              <li
                key={item.id}
                className="w-[64%] shrink-0 snap-start sm:w-[40%] md:w-[30%] lg:w-auto"
              >
                <SignatureCard item={item} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* PROMISE */}
      {promise ? (
        <section data-theme="inverse" className="wipe-open grain relative overflow-clip">
          <div className={`${ui.container} grid gap-10 py-section md:grid-cols-2 md:items-center`}>
            <div className="grid gap-6">
              {promise.headline.text ? (
                <h2 className="text-mega text-black">
                  <PromiseHeadline line={promise.headline} />
                </h2>
              ) : null}
              {promise.body ? <p className="max-w-[38ch] text-lg">{promise.body}</p> : null}
              <Link href="/our-story" className="btn btn-ink justify-self-start">
                {copy.home.storyLink}
              </Link>
            </div>
            {promise.media ? (
              <div className="relative overflow-clip rounded-card shadow-raised">
                <Media
                  media={promise.media}
                  sizes="(min-width: 768px) 46vw, 100vw"
                  className="parallax aspect-[4/3] w-full object-cover md:aspect-[4/5]"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* HALAL: said plainly, once, where people look for it. */}
      <section data-theme="light" aria-labelledby="halal-heading" className="bg-surface">
        <div
          className={`${ui.container} grid gap-6 py-14 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-14 md:py-20`}
        >
          <p aria-hidden className="font-display text-mega leading-[0.86] uppercase">
            100%
            <span className="block text-red-text">Halal</span>
          </p>
          <div className="grid content-center gap-3">
            <h2 id="halal-heading" className="text-display-2">
              {copy.home.halal.title}
            </h2>
            <p className="max-w-[46ch] text-lg">{copy.home.halal.body}</p>
            {location?.phone && location.phoneHref ? (
              <a
                href={location.phoneHref}
                className={`${ui.link} justify-self-start text-lg`}
                {...trackOnClick('call_click', { placement: 'home-visit' })}
              >
                {copy.location.call(location.phone)}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* CATEGORIES: the whole menu as a board, one tap to each section. */}
      {categories.length ? (
        <section
          aria-labelledby="categories-heading"
          className={`${ui.container} ${ui.section} grid gap-8`}
        >
          <h2 id="categories-heading" className="kinetic text-display-1">
            <Emphasis text={copy.home.categoriesTitle} />
          </h2>
          <ul className="grid md:grid-cols-2 md:gap-x-10">
            {categories.map((category) => (
              <li key={category.slug} className="border-b border-line">
                <Link
                  href={`/menu#${category.slug}`}
                  className="flex min-h-16 items-center justify-between gap-4 py-4 transition-colors hover:text-red-text"
                >
                  <span className="font-display text-[clamp(1.5rem,1rem+2vw,2.25rem)] leading-none uppercase">
                    {category.name}
                  </span>
                  <span className="label shrink-0 text-ink-muted">
                    {copy.menu.count(category.count)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* TESTIMONIALS */}
      {testimonials.length ? (
        <section
          data-theme="light"
          aria-labelledby="testimonials-heading"
          className="overflow-clip"
        >
          <div className={`${ui.container} ${ui.section} grid gap-10`}>
            <h2 id="testimonials-heading" className="kinetic text-display-1">
              <Emphasis text={copy.home.testimonialsTitle} />
            </h2>
            <ul className="-mx-gutter flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-4 [scrollbar-width:none] md:grid md:auto-rows-fr md:grid-cols-2 md:overflow-visible">
              {testimonials.map((t) => (
                <li key={t.id} className="w-[86%] shrink-0 snap-start md:w-auto">
                  <figure className="grid h-full content-between gap-6 rounded-card bg-black p-6 text-white">
                    <blockquote className="grid gap-3">
                      <span
                        aria-hidden
                        className="font-display text-7xl leading-[0.5] text-red-text"
                      >
                        “
                      </span>
                      <p className="text-lg leading-snug">{t.quote}</p>
                    </blockquote>
                    <figcaption className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-display text-xl uppercase">{t.name}</span>
                      {t.source ? <span className="label text-white/70">{t.source}</span> : null}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* The strip comes round again, the other way, between the white and the dark. */}
      <Marquee items={copy.marqueeLate} reverse />

      {/* VISIT */}
      <section aria-labelledby="visit-heading" className="grain relative overflow-clip">
        <Smoke className="opacity-70" />
        <div
          className={`${ui.container} ${ui.section} grid gap-8 lg:grid-cols-[auto_1fr] lg:items-end lg:gap-12`}
        >
          <div className="grid gap-4">
            <h2 id="visit-heading" className="kinetic text-mega lg:whitespace-nowrap">
              <Emphasis text={copy.home.visitTitle} />
            </h2>
            <p className="max-w-[30ch] text-lg text-ink-muted">{copy.home.visitBody}</p>
          </div>
          <div className="grid gap-4 lg:justify-items-end lg:text-right">
            {location ? (
              // Sized for a full street address: each line stays on one line.
              <address className="grid font-display text-[clamp(1.6rem,1.1rem+1.6vw,2.6rem)] leading-[1.02] not-italic uppercase">
                {location.addressLines.map((line) => (
                  <span key={line} className="whitespace-nowrap">
                    {line}
                  </span>
                ))}
              </address>
            ) : null}
            {location?.hours.length ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 text-small">
                {location.hours.map((h) => (
                  <div key={h.days} className="contents">
                    <dt className="label">{h.days}</dt>
                    <dd>{h.time}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {/* Straight to Google Maps when the listing is known. */}
            {location?.mapUrl ? (
              <a
                href={location.mapUrl}
                target="_blank"
                rel="noopener"
                className="btn btn-ghost"
                {...trackOnClick('directions_click', { placement: 'home-visit' })}
              >
                {copy.location.directions}
              </a>
            ) : (
              <Link href="/visit" className="btn btn-ghost">
                {copy.location.directions}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* LAST CALL: the two journeys again, as the blueprint's entry cards. */}
      <section aria-labelledby="final-heading" className={`${ui.container} grid gap-8 pb-section`}>
        <h2 id="final-heading" className="kinetic text-display-1">
          <Emphasis text={copy.home.finalTitle} />
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <article
            data-theme="inverse"
            className="grain relative grid content-between gap-8 overflow-clip rounded-card bg-surface p-6 md:p-10"
          >
            <div className="grid gap-3">
              <h3 className="text-display-2">{copy.home.deliveryCard.title}</h3>
              <p className="max-w-[36ch] text-lg">{copy.home.deliveryCard.body}</p>
            </div>
            <OrderButton
              links={site.storeOrderLinks}
              placement="home-final"
              mode="delivery"
              label={copy.order.modes.delivery.cta}
              className="btn btn-ink min-h-14 justify-self-start px-8 text-[1.4rem]"
            />
          </article>
          <article
            data-theme="light"
            className="grid content-between gap-8 rounded-card bg-surface p-6 md:p-10"
          >
            <div className="grid gap-3">
              <h3 className="text-display-2">{copy.home.pickupCard.title}</h3>
              <p className="max-w-[36ch] text-lg">{copy.home.pickupCard.body}</p>
            </div>
            <OrderButton
              links={site.storeOrderLinks}
              placement="home-final"
              mode="pickup"
              label={copy.order.modes.pickup.cta}
              className="btn btn-red min-h-14 justify-self-start px-8 text-[1.4rem]"
            />
          </article>
        </div>
      </section>
    </>
  )
}

/** "100% *Halal*, Fresh & Delicious" → a giant white "100%", the rest stacked below. */
function PromiseHeadline({ line }: { line: RichLine }) {
  const [first, ...rest] = line.text.split(' ')
  if (!first || !/\d/.test(first)) return <Emphasis line={line} />
  const restLine: RichLine = {
    text: rest.join(' '),
    segments: line.segments
      .map((s, i) => (i === 0 ? { ...s, text: s.text.replace(first, '').trimStart() } : s))
      .filter((s) => s.text),
  }
  return (
    <>
      <span className="block text-white">{first}</span>
      <span className="block text-[0.62em] leading-[0.98] [&_em]:text-white">
        <Emphasis line={restLine} />
      </span>
    </>
  )
}

/**
 * A signature card, linking to the dish: the photo full-bleed under its
 * name, or, until a dish has its photo, the name on brand red with the
 * mustache. Both the same size, the name in the same place.
 */
function SignatureCard({ item }: { item: MenuItemVM }) {
  return (
    <article
      {...dishPreloadAttrs(item.image)}
      data-spotlight
      className={`group relative isolate grid aspect-[4/5] content-end overflow-hidden rounded-card shadow-raised ${item.image ? 'bg-charcoal' : 'grain bg-red'}`}
    >
      {item.image ? (
        <>
          <ViewTransition name={`dish-${item.slug}`} share="dish-photo" default="none">
            <Img
              image={item.image}
              sizes="(min-width: 1024px) 15rem, (min-width: 768px) 30vw, (min-width: 640px) 40vw, 64vw"
              className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-(--duration-slow) ease-out group-hover:scale-105"
            />
          </ViewTransition>
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--color-black)_8%,rgb(0_0_0/0.75)_38%,transparent_68%)]"
          />
        </>
      ) : (
        <Mustache className="absolute top-5 left-5 h-5 w-auto text-black" />
      )}
      <div className="grid gap-2 p-4">
        <ViewTransition name={`dish-name-${item.slug}`} share="dish-name" default="none">
          <h3 className="text-[1.6rem] leading-none normal-case">
            {/* Stretched: the whole card opens the dish. */}
            <Link href={item.href} className="after:absolute after:inset-0">
              {item.name}
            </Link>
          </h3>
        </ViewTransition>
        {item.description ? (
          <p className={`line-clamp-2 text-small ${item.image ? 'text-white/80' : 'text-white'}`}>
            {item.description}
          </p>
        ) : null}
      </div>
    </article>
  )
}
