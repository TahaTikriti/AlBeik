import type { CategoryVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { MenuItemCard } from './MenuItemCard'

export function MenuSection({
  category,
  preloadFirst = false,
}: {
  category: CategoryVM
  preloadFirst?: boolean
}) {
  const headingId = `${category.slug}-heading`
  return (
    <section id={category.slug} data-anchor aria-labelledby={headingId} className="grid gap-8">
      {/* Wraps the count under a long name rather than pushing past the screen. */}
      <header className="draw-rule flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-red pb-3">
        <h2 id={headingId} className="min-w-0 text-display-2 wrap-break-word">
          {category.name}
        </h2>
        <span className="label text-ink-muted">{copy.menu.count(category.items.length)}</span>
      </header>
      {/* Equal rows: every card in the list is the same size. */}
      <ul className="grid auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {category.items.map((item, i) => (
          <li key={item.id} className="min-w-0">
            <MenuItemCard item={item} placement="menu" preloadImage={preloadFirst && i === 0} />
          </li>
        ))}
      </ul>
    </section>
  )
}
