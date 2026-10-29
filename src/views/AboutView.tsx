import Link from 'next/link'

import { Img } from '@/components/ui/Img'
import { PunchLine } from '@/components/ui/PunchLine'
import { RichText } from '@/components/ui/RichText'
import { ui } from '@/components/ui/classes'
import type { AboutPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Divider, Mustache, Smoke } from '@/theme/motifs'

export function AboutView({ headline, body, images }: AboutPageData) {
  const [lead, ...more] = images
  return (
    <article>
      <header className="grain relative overflow-hidden">
        <Smoke />
        <div className={`${ui.container} grid gap-5 pt-12 pb-14 md:pt-20`}>
          <p className="label text-red-text">{copy.about.title}</p>
          <h1 className="text-display-1 max-w-[14ch]">
            {headline.text ? <PunchLine line={headline} /> : copy.about.title}
          </h1>
        </div>
      </header>

      {lead ? (
        <figure className="relative overflow-clip">
          <Img
            image={lead}
            sizes="100vw"
            preload
            className="parallax aspect-[3/2] max-h-[70vh] w-full object-cover md:aspect-[21/9]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"
            aria-hidden
          />
          <Mustache className="absolute bottom-6 left-gutter h-8 w-auto text-white" />
        </figure>
      ) : null}

      <div className={`${ui.container} grid gap-10 py-section`}>
        {body ? (
          <RichText
            data={body}
            className="mx-auto grid w-full max-w-[40rem] gap-6 text-xl leading-relaxed [&_h2]:pt-8 [&_h2]:text-display-2 [&_h2]:text-red-text [&_h3]:text-display-3 [&_ol]:list-decimal [&_ol]:ps-6 [&_p:first-child]:text-[1.45rem] [&_p:first-child]:leading-snug [&_p:first-child]:font-medium [&_p:first-child]:text-white [&_ul]:list-disc [&_ul]:ps-6"
          />
        ) : null}
        {/* Never a dead end: the menu, or the way to the door. */}
        <div className="mx-auto flex w-full max-w-[40rem] flex-wrap gap-3">
          <Link href="/menu" className="btn btn-red">
            {copy.about.menuCta}
          </Link>
          <Link href="/visit" className="btn btn-ghost">
            {copy.about.visitCta}
          </Link>
        </div>
      </div>

      <Divider />

      {more.length ? (
        <ul className={`${ui.container} grid gap-4 py-section sm:grid-cols-2`}>
          {more.map((image) => (
            <li key={image.url}>
              <Img
                image={image}
                sizes="(min-width: 640px) 50vw, 100vw"
                className="h-auto w-full rounded-card"
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="h-section" />
      )}
    </article>
  )
}
