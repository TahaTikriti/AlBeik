import { CategoryNav } from '@/components/menu/CategoryNav'
import { MenuSection } from '@/components/menu/MenuSection'
import { ui } from '@/components/ui/classes'
import type { MenuPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'

export function MenuView({ categories }: MenuPageData) {
  return (
    <>
      {/* Kept short: regulars come here to order, so the dishes start high on the page. */}
      <div className="grain relative">
        <h1 className={`${ui.container} text-display-1 pt-8 pb-6 md:pt-14 md:pb-8`}>
          The <em>menu</em>
        </h1>
      </div>
      {categories.length ? (
        <>
          <CategoryNav categories={categories.map(({ slug, name }) => ({ slug, name }))} />
          <div className={`${ui.container} grid gap-16 pt-8 pb-section md:gap-24 md:pt-12`}>
            {categories.map((category, i) => (
              <MenuSection key={category.id} category={category} preloadFirst={i === 0} />
            ))}
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
