import { CategoryNav } from '@/components/menu/CategoryNav'
import { MenuSection } from '@/components/menu/MenuSection'
import { ui } from '@/components/ui/classes'
import type { MenuPageData } from '@/lib/data/types'
import { copy } from '@/theme/copy'
import { Smoke } from '@/theme/motifs'

export function MenuView({ categories }: MenuPageData) {
  return (
    <>
      <div className="grain relative overflow-hidden">
        <Smoke className="opacity-80" />
        <div className={`${ui.container} grid gap-3 pt-10 pb-10 md:pt-20`}>
          <p className="label text-red-text">{copy.menu.kicker}</p>
          <h1 className="text-mega">
            The <em>menu</em>
          </h1>
        </div>
      </div>
      {categories.length ? (
        <>
          <CategoryNav categories={categories.map(({ slug, name }) => ({ slug, name }))} />
          <div className={`${ui.container} grid gap-24 py-section`}>
            {categories.map((category, i) => (
              <MenuSection
                key={category.id}
                category={category}
                number={i + 1}
                preloadFirst={i === 0}
              />
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
