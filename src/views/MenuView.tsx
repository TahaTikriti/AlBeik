import { CategoryNav } from '@/components/menu/CategoryNav'
import { MenuSection } from '@/components/menu/MenuSection'
import { ui } from '@/components/ui/classes'
import type { MenuPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'

export function MenuView({ categories }: MenuPageData) {
  return (
    <>
      <div className={`${ui.container} pt-section pb-stack`}>
        <h1 className="text-display-1">{copy.menu.title}</h1>
      </div>
      {categories.length ? (
        <>
          <CategoryNav categories={categories.map(({ slug, name }) => ({ slug, name }))} />
          <div className={`${ui.container} grid gap-section py-section`}>
            {categories.map((category) => (
              <MenuSection key={category.id} category={category} />
            ))}
          </div>
        </>
      ) : (
        <p className={`${ui.container} pb-section`}>{copy.menu.empty}</p>
      )}
    </>
  )
}
