import Link from 'next/link'

import { CategoryNav } from '@/components/menu/CategoryNav'
import { MenuSection } from '@/components/menu/MenuSection'
import { Emphasis } from '@/components/ui/Emphasis'
import { PunchLine } from '@/components/ui/PunchLine'
import { ui } from '@/components/ui/classes'
import { trackOnClick } from '@/lib/analytics'
import type { LocationVM, MenuPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'

type Props = MenuPageData & { location: LocationVM | null }

export function MenuView({ categories, location }: Props) {
  return (
    <>
      {/* Kept short: regulars come here to order, so the dishes start high on the page. */}
      <div className="grain relative">
        <h1 className={`${ui.container} text-display-1 pt-8 pb-6 md:pt-14 md:pb-8`}>
          <PunchLine text="The *menu*" />
        </h1>
      </div>
      {categories.length ? (
        <>
          <CategoryNav categories={categories.map(({ slug, name }) => ({ slug, name }))} />
          <div className={`${ui.container} grid gap-16 pt-8 pb-section md:gap-24 md:pt-12`}>
            {categories.map((category, i) => (
              <MenuSection key={category.id} category={category} preloadFirst={i === 0} />
            ))}
            {/* After the dishes: the halal answer, and where the big orders go. */}
            <aside className="grid gap-4 md:grid-cols-2">
              <div className="grid content-start gap-3 rounded-card bg-surface-raised p-6 md:p-8">
                <p className="text-display-3 font-display uppercase">
                  <Emphasis text={copy.menu.halalTitle} />
                </p>
                <p className="max-w-[44ch] text-ink-muted">{copy.menu.halalNote}</p>
                {location?.phone && location.phoneHref ? (
                  <a
                    href={location.phoneHref}
                    className="btn btn-ghost justify-self-start"
                    {...trackOnClick('call_click', { placement: 'menu' })}
                  >
                    {copy.location.call(location.phone)}
                  </a>
                ) : null}
              </div>
              <div className="grid content-start gap-3 rounded-card bg-surface-raised p-6 md:p-8">
                <p className="text-display-3 font-display uppercase">{copy.catering.band}</p>
                <p className="max-w-[44ch] text-ink-muted">{copy.menu.cateringNote}</p>
                <Link href="/catering" className="btn btn-ghost justify-self-start">
                  {copy.catering.bandLink}
                </Link>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <p className={`${ui.container} pb-section font-display text-display-2 uppercase`}>
          {copy.menu.empty}
        </p>
      )}
    </>
  )
}
