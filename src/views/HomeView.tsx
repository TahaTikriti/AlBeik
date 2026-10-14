import Link from 'next/link'

import { OrderButton } from '@/components/order/OrderButton'
import { Emphasis } from '@/components/ui/Emphasis'
import { Img } from '@/components/ui/Img'
import { Marquee } from '@/components/ui/Marquee'
import { Media } from '@/components/ui/Media'
import { ui } from '@/components/ui/classes'
import type { HomePageData, MenuItemVM, RichLine, SiteVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { FlipDigits, HalalSticker, Mustache, Smoke, Steam } from '@/theme/motifs'

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

      {/* HERO */}
      <section className="grain relative overflow-hidden">
        <Smoke />
        <div
          className={`${ui.container} grid gap-10 pt-10 pb-16 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-16 md:pb-24`}
        >
          <div className="grid gap-6">
            <Mustache className="h-7 w-auto self-start text-white" />
            <p className="label text-red-text">{copy.home.heroKicker}</p>
            <h1 className="grid gap-3">
              <span className="text-display-1 block">
                <Emphasis line={shout} />
              </span>
              {followUp ? (
                <span className="block font-display text-[clamp(1.6rem,1.2rem+2vw,2.6rem)] leading-[0.95] text-ink-muted">
                  <Emphasis line={followUp} />
                </span>
              ) : null}
            </h1>
            {hero.subline ? (
              <p className="max-w-[28ch] text-lg text-ink-muted">{hero.subline}</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <OrderButton
                links={site.storeOrderLinks}
                placement="home-hero"
                label={copy.order.stickyLabel}
                className="btn btn-red min-h-14 px-8 text-[1.5rem]"
              />
              <Link href="/menu" className="btn btn-ghost min-h-14 px-7 text-[1.5rem]">
                {copy.home.seeMenu}
              </Link>
            </div>
          </div>

          {hero.media ? (
            <div className="relative mx-2 mt-4 md:mx-0">
              <div className="absolute -inset-3 -rotate-3 rounded-[2rem] bg-red" aria-hidden />
              <div className="relative rotate-2 overflow-hidden rounded-[1.75rem] shadow-raised">
                <Media
                  media={hero.media}
                  sizes="(min-width: 768px) 46vw, 92vw"
                  preload
                  className="aspect-[4/3] w-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
                  aria-hidden
                />
              </div>
              <Steam />
              <HalalSticker className="absolute -top-8 right-1 text-[0.85rem] sm:text-base" />
            </div>
          ) : null}
        </div>
      </section>

      <Marquee items={copy.marquee} />

      {/* SIGNATURES */}
      {featured.length ? (
        <section
          aria-labelledby="featured-heading"
          className={`${ui.container} ${ui.section} grid gap-14`}
        >
          <div className="grid gap-3">
            <p className="label text-red-text">{copy.home.featuredKicker}</p>
            <h2 id="featured-heading" className="text-display-1">
              <Emphasis text={copy.home.featuredTitle} />
            </h2>
          </div>
          <ol className="grid gap-24 pt-14 md:grid-cols-2 md:gap-8 md:pt-16">
            {featured.map((item, i) => (
              <li key={item.id}>
                <SignatureCard item={item} number={i + 1} />
              </li>
            ))}
          </ol>
          <Link href="/menu" className="btn btn-ghost justify-self-start">
            {copy.home.fullMenu} →
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
                  className="aspect-[4/5] w-full rotate-[-2deg] rounded-card object-cover shadow-raised"
                />
                <Mustache className="absolute -bottom-6 -left-2 h-12 w-auto text-white drop-shadow-lg" />
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
            <ul className="-mx-gutter flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-4 [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible">
              {testimonials.map((t) => (
                <li key={t.id} className="w-[86%] shrink-0 snap-start md:w-auto">
                  <figure className="grid h-full content-between gap-6 rounded-card bg-black p-6 text-white">
                    <blockquote className="grid gap-3">
                      <span aria-hidden className="font-display text-7xl leading-[0.5] text-red">
                        “
                      </span>
                      <p className="text-lg leading-snug">{t.quote}</p>
                    </blockquote>
                    <figcaption className="flex items-center gap-3">
                      <Mustache className="h-3 w-auto text-red" />
                      <span className="font-display text-xl uppercase">{t.name}</span>
                      {t.source ? <span className="label text-ash">{t.source}</span> : null}
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
        <div className={`${ui.container} ${ui.section} grid gap-6 md:grid-cols-2 md:items-end`}>
          <div className="grid gap-4">
            <h2 id="visit-heading" className="text-mega">
              <Emphasis text={copy.home.visitTitle} />
            </h2>
            <p className="max-w-[30ch] text-lg text-ink-muted">{copy.home.visitBody}</p>
          </div>
          <div className="grid gap-4 md:justify-items-end md:text-right">
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
              {copy.location.directions} →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

/** "100% *Halal*, Fresh & Delicious" → giant outlined "100%", the rest stacked below. */
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
      <span className="outline-text block [-webkit-text-stroke-color:var(--color-white)]">
        {first}
      </span>
      <span className="block text-[0.62em] leading-[0.9] [&_em]:text-white">
        <Emphasis line={restLine} />
      </span>
    </>
  )
}

function SignatureCard({ item, number }: { item: MenuItemVM; number: number }) {
  return (
    <article
      data-theme="inverse"
      className="reveal relative grid gap-5 rounded-[2rem] px-6 pt-44 pb-6 sm:pt-52"
    >
      {item.image ? (
        <Link
          href={item.href}
          tabIndex={-1}
          aria-hidden
          className="absolute -top-14 left-1/2 w-52 -translate-x-1/2 sm:-top-16 sm:w-64"
        >
          <Img
            image={item.image}
            sizes="(min-width: 640px) 16rem, 13rem"
            className="aspect-square w-full rounded-full object-cover shadow-[0_0_0_8px_var(--color-black),0_30px_60px_rgb(0_0_0/0.55)] transition-transform duration-(--duration-slow) hover:-rotate-6"
          />
        </Link>
      ) : null}
      <div className="grid gap-3">
        <FlipDigits
          value={String(number).padStart(2, '0')}
          className="text-[1.9rem] [&_.flip-tile]:[background:linear-gradient(#161616_0_50%,#000_50%_100%)]"
        />
        <h3 className="text-display-2">
          <Link href={item.href} className="hover:underline">
            {item.name}
          </Link>
        </h3>
        {item.description ? <p className="text-lg leading-snug">{item.description}</p> : null}
      </div>
      <OrderButton
        links={item.orderLinks}
        item={item}
        placement="home-featured"
        className="btn btn-ink w-full"
      />
    </article>
  )
}
