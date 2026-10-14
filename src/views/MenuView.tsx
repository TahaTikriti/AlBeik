import { CategoryNav } from '@/components/menu/CategoryNav'
import { ItemSheetProvider } from '@/components/menu/ItemSheet'
import { MenuSection } from '@/components/menu/MenuSection'
import { Emphasis } from '@/components/ui/Emphasis'
import { ui } from '@/components/ui/classes'
import type { MenuPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'

export function MenuView({ categories }: MenuPageData) {
  return (
    <ItemSheetProvider>
      <div className={`${ui.container} grid gap-2 pt-6 pb-2 md:pt-10`}>
        <p className="label text-red">{copy.menu.kicker}</p>
        <h1 className="text-display-1">
          <Emphasis text={copy.menu.heading} />
        </h1>
      </div>
      {categories.length ? (
        <>
          <CategoryNav categories={categories.map(({ slug, name }) => ({ slug, name }))} />
          <div className={`${ui.container} grid gap-10 pt-4 pb-section`}>
            {categories.map((category, i) => (
              <MenuSection key={category.id} category={category} preloadFirst={i === 0} />
            ))}
          </div>
        </>
      ) : (
        <p className={`${ui.container} py-section text-lg`}>{copy.menu.empty}</p>
      )}
    </ItemSheetProvider>
  )
}
