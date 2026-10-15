'use client'

import { useEffect, useRef, useState } from 'react'

import type { CategoryRef } from '@/lib/data/types'
import { copy } from '@/theme/copy'

/**
 * Category chips that stick under the header. Plain anchor links (work
 * without JS); JS highlights the chip for the section in view and keeps it
 * centred in the bar.
 */
export function CategoryNav({ categories }: { categories: CategoryRef[] }) {
  const [active, setActive] = useState(categories[0]?.slug)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const visible = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting)
        const first = categories.find((c) => visible.get(c.slug))
        if (first) setActive(first.slug)
      },
      { rootMargin: '-25% 0px -65% 0px' },
    )
    for (const { slug } of categories) {
      const section = document.getElementById(slug)
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [categories])

  useEffect(() => {
    const list = listRef.current
    const chip = list?.querySelector<HTMLElement>(`[data-slug="${active}"]`)
    if (!list || !chip) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({
      left: chip.offsetLeft - (list.clientWidth - chip.clientWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [active])

  return (
    <nav
      aria-label={copy.menu.categoriesLabel}
      className="sticky top-header z-(--z-sticky) border-b border-line bg-black/90 backdrop-blur-md"
    >
      <ul
        ref={listRef}
        className="mx-auto flex h-chipbar max-w-content snap-x items-center gap-2 overflow-x-auto px-gutter [scrollbar-width:none]"
      >
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0 snap-center">
            <a
              href={`#${category.slug}`}
              data-slug={category.slug}
              aria-current={active === category.slug ? 'true' : undefined}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-charcoal px-4 font-display text-[1.15rem] tracking-[0.04em] uppercase transition-[background-color,border-color,scale] duration-(--duration-base) ease-snap hover:border-white aria-[current=true]:scale-105 aria-[current=true]:border-red aria-[current=true]:bg-red"
            >
              {category.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
