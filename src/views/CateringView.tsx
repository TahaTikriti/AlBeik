import { CategoryNav } from '@/components/menu/CategoryNav'
import { PunchLine } from '@/components/ui/PunchLine'
import { ui } from '@/components/ui/classes'
import { trackOnClick } from '@/lib/analytics'
import type { CateringPageData, LocationVM } from '@/lib/data/types'
import { formatPrice } from '@/lib/text'
import { copy } from '@/theme/copy'
import { Smoke } from '@/theme/motifs'

type Props = CateringPageData & { location: LocationVM | null }

/**
 * The catering menu as a price list: trays, boxes and buffets by section,
 * with the section chips from the menu page. Ordering is a phone call (the
 * client hasn't named another channel yet), offered at the top and the end.
 */
export function CateringView({ intro, sections, terms, location }: Props) {
  const call =
    location?.phone && location.phoneHref ? (
      <a
        href={location.phoneHref}
        className="btn btn-red"
        {...trackOnClick('call_click', { placement: 'catering' })}
      >
        {copy.catering.call(location.phone)}
      </a>
    ) : null

  return (
    <>
      <header className="grain relative overflow-hidden">
        <Smoke />
        <div className={`${ui.container} grid gap-6 pt-12 pb-10 md:pt-20`}>
          <h1 className="text-display-1 max-w-[14ch]">
            <PunchLine text={copy.catering.heading} />
          </h1>
          <p className="max-w-[44ch] text-xl leading-snug">{intro}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {call}
            <p className="text-ink-muted">{copy.catering.leadTime}</p>
          </div>
        </div>
      </header>

      {/* Chips use the part before the colon: "Lebanese Feast", not the whole title. */}
      <CategoryNav
        categories={sections.map((s) => ({ slug: s.slug, name: s.title.split(':')[0]! }))}
      />

      <div className={`${ui.container} grid gap-16 pt-8 pb-section md:gap-20 md:pt-12`}>
        {sections.map((section) => (
          <section
            key={section.slug}
            id={section.slug}
            data-anchor
            aria-labelledby={`${section.slug}-heading`}
            className="grid gap-3"
          >
            <header className="draw-rule border-b-2 border-red pb-3">
              <h2 id={`${section.slug}-heading`} className="text-display-2 wrap-break-word">
                {section.title}
              </h2>
            </header>
            {section.note ? <p className="max-w-[60ch] text-ink-muted">{section.note}</p> : null}
            <ul className="grid md:grid-cols-2 md:gap-x-10">
              {section.items.map((item) => (
                <li key={item.name} className="grid content-start gap-2 border-b border-line py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[clamp(1.3rem,0.7rem+3vw,1.6rem)] leading-[1.05] normal-case">
                      {item.name}
                    </h3>
                    <p className="shrink-0 text-end font-display text-xl whitespace-nowrap">
                      {formatPrice(item.price)}
                      {item.unit ? (
                        <span className="block text-[0.7rem] tracking-[0.08em] text-ink-muted uppercase">
                          {item.unit}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  {item.tag ? (
                    <span className={`${ui.tag} justify-self-start text-red-text`}>
                      {copy.catering.tags[item.tag]}
                    </span>
                  ) : null}
                  {item.description ? (
                    <p className="max-w-[52ch] text-small text-ink-muted">{item.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section
          aria-labelledby="catering-order-heading"
          className="grid gap-6 rounded-card bg-surface-raised p-6 md:p-10"
        >
          <h2 id="catering-order-heading" className="text-display-2">
            {copy.catering.howTo}
          </h2>
          <ul className="grid max-w-[60ch] list-disc gap-2 ps-5 text-lg">
            {terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
          {location?.addressLines.length ? (
            <address className="grid not-italic">
              <span className="label text-red-text">{copy.location.address}</span>
              {location.addressLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          ) : null}
          <div className="justify-self-start">{call}</div>
        </section>
      </div>
    </>
  )
}
