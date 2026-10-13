import type { CategoryVM } from '@/lib/data/types'

import { MenuItemCard } from './MenuItemCard'

export function MenuSection({ category }: { category: CategoryVM }) {
  const headingId = `${category.slug}-heading`
  return (
    <section id={category.slug} data-anchor aria-labelledby={headingId} className="grid gap-stack">
      <h2 id={headingId} className="text-display-2">
        {category.name}
      </h2>
      <ul className="grid gap-stack sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item) => (
          <li key={item.id}>
            <MenuItemCard item={item} placement="menu" />
          </li>
        ))}
      </ul>
    </section>
  )
}
