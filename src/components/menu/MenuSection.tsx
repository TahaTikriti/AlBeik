import type { CategoryVM } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { FlipDigits } from '@/theme/motifs'

import { MenuItemCard } from './MenuItemCard'

export function MenuSection({
  category,
  number,
  preloadFirst = false,
}: {
  category: CategoryVM
  number: number
  preloadFirst?: boolean
}) {
  const headingId = `${category.slug}-heading`
  return (
    <section id={category.slug} data-anchor aria-labelledby={headingId} className="grid gap-8">
      <header className="flex items-end gap-4 border-b-2 border-red pb-3">
        <FlipDigits value={String(number).padStart(2, '0')} className="text-[2.6rem]" />
        <h2 id={headingId} className="text-display-2">
          {category.name}
        </h2>
        <span className="label ms-auto pb-2 text-ink-muted">
          {copy.menu.count(category.items.length)}
        </span>
      </header>
      <ul className="grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-20 lg:grid-cols-3">
        {category.items.map((item, i) => (
          <li key={item.id}>
            <MenuItemCard item={item} placement="menu" preloadImage={preloadFirst && i === 0} />
          </li>
        ))}
      </ul>
    </section>
  )
}
