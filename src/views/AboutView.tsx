import { Emphasis } from '@/components/ui/Emphasis'
import { Img } from '@/components/ui/Img'
import { RichText } from '@/components/ui/RichText'
import { ui } from '@/components/ui/classes'
import type { AboutPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Mustache } from '@/theme/motifs'

export function AboutView({ headline, body, images }: AboutPageData) {
  const [lead, ...more] = images
  return (
    <article className={`${ui.container} grid gap-8 pt-6 pb-4 md:pt-12`}>
      <header className="grid gap-3 md:max-w-[40rem]">
        <p className="label text-red">{copy.about.title}</p>
        <h1 className="text-display-1">
          {headline.text ? <Emphasis line={headline} /> : copy.about.title}
        </h1>
      </header>
      {lead ? (
        <Img
          image={lead}
          sizes="(min-width: 1152px) 72rem, 100vw"
          preload
          className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-raised md:aspect-[21/9]"
        />
      ) : null}
      {body ? (
        <div className="card mx-auto w-full max-w-[44rem] p-6 md:p-10">
          <Mustache className="mb-4 h-4 w-auto text-red" />
          <RichText
            data={body}
            className="grid gap-5 text-lg leading-relaxed [&_h2]:pt-4 [&_h2]:text-display-2 [&_h3]:text-display-3 [&_ol]:list-decimal [&_ol]:ps-6 [&_p:first-child]:text-xl [&_p:first-child]:font-semibold [&_p:first-child]:text-ink [&_ul]:list-disc [&_ul]:ps-6"
          />
        </div>
      ) : null}
      {more.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
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
      ) : null}
    </article>
  )
}
