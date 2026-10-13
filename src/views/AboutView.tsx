import { Emphasis } from '@/components/ui/Emphasis'
import { Img } from '@/components/ui/Img'
import { RichText } from '@/components/ui/RichText'
import { ui } from '@/components/ui/classes'
import type { AboutPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'

export function AboutView({ headline, body, images }: AboutPageData) {
  return (
    <article className={`${ui.container} ${ui.section} grid gap-section`}>
      <div className="grid max-w-prose gap-stack">
        <h1 className="text-display-1">
          {headline.text ? <Emphasis line={headline} /> : copy.about.title}
        </h1>
        {body ? (
          <RichText
            data={body}
            className="grid gap-stack [&_h2]:text-display-2 [&_h3]:text-display-3 [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6"
          />
        ) : null}
      </div>
      {images.length ? (
        <ul className="grid gap-stack sm:grid-cols-2">
          {images.map((image) => (
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
