import Link from 'next/link'

import { OrderButton } from '@/components/order/OrderButton'
import { Countdown } from '@/components/ui/Countdown'
import { Emphasis } from '@/components/ui/Emphasis'
import { Img } from '@/components/ui/Img'
import { Marquee } from '@/components/ui/Marquee'
import { Media } from '@/components/ui/Media'
import { ui } from '@/components/ui/classes'
import type { HomePageData, MenuItemVM, RichLine, SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Smoke, Steam } from '@/theme/motifs'

type Props = HomePageData & { site: SiteVM }

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

export function HomeView({ hero, promise, featured, promo, testimonials, site }: Props) {
  const [shout, followUp] = splitFirstSentence(hero.headline)
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

      {/* HERO: the brand's reels on a page. Copy and the order button come first;
          the dish rises out of the dark below (beside it from lg). */}
      <section className="grain relative overflow-hidden">
        <Smoke />
        <div
          className={`${ui.container} relative z-10 grid gap-6 pt-9 lg:min-h-[min(44rem,calc(100dvh-var(--spacing-header)))] lg:grid-cols-[minmax(0,52%)_1fr] lg:content-center lg:py-20 lg:*:col-start-1`}
        >
          <div className="grid gap-3">
            <p className="label text-red-text">{copy.home.heroKicker}</p>
            <h1>
              <span className="text-display-1 block">
                <Emphasis line={shout} />
              </span>
              {followUp ? (
                <span className="mt-[0.35em] block font-display text-[clamp(1.6rem,1.2rem+2vw,2.6rem)] leading-none">
                  <Emphasis line={followUp} />
                </span>
              ) : null}
            </h1>
          </div>
          {hero.subline ? (
            <p className="max-w-[28ch] text-lg text-ink-muted">{hero.subline}</p>
          ) : null}
          {/* A matched pair on phones; natural widths from sm up. */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3 sm:flex sm:flex-wrap">
            <OrderButton
              links={site.storeOrderLinks}
              placement="home-hero"
              label={copy.order.stickyLabel}
              className="btn btn-red min-h-14 px-3 text-[1.3rem] sm:px-8 sm:text-[1.5rem]"
            />
            <Link
              href="/menu"
              className="btn btn-ghost min-h-14 px-3 text-[1.3rem] sm:px-7 sm:text-[1.5rem]"
            >
              {copy.home.seeMenu}
            </Link>
          </div>
        </div>

        {hero.media ? (
          <figure className="relative -mt-6 lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:w-[54%]">
            <Media
              media={hero.media}
              sizes="(min-width: 1024px) 54vw, 100vw"
              preload
              className="fade-photo hero-settle aspect-square w-full object-cover sm:aspect-[16/10] lg:aspect-auto lg:h-full"
            />
            <Steam />
          </figure>
        ) : null}
      </section>

      <Marquee items={copy.marquee} />

      {/* SIGNATURES: same-size reel cards; a swipeable row on phones. */}
      {featured.length ? (
        <section
          aria-labelledby="featured-heading"
          className={`${ui.container} ${ui.section} grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[1fr_auto] lg:gap-x-12 lg:gap-y-6`}
        >
          <h2
            id="featured-heading"
            className="text-display-1 lg:self-end lg:text-[clamp(3.25rem,1rem+3.6vw,4.75rem)]"
          >
            <Emphasis text={copy.home.featuredTitle} />
          </h2>
          <ol className="-mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-4 overflow-x-auto px-gutter [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {featured.map((item) => (
              <li key={item.id} className="w-[80%] shrink-0 snap-start sm:w-auto">
                <SignatureCard item={item} />
              </li>
            ))}
          </ol>
          <Link
            href="/menu"
            className="btn btn-ghost justify-self-start lg:col-start-1 lg:row-start-2"
          >
            {copy.home.fullMenu}
          </Link>
        </section>
      ) : null}

      {/* PROMISE */}
      {promise ? (
        <section data-theme="inverse" className="grain relative overflow-hidden">
          <div className={`${ui.container} grid gap-10 py-section md:grid-cols-2 md:items-center`}>
            <div className="grid gap-6">
              {promise.headline.text ? (
                <h2 className="text-mega text-black">
                  <PromiseHeadline line={promise.headline} />
                </h2>
              ) : null}
              {promise.body ? <p className="max-w-[38ch] text-lg">{promise.body}</p> : null}
            </div>
            {promise.media ? (
              <div className="relative">
                <Media
                  media={promise.media}
                  sizes="(min-width: 768px) 46vw, 100vw"
                  className="aspect-[4/3] w-full rounded-card object-cover shadow-raised md:aspect-[4/5]"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* TESTIMONIALS */}
      {testimonials.length ? (
        <section
          data-theme="light"
          aria-labelledby="testimonials-heading"
          className="overflow-hidden"
        >
          <div className={`${ui.container} ${ui.section} grid gap-10`}>
            <h2 id="testimonials-heading" className="text-display-1">
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

      {/* VISIT */}
      <section aria-labelledby="visit-heading" className="grain relative overflow-hidden">
        <Smoke className="opacity-70" />
        <div
          className={`${ui.container} ${ui.section} grid gap-8 lg:grid-cols-[auto_1fr] lg:items-end lg:gap-12`}
        >
          <div className="grid gap-4">
            <h2 id="visit-heading" className="text-mega lg:whitespace-nowrap">
              <Emphasis text={copy.home.visitTitle} />
            </h2>
            <p className="max-w-[30ch] text-lg text-ink-muted">{copy.home.visitBody}</p>
          </div>
          <div className="grid gap-4 lg:justify-items-end lg:text-right">
            {location ? (
              <address className="grid font-display text-display-2 not-italic uppercase">
                {location.addressLines.map((line) => (
                  <span key={line}>{line}</span>
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
            <Link href="/location" className="btn btn-ghost">
              {copy.location.directions}
            </Link>
          </div>
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

/** A reel card: the dish full-bleed, fading to black under its name and order button. */
function SignatureCard({ item }: { item: MenuItemVM }) {
  return (
    <article className="group relative isolate grid aspect-[4/5] content-end overflow-hidden rounded-card bg-charcoal shadow-raised">
      {item.image ? (
        <Img
          image={item.image}
          sizes="(min-width: 1024px) 24rem, (min-width: 640px) 46vw, 80vw"
          className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-(--duration-slow) ease-out group-hover:scale-105"
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--color-black)_10%,rgb(0_0_0/0.8)_42%,transparent_72%)]"
      />
      <div className="grid gap-3 p-5">
        <h3 className="text-[2rem] leading-none normal-case sm:text-[2.25rem]">
          {/* Stretched: the whole card opens the dish; the order button sits above it. */}
          <Link href={item.href} className="after:absolute after:inset-0">
            {item.name}
          </Link>
        </h3>
        {item.description ? (
          <p className="line-clamp-2 text-small text-white/80">{item.description}</p>
        ) : null}
        <OrderButton
          links={item.orderLinks}
          item={item}
          placement="home-featured"
          className="btn btn-red relative z-10 w-full"
        />
      </div>
    </article>
  )
}
