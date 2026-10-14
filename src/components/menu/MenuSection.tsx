import type { CategoryVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'

import { MenuItemCard } from './MenuItemCard'

export function MenuSection({
  category,
  preloadFirst = false,
}: {
  category: CategoryVM
  number?: number
  preloadFirst?: boolean
}) {
  const headingId = `${category.slug}-heading`
  return (
    <section id={category.slug} data-anchor aria-labelledby={headingId} className="grid gap-4">
      <header className="flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-display-2">
          {category.name}
        </h2>
        <span className="text-small font-semibold text-ink-muted">
          {copy.menu.count(category.items.length)}
        </span>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item, i) => (
          <li key={item.id}>
            <MenuItemCard item={item} placement="menu" preloadImage={preloadFirst && i === 0} />
          </li>
        ))}
      </ul>
    </section>
  )
}
