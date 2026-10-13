import type { CategoryVM } from '@/lib/data/types'

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
    <section id={category.slug} data-anchor aria-labelledby={headingId} className="grid gap-stack">
      <h2 id={headingId} className="text-display-2">
        {category.name}
      </h2>
      <ul className="grid gap-stack sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item, i) => (
          <li key={item.id}>
            <MenuItemCard item={item} placement="menu" preloadImage={preloadFirst && i === 0} />
          </li>
        ))}
      </ul>
    </section>
  )
}
